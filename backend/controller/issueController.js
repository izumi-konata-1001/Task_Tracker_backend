const issueDao = require('../dao/issueDao');
const taskDao = require('../dao/taskDao');

async function getIssuesByUserId(req, res) {
  const userId = req.user.id;
  const order = req.body.order || 'DESC';
  const page = parseInt(req.body.page) || 1;
  const pageSize = parseInt(req.body.pageSize) || 10;
  const offset = (page - 1) * pageSize;

  try {
    let issues;

    if (order === 'DESC') 
        issues = await issueDao.getIssuesByUserIdDESC(userId, offset, pageSize);
    else if (order === 'ASC') 
        issues = await issueDao.getIssuesByUserIdASC(userId, offset, pageSize);
    else
        return res.status(409).json({ error: 'Invalid order.' });

    const total = await issueDao.countIssuesByUserId(userId);

    if (!issues || issues.length === 0) 
        return res.status(404).json({ error: 'No issues found in database.' });

    return res.status(200).json({
        message: `Get issues successfully, order: ${order}`,
        issues: issues,
        total: total,
        page: page,
        pageSize: pageSize,
    });
    }catch (error) {
        console.error('Get issues by user id error:', error);
        return res.status(500).json({ error: 'Internal server error.' });
    }
}

async function getIssueByIssueId(req,res){
    const userId = req.user.id;
    const issueId = req.body.issueId;

    try{
        const issue = await issueDao.getIssueByIssueId(issueId);
        if(!issue)
            return res.status(409).json({error:'Failed to get issue by issue id in database.'});
        if(issue.user_id != userId)
            return res.status(403).json({error:'Token invalid.'});

        const tasks = await taskDao.getTaskByIssueId(issueId);
        if(!tasks){
            return res.status(200).json({
                message:'Get issue by issue id successfully.',
                issue: issue,
                tasks:null,
            })
        }
        return res.status(200).json({
            message:'Get issue by issue id successfully.',
            issue: issue,
            tasks:tasks,
        })
    }catch(error){
        console.error('Get issue by issue id failed, error:', error);
        return res.status(500).json({error:'Internal server error.'});   
    }
}

async function createIssue(req,res){
    const userId = req.user.id;
    const title = req.body.title;
    const description = req.body.description;
    const newAddTasks = req.body.newAddTasks;
    try{
        const createIssueResult = await issueDao.createIssue(userId, title, description);
        if(!createIssueResult)
            return res.status(409).json({error:'Create Issue failed in database.'});
        if(!newAddTasks || newAddTasks.length == 0)
            return res.status(200).json({message:'Create issue without tasks successfully.'});
        
        const issueId = createIssueResult;
        for (let i = 0; i < newAddTasks.length; i++) {
        const task = newAddTasks[i];
        const addTaskIntoIssueResult = await taskDao.addTaskIntoIssue(task.id, issueId, i + 1);
        if (!addTaskIntoIssueResult)
            return res.status(409).json({ error: `Add task into issue failed in database, task id: ${task.id}` });
        }

        return res.status(200).json({message:'Create issue and add tasks into issue successfully.'});
    }catch(error){
        console.error('Create new issue failed, error:', error);
        return res.status(500).json({error:'Internal server error.'});
    }
}

async function editIssue(req,res){
    const userId = req.user.id;
    const issueId = req.body.issueId;
    const newTitle = req.body.title;
    const newDescription = req.body.description;

    try{
        const issue = await issueDao.getIssueByIssueId(issueId);
        if(issue.user_id != userId)
            return res.status(403).json({error:'Token invalid.'});

        if(newTitle !== undefined){
            const editTitleResult = await issueDao.changeTitle(issueId,newTitle);
            if(!editTitleResult){
                console.error('Edit issue title failed.');
                return res.status(409).json({error:'Edit issue title failed.'});
            }
        }
        if(newDescription !== undefined){
            const editDescriptionResult = await issueDao.changeDescription(issueId, newDescription);
            if(!editDescriptionResult){
                console.error('Edit issue description failed.');
                return res.status(409).json({error:'Edit issue description failed.'});
            }
        }
        return res.status(200).json({message:'Edit issue successfully.'});
    }catch(error){
        console.error('Edit issue failed,error:', error);
        return res.status(500).json({error:'Internal server error.'});
    }
}

