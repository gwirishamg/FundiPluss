const { promisePool } = require('../config/db');

// @desc    Get pending professional approvals
// @route   GET /api/admin/professionals/pending
// @access  Private (admin only)
const getPendingProfessionals = async (req, res) => {
    try {
        const [professionals] = await promisePool.query(`
            SELECT 
                u.id, u.firstName, u.lastName, u.email, u.phoneNumber,
                pd.trade, pd.experience, pd.bio, pd.hourlyRate, pd.location,
                pd.createdAt
            FROM users u
            JOIN professional_details pd ON u.id = pd.userId
            WHERE pd.isApproved = FALSE
        `);
        
        res.json(professionals);
        
    } catch (error) {
        console.error('Get pending professionals error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Approve or reject professional
// @route   PUT /api/admin/professionals/:id/approve
// @access  Private (admin only)
const approveProfessional = async (req, res) => {
    try {
        const { id } = req.params; // professional's user ID
        const { approve } = req.body; // true or false
        const adminId = req.user.id;
        
        if (approve) {
            await promisePool.query(
                `UPDATE professional_details 
                SET isApproved = TRUE, approvedBy = ?, approvedAt = NOW() 
                WHERE userId = ?`,
                [adminId, id]
            );
            
            res.json({ message: 'Professional approved successfully' });
        } else {
            // If rejected, delete professional details
            await promisePool.query(
                'DELETE FROM professional_details WHERE userId = ?',
                [id]
            );
            
            // Revert role back to customer
            await promisePool.query(
                'UPDATE users SET role = ? WHERE id = ?',
                ['customer', id]
            );
            
            res.json({ message: 'Professional registration rejected' });
        }
        
    } catch (error) {
        console.error('Approve professional error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get all users (customers and professionals)
// @route   GET /api/admin/users
// @access  Private (admin only)
const getAllUsers = async (req, res) => {
    try {
        const [users] = await promisePool.query(`
            SELECT 
                id, firstName, lastName, email, phoneNumber, 
                role, isActive, createdAt
            FROM users
            ORDER BY createdAt DESC
        `);
        
        res.json(users);
        
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Toggle user active status (ban/unban)
// @route   PUT /api/admin/users/:id/toggle-status
// @access  Private (admin only)
const toggleUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        
        const [users] = await promisePool.query(
            'SELECT isActive FROM users WHERE id = ?',
            [id]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const newStatus = !users[0].isActive;
        
        await promisePool.query(
            'UPDATE users SET isActive = ? WHERE id = ?',
            [newStatus, id]
        );
        
        res.json({ 
            message: `User ${newStatus ? 'activated' : 'deactivated'} successfully`,
            isActive: newStatus
        });
        
    } catch (error) {
        console.error('Toggle user status error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    getPendingProfessionals,
    approveProfessional,
    getAllUsers,
    toggleUserStatus
};