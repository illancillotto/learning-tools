const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const auth = require('../middleware/auth');

// Admin routes (protected)
router.post('/', auth, quizController.createQuiz);
router.get('/', auth, quizController.getQuizzes);
router.get('/results/export', auth, quizController.exportResults);
router.get('/:id', quizController.getQuiz);
router.put('/:id', auth, quizController.updateQuiz);
router.delete('/:id', auth, quizController.deleteQuiz);

// Student routes (no auth required)
router.post('/:id/answer', quizController.submitAnswer);
router.post('/:id/submit', quizController.submitQuiz);

// Add this route before the /:id route to prevent conflicts
router.get('/active', quizController.getActiveQuiz);

module.exports = router;