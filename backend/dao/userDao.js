const db = require('../db');

async function createUser(email, username, hashedPassword){
    const [result] = await db.query(
        'INSERT INTO users (email, username, password) VALUES (?, ?, ?)',
        [email, username, hashedPassword]
    );

    return result.insertId;
}

async function getUserByUserId(userId){
    const [rows] = await db.query(
        'SELECT * FROM users WHERE id = ?',
        [userId]
    );

    if(rows.length > 0)
        return rows[0];
    return null;
}

async function getUserByEmail(email){
    const [rows] = await db.query(
        'SELECT * FROM users WHERE email = ?',
        [email]
    );
    if(rows.length > 0)
        return rows[0];
    return null;
}

async function changePasswordByUserId(userId, hashedNewPassword){
    const [result] = await db.query(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedNewPassword, userId]
    );

    return result.affectedRows > 0;
}

async function isEmailExist(email){
    const [rows] = await db.query(
        'SELECT * FROM users WHERE email = ?',
        [email]
    );
    if(rows.length > 0)
        return true;
    return false;
}

async function isUserNameExist(username){
    const [rows] = await db.query(
        'SELECT * FROM users WHERE username = ?',
        [username]
    );

    if(rows.length > 0)
        return true;
    return false;
}

module.exports = {
    createUser,
    getUserByUserId,
    getUserByEmail,
    changePasswordByUserId,
    isEmailExist,
    isUserNameExist,
}