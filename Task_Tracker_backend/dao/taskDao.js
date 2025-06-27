const db = require('../db');

async function getTasksByUserIdDESC(userId, offset = 0, limit = 10) {
    const [tasks] = await db.query(
        'SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [userId, limit, offset]
    );
    return tasks;
}

async function getTasksByUserIdASC(userId, offset = 0, limit = 10) {
    const [tasks] = await db.query(
        'SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at ASC LIMIT ? OFFSET ?',
        [userId, limit, offset]
    );
    return tasks;
}

async function countTasksByUserId(userId) {
    const [rows] = await db.query(
        'SELECT COUNT(*) AS count FROM tasks WHERE user_id = ?',
        [userId]
    );

    if(rows.length > 0 && rows[0].count !== undefined)
        return rows[0].count;
    else 
        return 0;
}

async function getTaskByTaskId(taskId){
    const [task] = await db.query(
        'SELECT * FROM tasks WHERE id = ?',
        [taskId]
    );
    if(task.length > 0)
        return task[0];
    return null;
}

async function isTaskExit(taskId){
    const [tasks] = await db.query(
        'SELECT * FROM tasks WHERE id = ?',
        [taskId]
    );
    if(tasks.length > 0)
        return true;
    return false;
}

async function createTask(userId, issueId, step, title, description, completed){
    const [result] = await db.query(
        'INSERT INTO tasks (user_id, issue_id,step_number, title, description, completed) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, issueId, step, title, description, completed]
    );
    return result.insertId;
}

async function changeTitle(taskId, newTitle){
    const [result] = await db.query(
        'UPDATE tasks SET title = ? WHERE id = ?',
        [newTitle, taskId]
    )
    if(result.affectedRows == 1)
        return true;
    return false;
}

async function changeDescription(taskId, newDescription){
    const [result] = await db.query(
        'UPDATE tasks SET description = ? WHERE id = ?',
        [newDescription, taskId]
    );
    if(result.affectedRows == 1)
        return true;
    return false;
}

async function changeCompleteStatus(taskId, newCompleteStatus){
    const [result] = await db.query(
        'UPDATE tasks SET completed = ? WHERE id = ?',
        [newCompleteStatus, taskId]
    );
    if(result.affectedRows == 1)
        return true;
    return false;
}

async function changeStepNumber(taskId,newStepNumber){
    const [result] =await db.query(
        'UPDATE tasks SET step_number = ? WHERE id = ?',
        [newStepNumber,taskId]
    );
    if(result.affectedRows == 1)
        return true;
    return false;
}

async function changeTasksOrderInIssue(taskId,newStepNumber,issueId){
    const [result] =await db.query(
        'UPDATE tasks SET step_number = ?,issue_id = ? WHERE id = ?',
        [newStepNumber,issueId, taskId]
    );

    if(result.affectedRows == 1)
        return true;
    return false;
}

async function addTaskIntoIssue(taskId, issueId, stepNumber){
    const [result] = await db.query(
        'UPDATE tasks SET issue_id = ?, step_number = ? WHERE id = ?',
        [issueId, stepNumber, taskId]
    );
    if(result.affectedRows == 1)
        return true;
    return false;
}

async function getTaskByIssueId(issueId){
    const [tasks] = await db.query(
        'SELECT * FROM tasks WHERE issue_id = ? ORDER BY step_number ASC',
        [issueId]
    );

    return tasks;
}

async function getTasksNotBelongToIssue(userId){
    const [tasks] = await db.query(
        'SELECT * FROM tasks WHERE issue_id IS NULL AND user_id = ?',
        [userId]
    )
    if(tasks.length == 0)
        return null;
    return tasks;
}

async function deleteTaskFromIssue(taskId) {
  const [result] = await db.query(
    `UPDATE tasks SET issue_id = NULL , step_number = NULL WHERE id = ?`
    ,[taskId]);

  return result.affectedRows === 1;
}

async function resetTasksBelongToIssue(issueId){
    const [result] = await db.query(
        `UPDATE tasks SET issue_id = NULL, step_number = NULL WHERE issue_id = ?`,
        [issueId]
    );
    return result.affectedRows > 0;
}

async function deleteTask(taskId){
    const [result] = await db.query(
        `DELETE FROM tasks WHERE id = ?`,
        [taskId]
    );

    return result.affectedRows > 0;
}

async function getTasksBelongToIssueNotComplete(issueId){
    const [rows] = await db.query(
        'SELECT * FROM tasks WHERE issue_id =? AND completed = ?',
        [issueId, 0]
    );
    return rows;
}

async function getAllTasksNotCompleted(userId){
    const [rows] = await db.query(
        'SELECT * FROM tasks WHERE user_id = ? AND completed = ?',
        [userId, 0]
    );
    return rows;
}

async function getCompletedTaskNumberByUserId(userId){
    const [rows] = await db.query(
        `SELECT * FROM tasks WHERE user_id = ? AND completed = ?`,
        [userId, 1]
    )
    if(rows.length > 0)
        return rows.length;
    return 0;
}

async function getIncompletedTaskNumberByUserId(userId){
    const [rows] = await db.query(
        `SELECT * FROM tasks WHERE user_id = ? AND completed = ?`,
        [userId, 0]
    )
    if(rows.length > 0)
        return rows.length;
    return 0;
}

async function getTaskNumberByUserId(userId){
    const [rows] = await db.query(
        `SELECT * FROM tasks WHERE user_id = ?`,
        [userId]
    );
    if(rows.length > 0)
        return rows.length;
    return 0;
}


async function getTaskCompletionCountByDate(userId, startDate, endDate) {
  const [rows] = await db.query(
    `SELECT 
      DATE(CONVERT_TZ(created_at, '+00:00', '+08:00')) AS date,
      COUNT(*) AS count,
      SUM(completed = TRUE) AS completed,
      SUM(completed = FALSE) AS incompleted
    FROM tasks
    WHERE user_id = ? AND created_at >= ? AND created_at < ?
    GROUP BY DATE(CONVERT_TZ(created_at, '+00:00', '+08:00'))
    ORDER BY date ASC`,
    [userId, startDate, endDate]
  );
  return rows;
}

async function getTaskCompletionCountByMonth(userId, startDate, endDate) {
  const [rows] = await db.query(
    `SELECT 
      DATE_FORMAT(CONVERT_TZ(created_at, '+00:00', '+08:00'), '%Y-%m') AS date,
      COUNT(*) AS count,
      SUM(completed = TRUE) AS completed,
      SUM(completed = FALSE) AS incompleted
    FROM tasks
    WHERE user_id = ? AND created_at >= ? AND created_at < ?
    GROUP BY DATE_FORMAT(CONVERT_TZ(created_at, '+00:00', '+08:00'), '%Y-%m')
    ORDER BY date ASC`,
    [userId, startDate, endDate]
  );
  return rows;
}

module.exports ={
    getTasksByUserIdDESC,
    getTasksByUserIdASC,
    countTasksByUserId,
    getTaskByTaskId,
    isTaskExit,
    createTask,
    changeTitle,
    changeDescription,
    changeCompleteStatus,
    changeStepNumber,
    changeTasksOrderInIssue,
    addTaskIntoIssue,
    getTaskByIssueId,
    getTasksNotBelongToIssue,
    deleteTaskFromIssue,
    resetTasksBelongToIssue,
    deleteTask,
    getTasksBelongToIssueNotComplete,
    getAllTasksNotCompleted,
    getCompletedTaskNumberByUserId,
    getIncompletedTaskNumberByUserId,
    getTaskNumberByUserId,
    getTaskCompletionCountByDate,
    getTaskCompletionCountByMonth,
}