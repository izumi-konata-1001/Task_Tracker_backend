const db = require('../db');

async function getIssuesByUserIdDESC(userId, offset = 0, limit = 10) {
  const [rows] = await db.query(
    'SELECT * FROM issues WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
    [userId, limit, offset]
  );
  return rows;
}

async function getIssuesByUserIdASC(userId, offset = 0, limit = 10) {
  const [rows] = await db.query(
    'SELECT * FROM issues WHERE user_id = ? ORDER BY created_at ASC LIMIT ? OFFSET ?',
    [userId, limit, offset]
  );
  return rows;
}

async function countIssuesByUserId(userId) {
  const [rows] = await db.query(
    'SELECT COUNT(*) AS count FROM issues WHERE user_id = ?',
    [userId]
  );
    if(rows.length > 0 && rows[0].count !== undefined)
        return rows[0].count;
    else 
        return 0;
}

async function getIssueByIssueId(issueId){
    const [rows] = await db.query(
        'SELECT * FROM issues WHERE id =?',
        [issueId]
    );
    if(rows.length >0)
        return rows[0];
    return null;
}

async function changeTitle(issueId, newTitle){
    const [result] = await db.query(
        'UPDATE issues SET title = ? WHERE id = ?',
        [newTitle, issueId]
    );
    if(result.affectedRows == 1)
        return true;
    return false;
}

async function changeDescription(issueId,newDescription){
    const [result] = await db.query(
        'UPDATE issues SET description = ? WHERE id = ?',
        [newDescription, issueId]
    );
    if(result.affectedRows == 1)
        return true;
    return false;
}

async function createIssue(userId, title, description){
    const [ result ] = await db.query(
        'INSERT INTO issues (user_id, title,description) VALUES (?, ?, ?)',
        [userId, title, description]
    );
    return result.insertId;
}

async function deleteIssue(userId, issueId){
    const [result] = await db.query(
        `DELETE FROM issues WHERE id = ? AND user_id = ?`,
        [issueId, userId]
    );

    return result.affectedRows > 0;
}


async function getIssuesIdWithIncompletedTasksByUserId(userId){
    const [rows] = await db.query(
        `SELECT DISTINCT issue_id 
         FROM tasks 
         WHERE user_id = ? 
         AND issue_id IS NOT NULL 
         AND completed = 0`,
        [userId]
    );

    return rows;
}

async function getIssueNumberByUserId(userId){
    const [rows] = await db.query(
        `SELECT * FROM issues WHERE user_id = ?`,
        [userId]
    )

    if(rows.length > 0)
        return rows.length;
    return 0;
}

async function getFullyCompletedIssueCountByUser(userId) {
  const [rows] = await db.query(`
    SELECT COUNT(*) AS completedIssueCount
    FROM issues i
    WHERE i.user_id = ?
      AND EXISTS (
        SELECT 1
        FROM tasks t
        WHERE t.issue_id = i.id
      )
      AND NOT EXISTS (
        SELECT 1
        FROM tasks t
        WHERE t.issue_id = i.id AND t.completed = FALSE
      );
  `, [userId]);

  return rows[0].completedIssueCount;
}

async function getIncompleteIssueCountByUser(userId) {
  const [rows] = await db.query(`
    SELECT COUNT(DISTINCT i.id) AS incompleteIssueCount
    FROM issues i
    JOIN tasks t ON t.issue_id = i.id
    WHERE i.user_id = ? AND t.completed = FALSE;
  `, [userId]);

  return rows[0].incompleteIssueCount;
}

async function getIssueCountWithoutTasksByUser(userId) {
  const [rows] = await db.query(`
    SELECT COUNT(*) AS noTaskIssueCount
    FROM issues i
    WHERE i.user_id = ?
      AND NOT EXISTS (
        SELECT 1 FROM tasks t WHERE t.issue_id = i.id
      );
  `, [userId]);

  return rows[0].noTaskIssueCount;
}


module.exports={
    getIssuesByUserIdDESC,
    getIssuesByUserIdASC,
    countIssuesByUserId,
    getIssueByIssueId,
    changeTitle,
    changeDescription,
    createIssue,
    deleteIssue,
    getIssuesIdWithIncompletedTasksByUserId,
    getIssueNumberByUserId,
    getFullyCompletedIssueCountByUser,
    getIncompleteIssueCountByUser,
    getIssueCountWithoutTasksByUser,
}