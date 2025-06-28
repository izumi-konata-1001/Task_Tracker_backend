const db = require('../db');

async function addSession(userId, taskId, startTime,estimatedEndTime, actualEndTime, breakPointNumber, duration, note){
    const [result] = await db.query(
        'INSERT INTO pomodoro_sessions (user_id, task_id, start_time, estimated_end_time,actual_end_time, duration_minutes, break_point, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [userId, taskId, startTime, estimatedEndTime, actualEndTime, duration,breakPointNumber, note]
    );
    return result.insertId;
}

async function getDistinctTaskIdsByUserId(userId) {
  const [rows] = await db.query(
    `
    SELECT DISTINCT task_id
    FROM pomodoro_sessions
    WHERE user_id = ? AND task_id IS NOT NULL
    `,
    [userId]
  );

  return rows.map(row => row.task_id);
}


async function getSessionsWithTask({ key, value, orderBy, direction, offset = 0, limit = 10 }) {
  const [rows] = await db.query(
    `
    SELECT 
      ps.*, 
      t.id AS task_id,
      t.issue_id,
      t.step_number,
      t.title AS task_title,
      t.description AS task_description,
      t.completed AS task_completed,
      t.created_at AS task_created_at,
      t.updated_at AS task_updated_at
    FROM pomodoro_sessions ps
    JOIN tasks t ON ps.task_id = t.id
    WHERE ps.${key} = ?
    ORDER BY ps.${orderBy} ${direction}
    LIMIT ? OFFSET ?
    `,
    [value, limit, offset]
  );

  return rows.map(row => ({
    id: row.id,
    user_id: row.user_id,
    task_id: row.task_id,
    start_time: row.start_time,
    estimated_end_time: row.estimated_end_time,
    actual_end_time: row.actual_end_time,
    duration_minutes: row.duration_minutes,
    break_point: row.break_point,
    note: row.note,
    created_at: row.created_at,
    task: {
      id: row.task_id,
      issue_id: row.issue_id,
      step_number: row.step_number,
      title: row.task_title,
      description: row.task_description,
      completed: !!row.task_completed,
      created_at: row.task_created_at,
      updated_at: row.task_updated_at
    }
  }));
}

async function changeNote(sessionId, newNote){
    const [result] = await db.query(
        'UPDATE pomodoro_sessions SET note = ? WHERE id = ?',
        [newNote, sessionId]
    );

    if(result.affectedRows == 1)
        return true;
    return false;
}

async function deleteSession(sessionId){
    const [result] = await db.query(
        `DELETE FROM pomodoro_sessions WHERE id = ?`,
        [sessionId]
    );
    return result.affectedRows > 0; 
}

async function getSessionBySessionId(sessionId){
    const [rows] = await db.query(
        `SELECT * FROM pomodoro_sessions WHERE id = ?`,
        [sessionId]
    );
    if(rows.length > 0)
        return rows[0];
    return null;
}

async function getSessionByTaskId(taskId){
    const [rows] = await db.query(
        `SELECT * FROM pomodoro_sessions WHERE task_id = ?`,
        [taskId]
    )
    return rows;
}

async function getSessionNumberByUserId(userId){
    const [rows] = await db.query(
        `SELECT * FROM pomodoro_sessions WHERE user_id = ?`,
        [userId]
    )
    if(rows.length > 0)
        return rows.length;
    return 0;
}

async function getTaskCountWithSessionsByUserId(userId) {
    const [rows] = await db.query(
        `SELECT COUNT(DISTINCT task_id) AS taskCount
         FROM pomodoro_sessions
         WHERE user_id = ?`,
        [userId]
    );
    return rows[0].taskCount;
}
async function countSessionsWithDuration5ByUserId(userId) {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS count FROM pomodoro_sessions WHERE duration_minutes = 5 AND user_id=?`,
    [userId]
  );
  return rows[0].count;
}

async function countSessionsWithDuration15ByUserId(userId) {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS count FROM pomodoro_sessions WHERE duration_minutes = 15 AND user_id=?`,
    [userId]
  );
  return rows[0].count;  
}

async function countSessionsWithDuration25ByUserId(userId) {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS count FROM pomodoro_sessions WHERE duration_minutes = 25 AND user_id=?`,
    [userId]
  );
  return rows[0].count;
}

async function countSessionsWithDuration50ByUserId(userId) {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS count FROM pomodoro_sessions WHERE duration_minutes = 50 AND user_id =?`,
    [userId]
  );
  return rows[0].count;
}

async function countSessionsWithOtherDurationsByUserId(userId) {
  const [rows] = await db.query(`
    SELECT COUNT(*) AS count
    FROM pomodoro_sessions
    WHERE duration_minutes NOT IN (5, 15, 25, 50)
    AND user_id=?
  `,[userId]);
  return rows[0].count;
}

async function getPomodoroStatsByDate(userId, startDate, endDate, isMonthly = false) {
  const groupBy = isMonthly
    ? "DATE_FORMAT(CONVERT_TZ(start_time, '+00:00', '+08:00'), '%Y-%m')"
    : "DATE(CONVERT_TZ(start_time, '+00:00', '+08:00'))";

  const [rows] = await db.query(
    `SELECT 
      ${groupBy} AS date,
      SUM(duration_minutes) AS total_duration,
      SUM(break_point) AS total_breaks
    FROM pomodoro_sessions
    WHERE user_id = ? AND start_time >= ? AND start_time < ?
    GROUP BY ${groupBy}
    ORDER BY date ASC`,
    [userId, startDate, endDate]
  );
  return rows;
}

async function countSessionsByKey(key, value) {
  const query = `SELECT COUNT(*) AS count FROM pomodoro_sessions WHERE ${key} = ?`;
  const [[result]] = await db.query(query, [value]);
  return result.count;
}

module.exports = {
    addSession,
    getDistinctTaskIdsByUserId,
    changeNote,
    deleteSession,
    getSessionBySessionId,
    getSessionByTaskId,
    getSessionNumberByUserId,
    getTaskCountWithSessionsByUserId,
    countSessionsWithDuration5ByUserId,
    countSessionsWithDuration15ByUserId,
    countSessionsWithDuration25ByUserId,
    countSessionsWithDuration50ByUserId,
    countSessionsWithOtherDurationsByUserId,
    getPomodoroStatsByDate,
    getSessionsWithTask,
    countSessionsByKey,
}