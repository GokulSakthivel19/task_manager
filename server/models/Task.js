const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  dayNumber: {
    type: Number,
    required: true,
    min: 1,
    max: 31,
    unique: true
  },
  taskText: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'skipped'],
    default: 'pending'
  },
  dateCreated: {
    type: Date,
    default: Date.now
  },
  dateCompleted: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Task', taskSchema);
