const express = require('express');
const router = express.Router();

const userController = require('../controller/userController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', (req,res) => {
    res.send('here is user router');
})

router.post('/create', userController.createUser);
router.post('/auth', userController.authUser);
router.get('/info', authMiddleware.authenticateToken, userController.getUserByUserId);
router.post('/change_password', authMiddleware.authenticateToken, userController.changePassword);
router.get('/analysis',authMiddleware.authenticateToken,userController.getUserAnalysis);
module.exports = router;