const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['multiple-choice', 'open-ended'],
    required: true
  },
  options: [{
    type: String
  }],
  correctAnswer: {
    type: String,
    required: function() {
      return this.type === 'multiple-choice';
    }
  }
});

const QuizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  timeLimit: {
    type: Number,
    required: true
  },
  questionCount: {
    type: Number,
    default: function() {
      return this.questions ? this.questions.length : 0;
    }
  },
  questions: [QuestionSchema],
  status: {
    type: String,
    enum: ['active', 'inactive', 'completed'],
    default: 'inactive'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Quiz', QuizSchema);