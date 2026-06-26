const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendWelcomeEmail } = require('../utils/emailService');

// ===== REGISTER =====
router.post('/register', async (req, res) => {
    try {
        const { name, email, phone, password, plan } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ 
                success: false,
                error: 'Email already registered' 
            });
        }

        // Calculate subscription dates
        const startDate = new Date();
        let endDate = new Date();
        let price = 0;

        switch(plan) {
            case 'monthly':
                endDate.setMonth(endDate.getMonth() + 1);
                price = 1850; // ZAR
                break;
            case 'quarterly':
                endDate.setMonth(endDate.getMonth() + 3);
                price = 3700; // ZAR
                break;
            case 'yearly':
                endDate.setFullYear(endDate.getFullYear() + 1);
                price = 11100; // ZAR
                break;
            default:
                return res.status(400).json({
                    success: false,
                    error: 'Invalid plan selected'
                });
        }

        // Create user
        const user = await User.create({
            name,
            email,
            phone,
            password,
            plan: plan || 'monthly',
            subscriptionStatus: 'active',
            subscriptionStart: startDate,
            subscriptionEnd: endDate,
            isVerified: true
        });

        // Generate token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE }
        );

        // Send welcome email
        try {
            await sendWelcomeEmail(user, plan, price);
        } catch (error) {
            console.error('Email error:', error.message);
        }

        res.status(201).json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                plan: user.plan,
                subscriptionStatus: user.subscriptionStatus,
                subscriptionEnd: user.subscriptionEnd
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// ===== LOGIN =====
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate email & password
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Please provide email and password'
            });
        }

        // Check for user
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        // Check subscription status
        if (user.subscriptionStatus !== 'active') {
            return res.status(403).json({
                success: false,
                error: 'Your subscription is inactive. Please renew to access VIP features.',
                subscriptionStatus: user.subscriptionStatus
            });
        }

        // Generate token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE }
        );

        res.status(200).json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                plan: user.plan,
                subscriptionStatus: user.subscriptionStatus,
                subscriptionEnd: user.subscriptionEnd
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// ===== GET CURRENT USER =====
router.get('/me', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ 
                success: false,
                error: 'No token provided' 
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');

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
        res.status(401).json({ 
            success: false,
            error: 'Invalid token' 
        });
    }
});

module.exports = router;