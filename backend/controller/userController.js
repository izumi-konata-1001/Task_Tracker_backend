const userDao = require('../dao/userDao');
const issueDao = require('../dao/issueDao');
const taskDao = require('../dao/taskDao');
const pomodoroDao = require('../dao/pomodoroDao');

const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

const bcrypt = require('bcrypt');

async function getUserByUserId(req, res){
    const userId = req.user.id;
    try{
        const user = await userDao.getUserByUserId(userId);
        if(!user)
            return res.status(404).json({error:'User not found.'});
        return res.status(200).json({
            message:'Get user by user Id successfully.',
            user:user,
        });
    }catch(error){
        console.error('Get user by userId failed, error:', error);
        return res.status(500).json({error:'Internal server error'});
    }
}

async function createUser(req,res){
    const email = req.body.email;
    const username = req.body.username;
    const password = req.body.password;

    const hashedPassword = await hashPassword(password);

    try{
        const isEmailExist = await userDao.isEmailExist(email);
        const isUserNameExist = await userDao.isUserNameExist(username);
        if(isEmailExist && isUserNameExist)
            return res.status(409).json({error:'Email and username are already registered.'});
        if(isEmailExist)
            return res.status(409).json({error:'Email is already registered.'});
        if(isUserNameExist)
            return res.status(409).json({error:'Username is already registered'});

        const newUserId = await userDao.createUser(email, username, hashedPassword);
        if(!newUserId)
            return res.status(409).json({error:'Register failed in database.'});
        return res.status(200).json({
            message:'Register successfully.',
            token:1,
        });
    }catch(error){
        console.error('Create new user failed, error:', error);
        return res.status(500).json({error:'Internal server error.'});
    }
}

async function hashPassword(password){
    const hashedPassword = await bcrypt.hash(password, 10);
    return hashedPassword;
}

async function authUser(req, res){
    const email = req.body.email;
    const password = req.body.password;

    try{
        const user = await userDao.getUserByEmail(email);
        if(!user)
            return res.status(404).json({error: 'User not found.'});
        const isPasswordMatch = await isPasswordMatched(password, user.password);
        if(!isPasswordMatch)
            return res.status(400).json({error:'Wrong password.'});
        const token = generateToken(user);
        return res.status(200).json({
            message:'Change password successfully.',
            token:token,
        });
    }catch(error){
        cconsole.error('Change password failed, error:', error);
        return res.status(500).json({error:'Internal server error.'});
    }
}

async function changePassword(req, res){
    const userId = req.user.id;
    const oldPassword = req.body.oldPassword;
    const newPassword = req.body.newPassword;

    try{
        const user = await userDao.getUserByUserId(userId);
        const isPasswordMatch = await isPasswordMatched(oldPassword, user.password);
        if(!isPasswordMatch)
            return res.status(400).json({error:'Wrong old Password.'});
        const hashedPassword = await hashPassword(newPassword);
        const changePasswordResult = await userDao.changePasswordByUserId(userId, hashedPassword);
        if(!changePasswordResult)
            return res.status(409).json({error:'Change password failed in database.'});
        const newToken = generateToken(user);
        return res.status(200).json({
            message:'Change password successfully.',
            token:newToken,
        });
    }catch(error){
        console.error('Change password failed, error:', error);
        return res.status(500).json({error:'Internal server error.'});
    }
}

function generateToken(user) {
    return jwt.sign(
        { id: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: "1d" }
    );
}

async function isPasswordMatched(enteredPassword, dbPassword){
    const result = await bcrypt.compare(enteredPassword, dbPassword);
    return result;
}

async function getUserAnalysis(req, res){
    const userId = req.user.id;
    try{
        const issueNumber = await issueDao.getIssueNumberByUserId(userId);
        const taskNumber = await taskDao.getTaskNumberByUserId(userId);
        const completedTaskNumber = await taskDao.getCompletedTaskNumberByUserId(userId);
        const incompletedTaskNumber = await taskDao.getIncompletedTaskNumberByUserId(userId);
        const sessionNumber = await pomodoroDao.getSessionNumberByUserId(userId);
        const taskCountWithSessions = await pomodoroDao.getTaskCountWithSessionsByUserId(userId);
        const fullyCompletedIssueNumber = await issueDao.getFullyCompletedIssueCountByUser(userId);
        const durationFiveNumber = await pomodoroDao.countSessionsWithDuration5ByUserId(userId);
        const durationFifteenFiveNumber = await pomodoroDao.countSessionsWithDuration15ByUserId(userId);
        const durationTwentyFiveNumber = await pomodoroDao.countSessionsWithDuration25ByUserId(userId);
        const durationFiftyNumber = await pomodoroDao.countSessionsWithDuration50ByUserId(userId);
        const otherDurationNumber = await pomodoroDao.countSessionsWithOtherDurationsByUserId(userId);
        const incompletedIssueNumber = await issueDao.getIncompleteIssueCountByUser(userId);
        const noTaskIssueNumber = await issueDao.getIssueCountWithoutTasksByUser(userId);
        
        return res.status(200).json({
        message: 'Get user analysis successfully.',
        issue: {
            total: issueNumber,
            fullyCompleted: fullyCompletedIssueNumber,
            incompleted:incompletedIssueNumber,
            noTask:noTaskIssueNumber,
        },
        task: {
            total: taskNumber,
            completed: completedTaskNumber,
            incompleted: incompletedTaskNumber,
            withSessions: taskCountWithSessions,
        },
        session: {
            total: sessionNumber,
            durationCount: {
            five: durationFiveNumber,
            fifteen: durationFifteenFiveNumber,
            twentyFive: durationTwentyFiveNumber,
            fifty: durationFiftyNumber,
            other: otherDurationNumber,
            },
        },
        });
    }catch(error){
        console.error('Get user analysis failed, error:', error);
        return res.status(500).json({error:'Internal server error.'});
    }
}

module.exports = {
    getUserByUserId,
    createUser,
    authUser,
    changePassword,
    getUserAnalysis,
}