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
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz.questions',
      required: true
    },
    answer: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    isCorrect: {
      type: Boolean,
      default: false
    }
  }],
  status: {
    type: String,
    enum: ['in-progress', 'completed', 'timed-out'],
    default: 'in-progress'
  },
  startTime: Date,
  endTime: Date,
  totalQuestions: {
    type: Number,
    required: true
  },
  correctAnswers: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('StudentSubmission', studentSubmissionSchema);