const { promisePool } = require('../config/db');

// @desc    Create a new service request
// @route   POST /api/requests
// @access  Private (customers only)
const createRequest = async (req, res) => {
    try {
        const customerId = req.user.id; // From auth middleware
        const { professionalId, trade, description, preferredDate, preferredTime, location } = req.body;

        // Check if professional exists and is approved
        const [professionals] = await promisePool.query(
            `SELECT u.id, pd.isApproved 
             FROM users u 
             JOIN professional_details pd ON u.id = pd.userId 
             WHERE u.id = ? AND u.role = 'professional'`,
            [professionalId]
        );

        if (professionals.length === 0) {
            return res.status(404).json({ message: 'Professional not found' });
        }

        if (!professionals[0].isApproved) {
            return res.status(400).json({ message: 'Professional is not yet approved' });
        }

        // Check if customer has pending request with this professional
        const [existing] = await promisePool.query(
            `SELECT id FROM service_requests 
             WHERE customerId = ? AND professionalId = ? AND status = 'pending'`,
            [customerId, professionalId]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: 'You already have a pending request with this professional' });
        }

        // Create the request
        const [result] = await promisePool.query(
            `INSERT INTO service_requests 
             (customerId, professionalId, trade, description, preferredDate, preferredTime, location, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
            [customerId, professionalId, trade, description, preferredDate, preferredTime, location]
        );

        res.status(201).json({
            message: 'Service request sent successfully',
            requestId: result.insertId
        });

    } catch (error) {
        console.error('Create request error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get customer's requests
// @route   GET /api/requests/my-requests
// @access  Private (customers only)
const getMyRequests = async (req, res) => {
    try {
        const customerId = req.user.id;

        const [requests] = await promisePool.query(
            `SELECT 
                sr.*,
                u.firstName, u.lastName, u.phoneNumber,
                pd.trade, pd.hourlyRate
             FROM service_requests sr
             JOIN users u ON sr.professionalId = u.id
             JOIN professional_details pd ON u.id = pd.userId
             WHERE sr.customerId = ?
             ORDER BY sr.createdAt DESC`,
            [customerId]
        );

        res.json(requests);

    } catch (error) {
        console.error('Get my requests error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get professional's incoming requests
// @route   GET /api/requests/incoming
// @access  Private (professionals only)
const getIncomingRequests = async (req, res) => {
    try {
        const professionalId = req.user.id;

        const [requests] = await promisePool.query(
            `SELECT 
                sr.*,
                u.firstName, u.lastName, u.phoneNumber, u.email
             FROM service_requests sr
             JOIN users u ON sr.customerId = u.id
             WHERE sr.professionalId = ? AND sr.status = 'pending'
             ORDER BY sr.createdAt DESC`,
            [professionalId]
        );

        res.json(requests);

    } catch (error) {
        console.error('Get incoming requests error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get professional's request history
// @route   GET /api/requests/history
// @access  Private (professionals only)
const getRequestHistory = async (req, res) => {
    try {
        const professionalId = req.user.id;

        const [requests] = await promisePool.query(
            `SELECT 
                sr.*,
                u.firstName, u.lastName, u.phoneNumber
             FROM service_requests sr
             JOIN users u ON sr.customerId = u.id
             WHERE sr.professionalId = ? AND sr.status IN ('accepted', 'denied', 'completed', 'cancelled')
             ORDER BY sr.updatedAt DESC`,
            [professionalId]
        );

        res.json(requests);

    } catch (error) {
        console.error('Get request history error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Accept or deny a request
// @route   PUT /api/requests/:id/respond
// @access  Private (professionals only)
const respondToRequest = async (req, res) => {
    try {
        const requestId = req.params.id;
        const professionalId = req.user.id;
        const { status, quotedPrice } = req.body; // status: 'accepted' or 'denied'

        // Verify the request belongs to this professional
        const [requests] = await promisePool.query(
            'SELECT * FROM service_requests WHERE id = ? AND professionalId = ?',
            [requestId, professionalId]
        );

        if (requests.length === 0) {
            return res.status(404).json({ message: 'Request not found' });
        }

        const request = requests[0];

        if (request.status !== 'pending') {
            return res.status(400).json({ message: `Request already ${request.status}` });
        }

        if (status === 'accepted') {
            await promisePool.query(
                'UPDATE service_requests SET status = ?, quotedPrice = ? WHERE id = ?',
                ['accepted', quotedPrice || null, requestId]
            );
            res.json({ message: 'Request accepted successfully' });
        } else if (status === 'denied') {
            await promisePool.query(
                'UPDATE service_requests SET status = ? WHERE id = ?',
                ['denied', requestId]
            );
            res.json({ message: 'Request denied' });
        } else {
            res.status(400).json({ message: 'Invalid status' });
        }

    } catch (error) {
        console.error('Respond to request error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Mark request as completed
// @route   PUT /api/requests/:id/complete
// @access  Private (professionals only)
const completeRequest = async (req, res) => {
    try {
        const requestId = req.params.id;
        const professionalId = req.user.id;
        const { finalPrice } = req.body;

        const [requests] = await promisePool.query(
            'SELECT * FROM service_requests WHERE id = ? AND professionalId = ?',
            [requestId, professionalId]
        );

        if (requests.length === 0) {
            return res.status(404).json({ message: 'Request not found' });
        }

        const request = requests[0];

        if (request.status !== 'accepted') {
            return res.status(400).json({ message: 'Only accepted requests can be completed' });
        }

        await promisePool.query(
            'UPDATE service_requests SET status = ?, finalPrice = ?, completedAt = NOW() WHERE id = ?',
            ['completed', finalPrice || request.quotedPrice, requestId]
        );

        res.json({ message: 'Request marked as completed' });

    } catch (error) {
        console.error('Complete request error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Cancel a request (customer only)
// @route   PUT /api/requests/:id/cancel
// @access  Private (customers only)
const cancelRequest = async (req, res) => {
    try {
        const requestId = req.params.id;
        const customerId = req.user.id;

        const [requests] = await promisePool.query(
            'SELECT * FROM service_requests WHERE id = ? AND customerId = ?',
            [requestId, customerId]
        );

        if (requests.length === 0) {
            return res.status(404).json({ message: 'Request not found' });
        }

        const request = requests[0];

        if (request.status !== 'pending') {
            return res.status(400).json({ message: `Cannot cancel request that is ${request.status}` });
        }

        await promisePool.query(
            'UPDATE service_requests SET status = ? WHERE id = ?',
            ['cancelled', requestId]
        );

        res.json({ message: 'Request cancelled successfully' });

    } catch (error) {
        console.error('Cancel request error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    createRequest,
    getMyRequests,
    getIncomingRequests,
    getRequestHistory,
    respondToRequest,
    completeRequest,
    cancelRequest
};