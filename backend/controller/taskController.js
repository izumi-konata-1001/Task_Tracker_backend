const taskDao = require('../dao/taskDao');
const issueDao = require('../dao/issueDao');
const pomodoroDao = require('../dao/pomodoroDao');

async function getTaskByUserId(req, res) {
  const userId = req.user.id;
  const order = req.body.order || 'DESC';
  const page = parseInt(req.body.page) || 1;
  const pageSize = parseInt(req.body.pageSize) || 10;
  const offset = (page - 1) * pageSize;

  try {
    let tasks;
    if (order === 'DESC') {
      tasks = await taskDao.getTasksByUserIdDESC(userId, offset, pageSize);
    } else if (order === 'ASC') {
      tasks = await taskDao.getTasksByUserIdASC(userId, offset, pageSize);
    } else {
      return res.status(409).json({ error: 'Invalid order.' });
    }

    const total = await taskDao.countTasksByUserId(userId);
    if(tasks.length < 1)
        return res.status(404).json({error:'No task found.'});
    
    return res.status(200).json({
      message: `Get tasks successfully, order: ${order}`,
      tasks: tasks,
      total: total,
      page: page,
      pageSize: pageSize,
    });
  } catch (error) {
    console.error('Get tasks by user id error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}


async function getTaskByTaskId(req,res){
    const taskId = req.body.taskId;
    const userId = req.user.id;

    try{
        const task = await taskDao.getTaskByTaskId(taskId);
        if(!task)
            return res.status(404).json({error:'Task no found in database.'});

        if(task.user_id != userId)
            return res.status(403).json({error:'Token invalid.'});

        const sessions = await pomodoroDao.getSessionByTaskId(task.id);
        if(!task.issue_id)
        {
            if(sessions){
                return res.status(200).json({
                    message:'Find task successfully.',
                    task:task,
                    issue:null,
                    sessions:sessions,
                });
            }
            else{
                return res.status(200).json({
                    message:'Find task successfully.',
                    task:task,
                    issue:null,
                    sessions:null,
                });
            }
        }
        const issue = await issueDao.getIssueByIssueId(task.issue_id);
        if(!issue)
            return res.status(409).json({error:'Issue, task belong to, not found in database.'});
        if(sessions){
            return res.status(200).json({
                message:'Find task successfully.',
                task:task,
                issue:issue,
                sessions:sessions,
            })
        }else{
            return res.status(200).json({
                message:'Find task successfully.',
                task:task,
                issue:issue,
                sessions:null,
            })
        }
    }catch(error){
        console.error('Get task by task id failed, error:', error);
        return res.status(500).json({error:'Internal server error'});
    }
}

async function createTask(req,res){
    const userId = req.user.id;
    const description = req.body.description;
    const title = req.body.title;
    const completeStatus = req.body.completeStatus;
    const issueId = null;
    const stepNumber = null;

    try{
        const createdTaskId = await taskDao.createTask(userId, issueId, stepNumber, title, description, completeStatus);
        if(!createdTaskId)
            return res.status(409).json({error:'Create task failed in database.'});
        return res.status(200).json({message:`Task create successfully, task id:${createdTaskId}`})
    }catch(error){
        console.error('Create task failed, error:', error);
        return res.status(500).json({error:'Internal server error'});
    }
}

async function editTask(req,res){
    const userId = req.user.id;
    const taskId = req.body.taskId;
    const newTitle = req.body.title;
    const newDescription = req.body.description;
    const newCompleteStatus = req.body.completeStatus;

    try{
        const isTaskExitResult = await taskDao.isTaskExit(taskId);
        if(!isTaskExitResult)
            return res.status(404).json({error:'Task no found in database'});
        const task = await taskDao.getTaskByTaskId(taskId);
        if(task.user_id != userId)
            return res.status(403).json({error:'Token invalid.'});
        if(newTitle !== undefined){
            const result = await taskDao.changeTitle(taskId, newTitle);
            if(!result)
                return res.status(409).json({error:'Edit task title failed in database.'});
        }
        if(newDescription !== undefined){
            const result = await taskDao.changeDescription(taskId, newDescription);
            if(!result)
                return res.status(409).json({error:'Edit task description failed in database.'});
        }
        if(newCompleteStatus !== undefined){
            const result = await taskDao.changeCompleteStatus(taskId, newCompleteStatus);
            if(!result)
                return res.status(409).json({error:'Edit task complete status failed in database.'});
        }
        return res.status(200).json({message:'Task edit successfully.'})
    }catch(error){
        console.error('Edit task failed, error:', error);
        return res.status(500).json({error:'Internal server error.'});
    }
}

async function editCompleteStatus(req,res){
    const userId = req.user.id;
    const taskId = req.body.taskId;
    const newCompleteStatus = req.body.completeStatus;

    try{
        const isTaskExitResult = await taskDao.isTaskExit(taskId);
        if(!isTaskExitResult)
            return res.status(404).json({error:'Task no found in database'});
        const task = await taskDao.getTaskByTaskId(taskId);
        if(task.user_id != userId)
            return res.status(403).json({error:'Token invalid.'});
        const result = await taskDao.editCompleteStatus(taskId, newCompleteStatus);
        if(!result)
            return res.status(409).json({error:'Edit task complete status failed in database'});
        return res.status(200).json({message:'Edit task complete status successfully'});
    }catch(error){
        console.error('Edit complete error, error:', error);
        return res.status(500).json({error:'Internal server error.'});
    }
}

async function removeFromIssueAndEditOtherStep(req,res){
    const userId = req.user.id;
    const issueId = req.body.issueId;
    const taskId = req.body.taskId;

    try{
        const taskNeedToRemove = await taskDao.getTaskByTaskId(taskId);
        if(!taskNeedToRemove)
            return res.status(404).json({error:'Task not found in database.'})
        const task = await taskDao.getTaskByTaskId(taskId);
        if(task.user_id != userId)
            return res.status(403).json({error:'Token invalid.'});
        
        const stepNeedToRemove = taskNeedToRemove.step_number;

        const tasksBelongToIssue = await taskDao.getTaskByIssueId(issueId);
        if(!tasksBelongToIssue)
            return res.status(404).json({error:'No tasks found link to this issue in database.'});
        
        const removeTaskResult = await taskDao.deleteTaskFromIssue(taskId);
        if(!removeTaskResult)
            return res.status(409).json({error:'Remove task from issue failed in database.'});

        let counter = stepNeedToRemove;
        for(const task of tasksBelongToIssue){
            if(task.step_number > stepNeedToRemove) {
                const changeResult = await taskDao.changeStepNumber(task.id, counter);
                if(!changeResult)
                    return res.status(409).json({errpr:'Change other task step number failed in database.'});
                counter ++;
            }
        }
        return res.status(200).json({message:'Delete task from issue successfully.'});
        
    }catch(error){
        console.error('Delete task from issue failed, error:', error);
        return res.status(500).json({error:'Internal server error.'});
    }
}

async function getTasksNotBelongToAnyIssue(req,res){
    const userId = req.user.id;
    try{
        const tasksNotBelongToAnyIssue = await taskDao.getTasksNotBelongToIssue(userId);
        if(!tasksNotBelongToAnyIssue)
            return res.status(404).json({error:'No task is avaliable in database.'});
        return res.status(200).json({
            message:'Get tasks not belong to any issue successfully',
            tasks:tasksNotBelongToAnyIssue,
        });
    }catch(error){
        console.error('Get task not belong to any issue failed, error:', error);
        return res.status(500).json({error:'Internal server error.'});
    }
}

async function addTaskIntoIssue(req,res){
    const userId = req.user.id;
    const taskId = req.body.taskId;
    const issueId = req.body.issueId;

    try{
        const task = await taskDao.getTaskByTaskId(taskId);
        if(task.user_id != userId)
            return res.status(403).json({error:'Token invalid.'});
        const issue = await issueDao.getIssueByIssueId(issueId);
        if(issue.user_id != userId)
            return res.status(403).json({error:'Token invalid.'});

        const tasksBelongToIssue = await taskDao.getTaskByIssueId(issueId);
        const nextStep = tasksBelongToIssue ? tasksBelongToIssue.length + 1 : 1;
        const addTaskIntoIssueResult = await taskDao.addTaskIntoIssue(taskId, issueId, nextStep);
        
        if(!addTaskIntoIssueResult)
            return res.status(409).json({error: 'Add task into isse failed.'});
        return res.status(200).json({message:'Add task into issue successfully.'})
    }catch(error){
        console.error('Add task into issue failed, error:', error);
        return res.status(500).json({error:'Internal server error.'});
    }
}

async function deleteTask(req, res){
    const userId = req.user.id;
    const taskId = req.body.taskId;

    try{
        const task = await taskDao.getTaskByTaskId(taskId);
        if(task.user_id != userId)
            return res.status(403).json({error:'Token invalid.'});
        const taskNeedToRemove = await taskDao.getTaskByTaskId(taskId);
        if(!taskNeedToRemove)
            return res.status(404).json({error:'Task not found in database.'})
    
        const issueId = taskNeedToRemove.issue_id;
        if(!issueId){
            const deleteTaskResult = await taskDao.deleteTask(taskId);
            if(!deleteTaskResult)
                return res.status(409).json({error:'Delete task dailed in databse.'});
            return res.status(200).json({message:'Delete task successfully.'});
        }

        const tasksBelongToIssue = await taskDao.getTaskByIssueId(issueId);
        if(!tasksBelongToIssue)
            return res.status(404).json({error:'No tasks found link to this issue in database.'});
        else if(tasksBelongToIssue.length == 1)
        {
            const deleteTaskResult = await taskDao.deleteTask(taskId);
            if(!deleteTaskResult)
                return res.status(409).json({error:'Delete task dailed in databse.'});
            return res.status(200).json({message:'Delete task successfully.'}); 
        }
        else{
            const removeTaskResult = await taskDao.deleteTaskFromIssue(taskId);
            if(!removeTaskResult)
                return res.status(409).json({error:'Remove task from issue failed in database.'});
            const stepNeedToRemove = taskNeedToRemove.step_number;
            let counter = stepNeedToRemove;
            for(const task of tasksBelongToIssue){
                if(task.step_number > stepNeedToRemove) {
                    const changeResult = await taskDao.changeStepNumber(task.id, counter);
                    if(!changeResult)
                        return res.status(409).json({errpr:'Change other task step number failed in database.'});
                    counter ++;
                }
            }
            const deleteTaskResult = await taskDao.deleteTask(taskId);
            if(!deleteTaskResult)
                return res.status(409).json({error:'Delete task dailed in databse.'});
            return res.status(200).json({message:'Delete task successfully.'}); 
        }
    }catch(error){
        console.error('Delete task failed, error:', error);
        return res.status(500).json({error:'Internal server error.'});
    }
}

async function getAllIncompletedTasks(req,res){
    const userId = req.user.id;
    try{
        const tasks = await taskDao.getAllTasksNotCompleted(userId);
        if(!tasks || tasks.length < 1)
            return res.status(404).json({error:'No task is not completed.'});
        return res.status(200).json({
            message:'Get all incompleted tasks successfully.',
            tasks:tasks,
        });
    }catch(error){
        console.error('Get all incompleted task failed, error:', error);
        return res.status(500).json({error:'Internal server error.'});
    }
}

async function getTaskChartAnalysis(req, res) {
  const userId = req.user.id;
  const days = parseInt(req.body.days);
  if (![7, 30, 180].includes(days)) {
    return res.status(409).json({ error: "Invalid range." });
  }

  try {
    const result = await getTaskCompletionCount(userId, days);
    if (!result) {
      return res.status(404).json({ error: "Task not found" });
    }
    return res.status(200).json({
      message: "Get task chart data successfully.",
      taskChartData: result,
    });
  } catch (error) {
    console.error("Get task chart data failed, error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
}

async function getTaskCompletionCount(userId, days) {
  const { startDate, endDate } = getDateRange(days);

  if (days === 180) {
    const rawData = await taskDao.getTaskCompletionCountByMonth(userId, startDate, endDate);
    const fullMonths = getLastMonths(6);
    const filledData = fullMonths.map((monthStr) => {
      const found = rawData.find((item) => item.date === monthStr);
      return {
        date: monthStr,
        count: found ? Number(found.count) : 0,
        completed: found ? Number(found.completed) : 0,
        incompleted: found ? Number(found.incompleted) : 0,
      };
    });
    return filledData;
  }

  const rawData = await taskDao.getTaskCompletionCountByDate(userId, startDate, endDate);
  const fullDates = getDateList(startDate, endDate);
  const filledData = fullDates.map((date) => {
    const found = rawData.find((item) => {
      const itemDateStr = new Date(item.date).toISOString().split("T")[0];
      return itemDateStr === date;
    });
    return {
      date,
      count: found ? Number(found.count) : 0,
      completed: found ? Number(found.completed) : 0,
      incompleted: found ? Number(found.incompleted) : 0,
    };
  });
  return filledData;
}

// 日期工具函数

function getDateRange(days) {
  const endDateObj = new Date();
  const startDateObj = new Date();
  startDateObj.setDate(endDateObj.getDate() - days + 1);
  endDateObj.setDate(endDateObj.getDate() + 1); // exclusive

  return {
    startDate: formatDate(startDateObj),
    endDate: formatDate(endDateObj),
  };
}

function formatDate(date) {
  return date.toISOString().split("T")[0];
}

function getDateList(start, end) {
  const fullDates = [];
  const current = new Date(start);
  const stop = new Date(end);

  while (current < stop) {
    fullDates.push(formatDate(current));
    current.setDate(current.getDate() + 1);
  }
  return fullDates;
}

function getLastMonths(months) {
  const result = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return result;
}

module.exports ={
    getTaskByUserId,
    getTaskByTaskId,
    createTask,
    editTask,
    editCompleteStatus,
    removeFromIssueAndEditOtherStep,
    getTasksNotBelongToAnyIssue,
    addTaskIntoIssue,
    deleteTask,
    getAllIncompletedTasks,
    getTaskChartAnalysis,
}