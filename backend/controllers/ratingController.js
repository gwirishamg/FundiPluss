const { promisePool } = require('../config/db');

// @desc    Rate a completed service
// @route   POST /api/ratings
// @access  Private (customers only)
const createRating = async (req, res) => {
    try {
        const customerId = req.user.id;
        const { requestId, score, review } = req.body;

        // Check if request exists and belongs to this customer
        const [requests] = await promisePool.query(
            `SELECT * FROM service_requests 
             WHERE id = ? AND customerId = ? AND status = 'completed'`,
            [requestId, customerId]
        );

        if (requests.length === 0) {
            return res.status(404).json({ 
                message: 'Completed request not found or does not belong to you' 
            });
        }

        const request = requests[0];

        // Check if already rated
        const [existing] = await promisePool.query(
            'SELECT id FROM ratings WHERE requestId = ?',
            [requestId]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: 'This service has already been rated' });
        }

        // Insert rating
        await promisePool.query(
            `INSERT INTO ratings (requestId, customerId, professionalId, score, review) 
             VALUES (?, ?, ?, ?, ?)`,
            [requestId, customerId, request.professionalId, score, review]
        );

        res.status(201).json({ message: 'Rating submitted successfully' });

    } catch (error) {
        console.error('Create rating error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get ratings for a professional
// @route   GET /api/ratings/professional/:professionalId
// @access  Public
const getProfessionalRatings = async (req, res) => {
    try {
        const { professionalId } = req.params;

        const [ratings] = await promisePool.query(
            `SELECT 
                r.score, r.review, r.ratedAt,
                u.firstName, u.lastName
             FROM ratings r
             JOIN users u ON r.customerId = u.id
             WHERE r.professionalId = ?
             ORDER BY r.ratedAt DESC`,
            [professionalId]
        );

        // Calculate average rating
        const [avgResult] = await promisePool.query(
            'SELECT AVG(score) as average, COUNT(*) as total FROM ratings WHERE professionalId = ?',
            [professionalId]
        );

        res.json({
            ratings,
            average: avgResult[0].average || 0,
            total: avgResult[0].total || 0
        });

    } catch (error) {
        console.error('Get ratings error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Check if user can rate a professional
// @route   GET /api/ratings/can-rate/:requestId
// @access  Private (customers only)
const canRate = async (req, res) => {
    try {
        const customerId = req.user.id;
        const { requestId } = req.params;

        const [requests] = await promisePool.query(
            `SELECT * FROM service_requests 
             WHERE id = ? AND customerId = ? AND status = 'completed'`,
            [requestId, customerId]
        );

        if (requests.length === 0) {
            return res.json({ canRate: false, message: 'No completed request found' });
        }

        const [existing] = await promisePool.query(
            'SELECT id FROM ratings WHERE requestId = ?',
            [requestId]
        );

        res.json({ 
            canRate: existing.length === 0,
            request: requests[0]
        });

    } catch (error) {
        console.error('Can rate error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    createRating,
    getProfessionalRatings,
    canRate
};