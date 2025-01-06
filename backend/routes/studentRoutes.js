const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');

router.post('/join', studentController.joinQuiz);
router.get('/:studentName/progress', studentController.getProgress);
router.post('/:studentName/heartbeat', studentController.updateHeartbeat);

module.exports = router;