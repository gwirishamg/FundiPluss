const mongoose = require('mongoose');

const ServiceRequestSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  professional: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  trade: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: [true, 'Please describe the service needed'],
    maxlength: 500
  },
  preferredDate: {
    type: Date,
    required: true
  },
  preferredTime: String,
  location: {
    street: String,
    city: String,
    state: String,
    zipCode: String
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'denied', 'completed', 'cancelled'],
    default: 'pending'
  },
  price: {
    quoted: Number,
    final: Number
  },
  rating: {
    score: Number, // 1-5
    review: String,
    ratedAt: Date
  },
  completedAt: Date,
  cancelledAt: Date,
  cancellationReason: String
}, {
  timestamps: true
});

module.exports = mongoose.model('ServiceRequest', ServiceRequestSchema);