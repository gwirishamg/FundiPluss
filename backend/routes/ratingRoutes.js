const express = require('express');
const router = express.Router();
const { protect, customer } = require('../middleware/authMiddleware');
const {
    createRating,
    getProfessionalRatings,
    canRate
} = require('../controllers/ratingController');

// Public routes
router.get('/professional/:professionalId', getProfessionalRatings);

// Protected routes (customers only)
router.post('/', protect, customer, createRating);
router.get('/can-rate/:requestId', protect, customer, canRate);

module.exports = router;