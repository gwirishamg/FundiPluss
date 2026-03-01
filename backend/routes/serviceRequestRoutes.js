const express = require('express');
const router = express.Router();
const { protect, customer, professional } = require('../middleware/authMiddleware');
const {
    createRequest,
    getMyRequests,
    getIncomingRequests,
    getRequestHistory,
    respondToRequest,
    completeRequest,
    cancelRequest
} = require('../controllers/serviceRequestController');

// Customer routes
router.post('/', protect, customer, createRequest);
router.get('/my-requests', protect, customer, getMyRequests);
router.put('/:id/cancel', protect, customer, cancelRequest);

// Professional routes
router.get('/incoming', protect, professional, getIncomingRequests);
router.get('/history', protect, professional, getRequestHistory);
router.put('/:id/respond', protect, professional, respondToRequest);
router.put('/:id/complete', protect, professional, completeRequest);

module.exports = router;