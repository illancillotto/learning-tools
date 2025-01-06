const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const auth = require('../middleware/auth');

// Admin routes (protected)
router.post('/', auth, quizController.createQuiz);
router.get('/', auth, quizController.getQuizzes);
router.get('/results/export', auth, quizController.exportResults);

// JSON handling routes
router.post('/import-json', auth, quizController.importQuizJson);
router.get('/:id/export-json', auth, quizController.exportQuizJson);
router.post('/validate-json', auth, quizController.validateQuizJson);

// Quiz management routes
router.get('/:id', quizController.getQuiz);
router.put('/:id', auth, quizController.updateQuiz);
router.delete('/:id', auth, quizController.deleteQuiz);

// Student routes (no auth required)
router.post('/:id/answer', quizController.submitAnswer);
router.post('/:id/submit', quizController.submitQuiz);

// Active quiz route (must be before /:id route)
router.get('/active', quizController.getActiveQuiz);

module.exports = router;