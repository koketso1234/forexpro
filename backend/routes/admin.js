const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const Signal = require('../models/Signal');

// ===== GET ALL USERS (Admin Only) =====
router.get('/users', protect, async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        
        res.json({
            success: true,
            count: users.length,
            users
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// ===== GET USER BY ID (Admin Only) =====
router.get('/users/:id', protect, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        
        res.json({
            success: true,
            user
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// ===== UPDATE USER (Admin Only) =====
router.put('/users/:id', protect, async (req, res) => {
    try {
        const { subscriptionStatus, plan, name, email, phone } = req.body;
        
        const updateData = {};
        if (subscriptionStatus) updateData.subscriptionStatus = subscriptionStatus;
        if (plan) updateData.plan = plan;
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (phone) updateData.phone = phone;
        
        // If subscription is being activated, update end date
        if (subscriptionStatus === 'active') {
            let endDate = new Date();
            const userPlan = plan || 'monthly';
            if (userPlan === 'monthly') endDate.setMonth(endDate.getMonth() + 1);
            else if (userPlan === 'quarterly') endDate.setMonth(endDate.getMonth() + 3);
            else if (userPlan === 'yearly') endDate.setFullYear(endDate.getFullYear() + 1);
            updateData.subscriptionEnd = endDate;
        }
        
        const user = await User.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        
        res.json({
            success: true,
            user,
            message: 'User updated successfully'
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// ===== DELETE USER (Admin Only) =====
router.delete('/users/:id', protect, async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        
        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// ===== GET ADMIN STATS (Admin Only) =====
router.get('/stats', protect, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const activeUsers = await User.countDocuments({ subscriptionStatus: 'active' });
        const inactiveUsers = await User.countDocuments({ subscriptionStatus: 'inactive' });
        
        const totalSignals = await Signal.countDocuments();
        const activeSignals = await Signal.countDocuments({ status: 'active' });
        const closedSignals = await Signal.countDocuments({ status: 'closed' });
        
        // Signals by pair
        const signalsByPair = await Signal.aggregate([
            { $group: { _id: '$pair', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);
        
        // Signals by action
        const signalsByAction = await Signal.aggregate([
            { $group: { _id: '$action', count: { $sum: 1 } } }
        ]);
        
        // Users by plan
        const usersByPlan = await User.aggregate([
            { $group: { _id: '$plan', count: { $sum: 1 } } }
        ]);
        
        // ZAR Revenue (South African Rand)
        const monthlyUsers = await User.countDocuments({ plan: 'monthly', subscriptionStatus: 'active' });
        const quarterlyUsers = await User.countDocuments({ plan: 'quarterly', subscriptionStatus: 'active' });
        const yearlyUsers = await User.countDocuments({ plan: 'yearly', subscriptionStatus: 'active' });
        
        const revenue = (monthlyUsers * 1850) + (quarterlyUsers * 3700) + (yearlyUsers * 11100);
        
        res.json({
            success: true,
            stats: {
                users: {
                    total: totalUsers,
                    active: activeUsers,
                    inactive: inactiveUsers,
                    byPlan: usersByPlan
                },
                signals: {
                    total: totalSignals,
                    active: activeSignals,
                    closed: closedSignals,
                    byPair: signalsByPair,
                    byAction: signalsByAction
                },
                revenue: {
                    total: revenue,
                    monthly: monthlyUsers * 1850,
                    quarterly: quarterlyUsers * 3700,
                    yearly: yearlyUsers * 11100,
                    currency: 'ZAR'
                }
            }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

module.exports = router;