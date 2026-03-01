const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
    getPendingProfessionals,
    approveProfessional,
    getAllUsers,
    toggleUserStatus
} = require('../controllers/adminController');

// All admin routes are protected and require admin role
router.use(protect, admin);

// Professional management
router.get('/professionals/pending', getPendingProfessionals);
router.put('/professionals/:id/approve', approveProfessional);

// User management
router.get('/users', getAllUsers);
router.put('/users/:id/toggle-status', toggleUserStatus);

module.exports = router;