const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
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

const quizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  timeLimit: {
    type: Number,
    required: true,
    min: 1
  },
  questions: [questionSchema],
  status: {
    type: String,
    enum: ['draft', 'active', 'completed'],
    default: 'draft'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Quiz', quizSchema);