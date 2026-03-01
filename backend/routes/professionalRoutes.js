const express = require('express');
const router = express.Router();
const { protect, professional } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const {
    registerProfessional,
    getApprovedProfessionals,
    getProfessionalById,
    updateProfessionalProfile
} = require('../controllers/professionalController');

// Public routes
router.get('/', getApprovedProfessionals);
router.get('/:id', getProfessionalById);

// Protected routes (require login)
router.post(
    '/register',
    protect,
    upload.array('documents', 5), // Allow up to 5 documents
    registerProfessional
);

router.put(
    '/profile',
    protect,
    professional,
    updateProfessionalProfile
);

module.exports = router;