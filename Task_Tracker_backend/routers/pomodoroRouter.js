const express = require('express');
const router = express.Router();

const pomodoroController = require('../controller/pomodoroController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware.authenticateToken);

router.get('/',(req, res)=>{
    res.send('here is pomodoro')
});


router.post('/create',pomodoroController.createSession);
router.post('/all_by_user_id', pomodoroController.getSessionByUserId);
router.post('/all_by_task_id', pomodoroController.getSessionByTaskId);
router.post('/edit', pomodoroController.changeNote);
router.get('/user_tasks_has_session',pomodoroController.getTasksHasSession);
router.post('/detail', pomodoroController.getSessionWithTaskBySessionId);
router.post('/delete', pomodoroController.deleteSession);
router.post('/analysis', pomodoroController.getPomodoroChartAnalysis);
module.exports = router;