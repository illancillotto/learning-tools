const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz.questions',
    required: true
  },
  answer: {
    type: String,
    required: true
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
});

const studentSubmissionSchema = new mongoose.Schema({
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  studentName: {
    type: String,
    required: true
  },
  answers: [{
    questionIndex: Number,
    answer: mongoose.Schema.Types.Mixed
  }],
  status: {
    type: String,
    enum: ['in-progress', 'completed'],
    default: 'completed'
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: Date
}, {
  timestamps: true
});

module.exports = mongoose.model('StudentSubmission', studentSubmissionSchema);
module.exports = mongoose.model('StudentSubmission', studentSubmissionSchema);