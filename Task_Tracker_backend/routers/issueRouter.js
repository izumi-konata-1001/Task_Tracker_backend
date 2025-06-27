const express = require('express');
const router = express.Router();

const issueController = require('../controller/issueController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware.authenticateToken);

router.get('/', (req,res) => {
    res.send('here is issues');
})

router.post('/all', issueController.getIssuesByUserId);
router.post('/create', issueController.createIssue);
router.post('/detail', issueController.getIssueByIssueId);
router.post('/edit', issueController.editIssue);
router.post('/reorder_tasks', issueController.changeTasksOrderInIssue);
router.post('/delete', issueController.deleteIssue);
router.get('/avaliable_issues', issueController.getAllIssuesWithTaskByUserId);
router.post('/incompleted_tasks', issueController.getTaskNotCompletedInIssue);

module.exports = router;