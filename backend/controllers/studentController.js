const StudentSubmission = require('../models/Student');
const Quiz = require('../models/Quiz');
const socketIO = require('../socket');

exports.joinQuiz = async (req, res) => {
  const { studentName, quizId } = req.body;
  
  try {
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    const submission = await StudentSubmission.findOneAndUpdate(
      { studentName, quizId, status: 'in-progress' },
      { 
        startTime: new Date(),
        totalQuestions: quiz.questionCount,
        correctAnswers: 0
      },
      { upsert: true, new: true }
    );

    const io = socketIO.getIO();
    io.emit('student-status-update', {
      studentName,
      status: 'connected',
      currentQuiz: quiz.title,
      timeRemaining: quiz.timeLimit * 60,
      progress: {
        totalQuestions: quiz.questions.length,
        answeredQuestions: submission.answers.length,
        correctAnswers: submission.correctAnswers
      }
    });

    res.json({ submission });
  } catch (error) {
    res.status(500).json({ message: 'Error joining quiz' });
  }
};

exports.getProgress = async (req, res) => {
  const { studentName } = req.params;
  const { quizId } = req.query;

  try {
    const submission = await StudentSubmission.findOne({
      studentName,
      quizId,
      status: 'in-progress'
    });

    if (!submission) {
      return res.status(404).json({ message: 'No active submission found' });
    }

    const quiz = await Quiz.findById(quizId);
    const progress = {
      totalQuestions: quiz.questions.length,
      answeredQuestions: submission.answers.length,
      correctAnswers: submission.answers.filter(a => a.isCorrect).length,
      percentComplete: (submission.answers.length / quiz.questions.length) * 100
    };

    const timeRemaining = quiz.timeLimit * 60 - 
      Math.floor((Date.now() - submission.startTime) / 1000);

    // Emit updated progress through socket
    const io = socketIO.getIO();
    io.emit('student-status-update', {
      studentName,
      status: 'connected',
      currentQuiz: quiz.title,
      timeRemaining,
      progress
    });

    res.json({
      progress,
      timeRemaining
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching progress' });
  }
};

exports.updateHeartbeat = async (req, res) => {
  const { studentName } = req.params;
  
  try {
    // Get the latest submission for this student
    const latestSubmission = await StudentSubmission.findOne(
      { studentName, status: 'in-progress' }
    ).sort({ startTime: -1 });

    let progressData = {};
    if (latestSubmission) {
      const quiz = await Quiz.findById(latestSubmission.quizId);
      progressData = {
        currentQuiz: quiz.title,
        timeRemaining: quiz.timeLimit * 60 - 
          Math.floor((Date.now() - latestSubmission.startTime) / 1000),
        progress: {
          totalQuestions: quiz.questions.length,
          answeredQuestions: latestSubmission.answers.length,
          correctAnswers: latestSubmission.answers.filter(a => a.isCorrect).length,
          percentComplete: (latestSubmission.answers.length / quiz.questions.length) * 100
        }
      };
    }

    const io = socketIO.getIO();
    io.emit('student-status-update', {
      studentName,
      status: 'connected',
      lastHeartbeat: Date.now(),
      ...progressData
    });
    
    res.json({ message: 'Heartbeat updated' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating heartbeat' });
  }
};

// Add this new method to handle answer submissions
exports.submitAnswer = async (req, res) => {
  const { studentName, quizId, questionId, answer } = req.body;

  try {
    // Find the quiz and the specific question
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    const question = quiz.questions.find(q => q._id.toString() === questionId);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Determine if the answer is correct with strict comparison
    let isCorrect = false;
    const studentAnswer = String(answer).toLowerCase().trim();
    const correctAnswer = String(question.correctAnswer).toLowerCase().trim();

    console.log('Comparing answers:', {
      studentAnswer,
      correctAnswer,
      questionType: question.type
    });

    if (question.type === 'multiple-choice') {
      // For multiple choice, do exact comparison
      isCorrect = studentAnswer === correctAnswer;
    } else if (question.type === 'text') {
      // For text questions, do case-insensitive comparison
      isCorrect = studentAnswer === correctAnswer;
    }

    console.log('Answer evaluation result:', {
      isCorrect,
      studentAnswer,
      correctAnswer
    });

    // Find the current submission
    const submission = await StudentSubmission.findOne({
      studentName,
      quizId,
      status: 'in-progress'
    });

    if (!submission) {
      // Create new submission
      const newSubmission = new StudentSubmission({
        studentName,
        quizId,
        status: 'in-progress',
        startTime: new Date(),
        totalQuestions: quiz.questions.length,
        answers: [{
          questionId,
          answer: studentAnswer,
          isCorrect
        }],
        correctAnswers: isCorrect ? 1 : 0
      });
      await newSubmission.save();
      
      console.log('Created new submission:', {
        submissionId: newSubmission._id,
        answer: studentAnswer,
        isCorrect
      });
      
      return res.json({ submission: newSubmission, isCorrect });
    }

    // Handle existing submission
    const existingAnswerIndex = submission.answers.findIndex(
      a => a.questionId.toString() === questionId
    );

    if (existingAnswerIndex === -1) {
      // Add new answer
      submission.answers.push({
        questionId,
        answer: studentAnswer,
        isCorrect
      });
      if (isCorrect) {
        submission.correctAnswers += 1;
      }
    } else {
      // Update existing answer
      const wasCorrect = submission.answers[existingAnswerIndex].isCorrect;
      submission.answers[existingAnswerIndex].answer = studentAnswer;
      submission.answers[existingAnswerIndex].isCorrect = isCorrect;
      
      // Update correctAnswers count
      if (wasCorrect && !isCorrect) {
        submission.correctAnswers -= 1;
      } else if (!wasCorrect && isCorrect) {
        submission.correctAnswers += 1;
      }
    }

    // Save the updated submission
    await submission.save();

    console.log('Updated submission:', {
      submissionId: submission._id,
      answer: studentAnswer,
      isCorrect,
      totalCorrect: submission.correctAnswers
    });

    // Calculate progress
    const progress = {
      totalQuestions: quiz.questions.length,
      answeredQuestions: submission.answers.length,
      correctAnswers: submission.correctAnswers,
      percentComplete: Math.round((submission.answers.length / quiz.questions.length) * 100)
    };

    // Emit updated status via socket
    const io = socketIO.getIO();
    io.emit('student-status-update', {
      studentName,
      status: 'connected',
      currentQuiz: quiz.title,
      timeRemaining: quiz.timeLimit * 60 - 
        Math.floor((Date.now() - submission.startTime) / 1000),
      progress
    });

    res.json({ 
      submission,
      isCorrect,
      progress 
    });

  } catch (error) {
    console.error('Error submitting answer:', error);
    res.status(500).json({ 
      message: 'Error submitting answer',
      error: error.message 
    });
  }
};

exports.getSubmissionDetails = async (req, res) => {
  const { studentName } = req.params;
  const { quizId } = req.query;

  try {
    if (!studentName || !quizId) {
      return res.status(400).json({ 
        message: 'Student name and quiz ID are required' 
      });
    }

    const submission = await StudentSubmission.findOne({
      studentName,
      quizId
    }).populate({
      path: 'quizId',
      select: 'title questions'
    });

    if (!submission) {
      return res.status(404).json({ 
        message: 'Submission not found' 
      });
    }

    // Get the questions from the quiz to include question text
    const quiz = await Quiz.findById(quizId);
    
    // Format the response with question text
    const response = {
      studentName: submission.studentName,
      quizId: submission.quizId._id,
      quizTitle: submission.quizId.title,
      status: submission.status,
      startTime: submission.startTime,
      endTime: submission.endTime,
      totalQuestions: submission.totalQuestions,
      correctAnswers: submission.correctAnswers,
      answers: submission.answers.map(answer => {
        const question = quiz.questions.find(q => 
          q._id.toString() === answer.questionId.toString()
        );
        return {
          questionId: answer.questionId,
          questionText: question?.text || 'Question not found',
          answer: answer.answer,
          isCorrect: answer.isCorrect,
          submittedAt: answer.submittedAt || answer.createdAt,
          correctAnswer: question?.correctAnswer // Include correct answer for completed quizzes
        };
      })
    };

    // Only include correct answers if the quiz is completed
    if (submission.status !== 'completed') {
      response.answers = response.answers.map(({ correctAnswer, ...rest }) => rest);
    }

    res.json(response);

  } catch (error) {
    console.error('Error fetching submission details:', error);
    res.status(500).json({ 
      message: 'Error fetching submission details',
      error: error.message 
    });
  }
};