async function changeTasksOrderInIssue(req, res){
    const userId = req.user.id;
    const tasks = req.body.tasks;
    const issueId = req.body.issueId;
    try{
        const issue = await issueDao.getIssueByIssueId(issueId);
        if(issue.user_id != userId)
            return res.status(403).json({error:'Token invalid. here'});
        for(let i = 0; i < tasks.length; i++)
        {
            const taskId = tasks[i].id;
            const task = await taskDao.getTaskByTaskId(taskId);
            if(task.user_id != userId)
                return res.status(403).json({error:'Token invalid.'});
        }

        const resetTasksOrderResult = await taskDao.resetTasksBelongToIssue(issueId);
        if(!resetTasksOrderResult)
            return res.status(404).json({error: 'Issue has no task.'});
        
        for(let i = 0; i < tasks.length; i++){
            const changeStepNumberResult = await taskDao.addTaskIntoIssue(tasks[i].id, issueId, i + 1);
            if(!changeStepNumberResult)
                return res.status(409).json({error:`Change task (id: ${tasks[i].id}) step number failed.`});
        }
        return res.status(200).json({message:'Change tasks order successfully.'});
    }catch(error){
        console.error('Change tasks order failed, error:', error);
        return res.status(500).json({error:'Internal server error.'});
    }
}

async function deleteIssue(req, res){
    const userId = req.user.id;
    const issueId = req.body.issueId;
    try{
        const issue = await issueDao.getIssueByIssueId(issueId);
        if(issue.user_id != userId)
            return res.status(403).json({error:'Token invalid.'});

        const tasks = await taskDao.getTaskByIssueId(issueId);
        if(tasks.length > 0){
            const resetTasksOrderResult = await taskDao.resetTasksBelongToIssue(issueId);
            if(!resetTasksOrderResult)
                return res.status(409).json({error:'Remove tasks from issue failed.'});
            const deleteIssueResult = await issueDao.deleteIssue(userId,issueId);
            if(!deleteIssueResult)
                return res.status(409).json({error:'Delete issue failed.'});
            return res.status(200).json({message:'Delete issue successfully.'})
        }
        else{
            const deleteIssueResult = await issueDao.deleteIssue(userId,issueId);
            if(!deleteIssueResult)
                return res.status(409).json({error:'Delete issue failed.'});
            return res.status(200).json({message:'Delete issue successfully.'})
        }
    }catch(error){
        console.error('Delete issue failed, error:', error);
        return res.status(500).json({error:'Internal server error.'});
    }
}

async function getAllIssuesWithTaskByUserId(req, res){
    const userId = req.user.id;
    try{
        const issueIds = await issueDao.getIssuesIdWithIncompletedTasksByUserId(userId);
        if(!issueIds || issueIds.length === 0)
            return res.status(404).json({error:'No issue has task.'});
        let issues = [];
        for (let i = 0; i < issueIds.length; i++){
            const issueId = issueIds[i].issue_id;
            const issue = await issueDao.getIssueByIssueId(issueId);
            if(!issue){
                console.warn(`Issue ${issueId} not found.`);
                return res.status(409).json({error:'Issue not found.'});
            }
            issues.push(issue);
        }
        if(issues.length === 0)
            return res.status(404).json({error:'No valid issues found.'})
        return res.status(200).json({
            message:'Get all issues with task by user id successfully.',
            issues:issues,
        })
    }catch(error){
        console.error('Get all issue with tasks by user id failed, error:', error);
        return res.status(500).json({error:'Internal server error.'});
    }
}

async function getTaskNotCompletedInIssue(req,res){
    const userId = req.user.id;
    const issueId = req.body.issueId;
    try{
        const issue = await issueDao.getIssueByIssueId(issueId);
        if(issue.user_id != userId)
            return res.status(403).json({error:'Token invalid.'});

        const tasks = await taskDao.getTasksBelongToIssueNotComplete(issueId);
        if(!tasks)
            return res.status(404).json({error:'No task is not completed in this issue.'});
        return res.status(200).json({
            message:'Get tasks belong to the issue has not completed.',
            tasks:tasks,
        })
    }catch(error){
        console.error('Get task, belong to this issue, is not completed failed, error:', error);
        return res.status(500).json({error:'Internal server error.'});
    }
}

module.exports ={
    getIssuesByUserId,
    getIssueByIssueId,
    createIssue,
    editIssue,
    changeTasksOrderInIssue,
    deleteIssue,
    getAllIssuesWithTaskByUserId,
    getTaskNotCompletedInIssue,
}