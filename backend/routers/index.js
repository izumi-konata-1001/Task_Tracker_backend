const express = require('express');
const router= express.Router();

router.get('/', (req,res) => {
    res.send('here is index router');
})

const userRouter = require('./userRouter');
router.use('/user', userRouter);

const taskRouter = require('./taskRouter');
router.use('/task', taskRouter);

const issueRouter = require('./issueRouter');
router.use('/issue', issueRouter);

const pomodoroRouter = require('./pomodoroRouter');
router.use('/pomodoro', pomodoroRouter);

module.exports = router;