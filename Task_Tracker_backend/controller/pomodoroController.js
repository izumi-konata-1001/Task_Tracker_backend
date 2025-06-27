const pomodoroDao = require('../dao/pomodoroDao');
const taskDao = require('../dao/taskDao');

async function createSession(req,res){
    const userId = req.user.id;
    const taskId = req.body.taskId;
    const startTime = req.body.startTime;
    const estimatedEndTime = req.body.estimatedEndTime
    const actualEndTime = req.body.actualEndTime;
    const breakPointNumber = req.body.breakPointNumber;
    const note = req.body.note;
    const duration = req.body.duration;

    try{
        const task = await taskDao.getTaskByTaskId(taskId);
        if(!task)
            return res.status(404).json({error:'Task not found.'});
        if(task.user_id != userId)
            return res.status(403).json({error:'Token invalid.'});

        const createResult = await pomodoroDao.addSession(userId, taskId, startTime,estimatedEndTime, actualEndTime, breakPointNumber, duration, note);
        if(!createResult)
            return res.status(409).json({error:'Add new pomodoro session failed.'});
        return res.status(200).json({
            message: 'Add new pomodro session successfully.',
            sessionId:createResult,
        })
    }catch(error){
        console.error('Create session failed, error:', error);
        return res.status(500).json({error:'Internal server error.'});
    }
}

