const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const studentController = require('../controllers/studentController');
const auth = require('../middleware/auth');

// Public routes (no auth required)
router.get('/active', quizController.getActiveQuiz);
router.post('/student/join', studentController.joinQuiz);

// Student route to get randomized subset of questions
// This needs to be BEFORE the /:id route to prevent route conflicts
router.get('/exec/:id/student', quizController.getQuizForStudent);

// Protected routes (require auth)
router.get('/', auth, quizController.getQuizzes);
router.get('/:id', auth, quizController.getQuiz);
router.post('/', quizController.createQuiz);
router.put('/:id', quizController.updateQuiz);
router.delete('/:id', quizController.deleteQuiz);
router.put('/:id/activate', auth, quizController.activateQuiz);

// Quiz submission routes
router.post('/:id/answer', quizController.submitAnswer);
router.post('/:id/submit', quizController.submitQuiz);

// Quiz results
router.get('/results/export', quizController.exportResults);

module.exports = router;