const Quiz = require('../models/Quiz');
const createHash = require('crypto').createHash;
const seedrandom = require('seedrandom');

exports.createQuiz = async (req, res) => {
  try {
    const { title, timeLimit, questions } = req.body;
    
    // Validate required fields
    if (!title || !timeLimit || !questions) {
      return res.status(400).json({ 
        message: 'Missing required fields' 
      });
    }

    // Validate questions structure
    for (const question of questions) {
      if (!question.text || !question.type) {
        return res.status(400).json({ 
          message: 'Invalid question format - missing text or type' 
        });
      }
      if (question.type === 'multiple-choice') {
        if (!Array.isArray(question.options) || !question.correctAnswer) {
          return res.status(400).json({ 
            message: 'Invalid multiple choice question - missing options or correct answer' 
          });
        }
      }
    }

    // Create new quiz
    const quiz = new Quiz({
      title,
      timeLimit,
      questions,
      createdBy: req.user.id,
      status: 'inactive'
    });

    await quiz.save();
    res.status(201).json(quiz);
  } catch (error) {
    console.error('Error creating quiz:', error);
    res.status(500).json({ 
      message: error.message || 'Error creating quiz'
    });
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
    console.log('Fetching active quiz...');
    const activeQuiz = await Quiz.findOne({ status: 'active' });
    console.log('Found quiz:', activeQuiz);
    
    if (!activeQuiz) {
      console.log('No active quiz found');
      return res.status(404).json({ 
        message: 'No active quiz found' 
      });
    }

    // Return quiz without sensitive information
    const sanitizedQuiz = {
      _id: activeQuiz._id,
      title: activeQuiz.title,
      timeLimit: activeQuiz.timeLimit,
      questionCount: activeQuiz.questions.length,
      status: activeQuiz.status
    };

    console.log('Returning sanitized quiz:', sanitizedQuiz);
    res.json(sanitizedQuiz);
  } catch (error) {
    console.error('Error in getActiveQuiz:', error);
    res.status(500).json({ 
      message: 'Error fetching quiz',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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

exports.getQuizForStudent = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    if (quiz.status !== 'active') {
      return res.status(400).json({ message: 'Quiz is not active' });
    }

    // Generate a unique seed based on student name and quiz ID
    const seed = createHash('sha256')
      .update(req.query.studentName + quiz._id.toString())
      .digest('hex');
    
    // Use the seed to generate a deterministic random selection
    const selectedQuestions = deterministicShuffle(quiz.questions, seed)
      .slice(0, quiz.questionCount || quiz.questions.length);

    // Return quiz with only selected questions and remove correct answers
    const sanitizedQuestions = selectedQuestions.map(q => ({
      id: q._id,
      text: q.text,
      type: q.type,
      options: q.options
    }));

    res.json({
      _id: quiz._id,
      title: quiz.title,
      timeLimit: quiz.timeLimit,
      questions: sanitizedQuestions,
      status: quiz.status
    });
  } catch (error) {
    console.error('Error fetching quiz:', error);
    res.status(500).json({ message: 'Error fetching quiz' });
  }
};

exports.activateQuiz = async (req, res) => {
  try {
    const { active } = req.body;
    
    if (active) {
      // Check if there's already an active quiz
      const activeQuiz = await Quiz.findOne({ status: 'active' });
      if (activeQuiz && activeQuiz._id.toString() !== req.params.id) {
        return res.status(400).json({ 
          message: 'quiz.management.onlyOneActiveQuiz'
        });
      }
    }

    const quiz = await Quiz.findOne({ 
      _id: req.params.id,
      createdBy: req.user.id 
    });

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Update quiz status
    quiz.status = active ? 'active' : 'inactive';
    await quiz.save();

    // If we're deactivating and this was the active quiz, mark it as completed
    if (!active && quiz.status === 'active') {
      quiz.status = 'completed';
      await quiz.save();
    }

    res.json(quiz);
  } catch (error) {
    console.error('Error activating quiz:', error);
    res.status(500).json({ message: 'quiz.management.activationError' });
  }
};

// Deterministic shuffle function
function deterministicShuffle(array, seed) {
  const seededRandom = seedrandom(seed);
  const newArray = [...array];
  
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  
  return newArray;
}

// Utility function for random selection
function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}