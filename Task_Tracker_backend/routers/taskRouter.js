const express = require('express');
const router = express.Router();

const taskController = require('../controller/taskController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware.authenticateToken);

router.get('/', (req,res) => {
    res.send('here is tasks');
})

router.post('/all', taskController.getTaskByUserId);
router.post('/create', taskController.createTask);
router.get('/avaliable', taskController.getTasksNotBelongToAnyIssue);
router.post('/detail', taskController.getTaskByTaskId);
router.post('/edit', taskController.editTask);
router.post('/remove',taskController.removeFromIssueAndEditOtherStep);
router.post('/add',taskController.addTaskIntoIssue);
router.post('/delete', taskController.deleteTask);
router.get('/incompleted', taskController.getAllIncompletedTasks);
router.post('/analysis', taskController.getTaskChartAnalysis);

module.exports = router;