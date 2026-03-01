const { promisePool } = require('../config/db');
const fs = require('fs');
const path = require('path');

// @desc    Register as a professional
// @route   POST /api/professionals/register
// @access  Private (requires login)
const registerProfessional = async (req, res) => {
    try {
        const userId = req.user.id; // From auth middleware
        const { trade, experience, bio, hourlyRate, location } = req.body;
        
        // Check if user exists and is not already a professional
        const [users] = await promisePool.query(
            'SELECT role FROM users WHERE id = ?',
            [userId]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Check if already has professional details
        const [existing] = await promisePool.query(
            'SELECT id FROM professional_details WHERE userId = ?',
            [userId]
        );
        
        if (existing.length > 0) {
            return res.status(400).json({ message: 'Already registered as professional' });
        }
        
        // Insert professional details
        const [result] = await promisePool.query(
            `INSERT INTO professional_details 
            (userId, trade, experience, bio, hourlyRate, location) 
            VALUES (?, ?, ?, ?, ?, ?)`,
            [userId, trade, experience, bio, hourlyRate, location]
        );
        
        const professionalId = result.insertId;
        
        // Handle file uploads if any
        if (req.files && req.files.length > 0) {
            const documents = req.files.map(file => [
                professionalId,
                file.originalname,
                file.path
            ]);
            
            await promisePool.query(
                'INSERT INTO professional_documents (professionalId, filename, filepath) VALUES ?',
                [documents]
            );
        }
        
        // Update user role to professional
        await promisePool.query(
            'UPDATE users SET role = ? WHERE id = ?',
            ['professional', userId]
        );
        
        res.status(201).json({
            message: 'Professional registration submitted for approval',
            professionalId: professionalId
        });
        
    } catch (error) {
        console.error('Professional registration error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get all approved professionals (for customers)
// @route   GET /api/professionals
// @access  Public
const getApprovedProfessionals = async (req, res) => {
    try {
        const { trade, location } = req.query;
        
        let query = `
            SELECT 
                u.id, u.firstName, u.lastName, u.email, u.phoneNumber, u.profileImage,
                pd.trade, pd.experience, pd.bio, pd.hourlyRate, pd.location
            FROM users u
            JOIN professional_details pd ON u.id = pd.userId
            WHERE pd.isApproved = TRUE AND u.isActive = TRUE
        `;
        
        const params = [];
        
        if (trade) {
            query += ' AND pd.trade = ?';
            params.push(trade);
        }
        
        if (location) {
            query += ' AND pd.location LIKE ?';
            params.push(`%${location}%`);
        }
        
        const [professionals] = await promisePool.query(query, params);
        
        res.json(professionals);
        
    } catch (error) {
        console.error('Get professionals error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get single professional by ID
// @route   GET /api/professionals/:id
// @access  Public
const getProfessionalById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const [professionals] = await promisePool.query(`
            SELECT 
                u.id, u.firstName, u.lastName, u.email, u.phoneNumber, u.profileImage,
                pd.trade, pd.experience, pd.bio, pd.hourlyRate, pd.location,
                pd.isApproved
            FROM users u
            JOIN professional_details pd ON u.id = pd.userId
            WHERE u.id = ? AND pd.isApproved = TRUE
        `, [id]);
        
        if (professionals.length === 0) {
            return res.status(404).json({ message: 'Professional not found' });
        }
        
        // Get their documents (optional)
        const [documents] = await promisePool.query(
            'SELECT filename FROM professional_documents WHERE professionalId = ?',
            [professionals[0].id]
        );
        
        const professional = professionals[0];
        professional.documents = documents;
        
        res.json(professional);
        
    } catch (error) {
        console.error('Get professional error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update professional profile
// @route   PUT /api/professionals/profile
// @access  Private (professional only)
const updateProfessionalProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { bio, hourlyRate, location } = req.body;
        
        await promisePool.query(
            `UPDATE professional_details 
            SET bio = ?, hourlyRate = ?, location = ? 
            WHERE userId = ?`,
            [bio, hourlyRate, location, userId]
        );
        
        res.json({ message: 'Profile updated successfully' });
        
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    registerProfessional,
    getApprovedProfessionals,
    getProfessionalById,
    updateProfessionalProfile
};