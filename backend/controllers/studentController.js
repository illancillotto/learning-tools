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
      { startTime: new Date() },
      { upsert: true, new: true }
    );

    const io = socketIO.getIO();
    io.emit('student-status-update', {
      studentName,
      status: 'connected',
      currentQuiz: quiz.title,
      timeRemaining: quiz.timeLimit * 60
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
    const progress = (submission.answers.length / quiz.questions.length) * 100;

    res.json({
      progress,
      timeRemaining: quiz.timeLimit * 60 - 
        Math.floor((Date.now() - submission.startTime) / 1000)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching progress' });
  }
};

exports.updateHeartbeat = async (req, res) => {
  const { studentName } = req.params;
  
  try {
    const io = socketIO.getIO();
    io.emit('student-status-update', {
      studentName,
      status: 'connected',
      lastHeartbeat: Date.now()
    });
    
    res.json({ message: 'Heartbeat updated' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating heartbeat' });
  }
};