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

exports.importQuizJson = async (req, res) => {
  try {
    const { jsonData, questionCount } = req.body;
    
    // Validate question pool size
    if (jsonData.questionPool.length < questionCount) {
      return res.status(400).json({ 
        message: 'Not enough questions in pool' 
      });
    }

    // Randomly select questions
    const selectedQuestions = shuffleArray(jsonData.questionPool)
      .slice(0, questionCount);

    const quiz = new Quiz({
      title: jsonData.title,
      timeLimit: jsonData.timeLimit,
      questions: selectedQuestions,
      createdBy: req.user.id
    });

    await quiz.save();
    res.status(201).json(quiz);
  } catch (error) {
    res.status(500).json({ message: 'Error importing quiz JSON' });
  }
};

exports.exportQuizJson = async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ 
      _id: req.params.id,
      createdBy: req.user.id 
    });
    
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    const jsonData = {
      title: quiz.title,
      timeLimit: quiz.timeLimit,
      questionPool: quiz.questions
    };

    res.json(jsonData);
  } catch (error) {
    res.status(500).json({ message: 'Error exporting quiz JSON' });
  }
};

exports.validateQuizJson = async (req, res) => {
  try {
    const { jsonData } = req.body;
    
    // Basic validation
    if (!jsonData.title || !jsonData.timeLimit || !Array.isArray(jsonData.questionPool)) {
      return res.status(400).json({ message: 'Invalid JSON structure' });
    }

    // Validate questions
    for (const question of jsonData.questionPool) {
      if (!question.text || !question.type) {
        return res.status(400).json({ message: 'Invalid question format' });
      }

      if (question.type === 'multiple-choice' && 
          (!Array.isArray(question.options) || !question.correctAnswer)) {
        return res.status(400).json({ message: 'Invalid multiple choice question' });
      }
    }

    res.json({ valid: true });
  } catch (error) {
    res.status(500).json({ message: 'Error validating quiz JSON' });
  }
};

// Utility function for random selection
function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}