async function getSessionByUserId(req, res) {
  const userId = req.user.id;
  const order = req.body.order || 'DESC';
  const key = req.body.key; // 'duration' or 'create_time'
  const page = parseInt(req.body.page) || 1;
  const pageSize = parseInt(req.body.pageSize) || 10;
  const offset = (page - 1) * pageSize;

  try {
    let orderBy;
    if (key === 'duration') {
      orderBy = 'duration_minutes';
    } else if (key === 'create_time') {
      orderBy = 'created_at';
    } else {
      return res.status(400).json({ error: 'Invalid key.' });
    }

    if (order !== 'ASC' && order !== 'DESC') {
      return res.status(400).json({ error: 'Invalid order.' });
    }

    const sessions = await pomodoroDao.getSessionsWithTask({
      key: 'user_id',
      value: userId,
      orderBy,
      direction: order,
      offset,
      limit: pageSize
    });

    const total = await pomodoroDao.countSessionsByKey('user_id', userId);

    return res.status(200).json({
      message: `Get sessions by user_id ordered by ${key} ${order} successfully.`,
      sessions,
      total,
      page,
      pageSize
    });
  } catch (error) {
    console.error('Get session by user id failed:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

// ✅ getSessionByTaskId - 分页版
async function getSessionByTaskId(req, res) {
  const userId = req.user.id;
  const taskId = req.body.taskId;
  const order = req.body.order || 'DESC';
  const key = req.body.key; // 'duration' or 'create_time'
  const page = parseInt(req.body.page) || 1;
  const pageSize = parseInt(req.body.pageSize) || 10;
  const offset = (page - 1) * pageSize;

  try {
    const task = await taskDao.getTaskByTaskId(taskId);
    if (task.user_id !== userId)
      return res.status(403).json({ error: 'Token invalid.' });

    let orderBy;
    if (key === 'duration') {
      orderBy = 'duration_minutes';
    } else if (key === 'create_time') {
      orderBy = 'created_at';
    } else {
      return res.status(400).json({ error: 'Invalid key.' });
    }

    if (order !== 'ASC' && order !== 'DESC') {
      return res.status(400).json({ error: 'Invalid order.' });
    }

    const sessions = await pomodoroDao.getSessionsWithTask({
      key: 'task_id',
      value: taskId,
      orderBy,
      direction: order,
      offset,
      limit: pageSize
    });

    const total = await pomodoroDao.countSessionsByKey('task_id', taskId);

    return res.status(200).json({
      message: `Get sessions by task_id ordered by ${key} ${order} successfully.`,
      sessions,
      total,
      page,
      pageSize
    });
  } catch (error) {
    console.error('Get session by task id failed:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

async function getTasksHasSession(req,res){
    const userId = req.user.id;
    try{
        const taskIds = await pomodoroDao.getDistinctTaskIdsByUserId(userId);
        if(!taskIds || taskIds.length == 0)
            return res.status(404).json({error: 'No tasks has session.'});
        
        const tasks = [];
        for (const taskId of taskIds) {
            const task = await taskDao.getTaskByTaskId(taskId);
            if (task) 
                tasks.push(task);
            else
                return res.status(409).json({error:`Task(id: ${taskId}) not found in batabase.`})
        }

        return res.status(200).json({
            message:'Get tasks have session successfully.',
            tasks:tasks,
        });  
    }catch(error){
        console.error('Get tasks has session failed, error:', error);
        return res.status(500).json({error:'Internal server error.'});  
    }
}

async function changeNote(req, res){
    const userId = req.user.id;
    const sessionId = req.body.sessionId;
    const note = req.body.note;

    try{
        const session= await pomodoroDao.getSessionBySession(sessionId);
        if(session.user_id != userId)
            return res.status(403).json({error:'Token invalid.'});

        const changeResult = await pomodoroDao.changeNote(sessionId, note);
        if(!changeResult)
            return res.status(409).json({error:'Change session not failed.'});
        return res.status(200).json({message:'Change session not successfully.'});
    }catch(error){
        console.error('Change session note failed, error:', error);
        return res.status(500).json({error:'Internal server error.'});  
    }
}

async function getSessionWithTaskBySessionId(req,res){
    const sessionId = req.body.sessionId;
    const userId = req.user.id;
    try{
        const session = await pomodoroDao.getSessionBySessionId(sessionId);
        if(!session){
            console.error('Session not found, session id:', sessionId);
            return res.status(404).json({error:'Session not found in database.'})
        }
        if(session.user_id != userId)
            return res.status(403).json({error:'Token invalid.'});

        const taskId = session.task_id;
        const task = await taskDao.getTaskByTaskId(taskId);
        if(!task){
            console.error('Task session belong to not found, task id:', taskId);
            return res.status(404).json({error:'Task session belong to not found.'});
        }
        return res.status(200).json({
            message:'Get session and task successfully.',
            task:task,
            session:session,
        })
    }catch(error){
        console.error('Get session with task by session id failed, error:', error);
        return res.status(500).json({error:'Internal server error.'});
    }
}

async function deleteSession(req, res){
    const userId = req.user.id;
    const sessionId = req.body.sessionId;
    try{
        const session= await pomodoroDao.getSessionBySession(sessionId);
        if(session.user_id != userId)
            return res.status(403).json({error:'Token invalid.'});

        const deleteResult = await pomodoroDao.deleteSession(sessionId);
        if(!deleteResult){
            console.error('Delete session failed, session id: ', sessionId);
            return res.status(409).json({error:'Delete session failed in database.'});
        }
        console.log('Delete session successfully.');
        return res.status(200).json({message:'Delete session successfully.'});
    }catch(error){
        console.error('Delete session failed, error:', error);
        return res.status(500).json({error:'Internal server error.'});
    }
}


async function getPomodoroChartAnalysis(req, res) {
  const userId = req.user.id;
  const days = req.body.days;

  if (![7, 30, 180].includes(days)) {
    return res.status(409).json({ error: "Invalid range." });
  }

  const isMonthly = days === 180;
  const { startDate, endDate } = getDateRange(days, isMonthly);

  try {
    const stats = await pomodoroDao.getPomodoroStatsByDate(userId, startDate, endDate, isMonthly);

    // generate full x-axis range
    const fullDates = [];
    const map = new Map(stats.map((item) => [
  new Date(item.date).toISOString().split("T")[0],
  item
]));

    if (isMonthly) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      for (let d = new Date(start); d < end; d.setMonth(d.getMonth() + 1)) {
        const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        fullDates.push(monthStr);
      }
    } else {
      const start = new Date(startDate);
      const end = new Date(endDate);
      for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
        const dayStr = d.toISOString().split("T")[0];
        fullDates.push(dayStr);
      }
    }

    const filled = fullDates.map((date) => {
      const found = map.get(date);
      return {
        date,
        total_duration: found ? Number(found.total_duration) : 0,
        total_breaks: found ? Number(found.total_breaks) : 0,
      };
    });
    return res.status(200).json({ message: "Fetched successfully.", data: filled });
  } catch (error) {
    console.error("Pomodoro chart fetch error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
}

function getDateRange(days, isMonthly = false) {
  const endDateObj = new Date();
  const startDateObj = new Date();

  if (isMonthly) {
    startDateObj.setMonth(endDateObj.getMonth() - (days / 30) + 1);
    endDateObj.setDate(1);
    endDateObj.setMonth(endDateObj.getMonth() + 1); // make it exclusive month
  } else {
    startDateObj.setDate(endDateObj.getDate() - days + 1);
    endDateObj.setDate(endDateObj.getDate() + 1);
  }

  const format = (date) => date.toISOString().split("T")[0];
  return {
    startDate: format(startDateObj),
    endDate: format(endDateObj),
  };
}

module.exports = {
    createSession,
    getSessionByUserId,
    getSessionByTaskId,
    changeNote,
    getTasksHasSession,
    getSessionWithTaskBySessionId,
    deleteSession,
    getPomodoroChartAnalysis,
}