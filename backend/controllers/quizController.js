const Quiz = require('../models/Quiz');

exports.createQuiz = async (req, res) => {
  try {
    const quiz = new Quiz({
      ...req.body,
      createdBy: req.user.id
    });
    await quiz.save();
    res.status(201).json(quiz);
  } catch (error) {
    res.status(500).json({ message: 'Error creating quiz' });
  }
};

exports.getQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find({ createdBy: req.user.id });
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching quizzes' });
  }
};

exports.getQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    res.json(quiz);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching quiz' });
  }
};

exports.updateQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      req.body,
      { new: true }
    );
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    res.json(quiz);
  } catch (error) {
    res.status(500).json({ message: 'Error updating quiz' });
  }
};

exports.deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user.id
    });
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    res.json({ message: 'Quiz deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting quiz' });
  }
};

exports.submitAnswer = async (req, res) => {
  try {
    const { questionId, answer, studentName } = req.body;
    // Implementation for saving individual answers
    res.json({ message: 'Answer saved successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error saving answer' });
  }
};

exports.submitQuiz = async (req, res) => {
  try {
    const { answers, studentName } = req.body;
    // Implementation for submitting entire quiz
    res.json({ message: 'Quiz submitted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting quiz' });
  }
};

exports.exportResults = async (req, res) => {
  try {
    // Implementation for exporting results
    res.json({ message: 'Results exported successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error exporting results' });
  }
};

exports.getActiveQuiz = async (req, res) => {
  try {
    // Find the most recently created active quiz
    const quiz = await Quiz.findOne({ 
      status: 'active' 
    }).sort({ createdAt: -1 });
    
    if (!quiz) {
      return res.status(404).json({ message: 'No active quiz found' });
    }
    
    res.json(quiz);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching active quiz' });
  }
};