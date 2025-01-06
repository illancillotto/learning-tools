const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const studentController = require('../controllers/studentController');
const authMiddleware = require('../middleware/auth');

// Public routes (no auth required)
router.get('/active', quizController.getActiveQuiz);
router.post('/student/join', studentController.joinQuiz);
router.get('/exec/:id/student', quizController.getQuizForStudent);
// Quiz submission routes
router.post('/:id/answer', quizController.submitAnswer);
router.post('/:id/submit', quizController.submitQuiz);

// Apply auth middleware to all routes after this point
router.use(authMiddleware);

// Protected routes (require auth)
router.get('/', quizController.getQuizzes);
router.get('/:id', quizController.getQuiz);
router.post('/', quizController.createQuiz);
router.put('/:id', quizController.updateQuiz);
router.delete('/:id', quizController.deleteQuiz);
router.put('/:id/activate', quizController.activateQuiz);


// Quiz results
router.get('/results/export', quizController.exportResults);

module.exports = router;