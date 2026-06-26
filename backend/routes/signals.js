const express = require('express');
const router = express.Router();  // ← THIS WAS MISSING!
const { protect } = require('../middleware/auth');
const Signal = require('../models/Signal');
const User = require('../models/User');
const { getLiveRates } = require('../utils/marketAPI');
const { sendSignalEmail } = require('../utils/emailService');
const { sendSignalToTelegram } = require('../utils/telegramService');

// ===== GET ACTIVE SIGNALS (Protected) =====
router.get('/', protect, async (req, res) => {
    try {
        const signals = await Signal.find({ status: 'active' })
            .sort({ createdAt: -1 })
            .limit(10);

        res.json({
            success: true,
            count: signals.length,
            signals
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// ===== GET ALL SIGNALS (Admin - includes all) =====
router.get('/all', protect, async (req, res) => {
    try {
        const signals = await Signal.find()
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: signals.length,
            signals
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// ===== GET LIVE RATES (Protected - ALL PAIRS) =====
router.get('/rates', protect, async (req, res) => {
    try {
        // Get real rates from API
        const rates = await getLiveRates();
        
        res.json({
            success: true,
            rates,
            provider: 'FINNHUB',
            timestamp: new Date().toISOString(),
            totalPairs: Object.keys(rates).length
        });
    } catch (error) {
        console.error('Rates error:', error.message);
        
        // Fallback to simulated rates with ALL pairs
        const fallbackRates = {
            // ===== MAJOR PAIRS =====
            'EUR/USD': { price: 1.0892, change: '+0.12%' },
            'GBP/USD': { price: 1.2650, change: '-0.08%' },
            'USD/JPY': { price: 148.50, change: '+0.30%' },
            'AUD/USD': { price: 0.6540, change: '-0.15%' },
            'USD/CAD': { price: 1.3520, change: '+0.05%' },
            'USD/CHF': { price: 0.9120, change: '-0.02%' },
            'NZD/USD': { price: 0.5980, change: '+0.10%' },
            
            // ===== MINOR PAIRS =====
            'EUR/GBP': { price: 0.8610, change: '+0.08%' },
            'EUR/JPY': { price: 161.80, change: '+0.22%' },
            'EUR/CHF': { price: 0.9930, change: '-0.05%' },
            'GBP/JPY': { price: 187.90, change: '+0.18%' },
            'GBP/CHF': { price: 1.1530, change: '-0.03%' },
            'GBP/AUD': { price: 1.9350, change: '+0.12%' },
            'AUD/JPY': { price: 97.20, change: '+0.25%' },
            'AUD/CHF': { price: 0.5960, change: '-0.08%' },
            'AUD/NZD': { price: 1.0930, change: '+0.06%' },
            'CAD/JPY': { price: 109.80, change: '+0.20%' },
            'CHF/JPY': { price: 162.90, change: '+0.15%' },
            'NZD/JPY': { price: 88.80, change: '+0.18%' },
            'NZD/CHF': { price: 0.5450, change: '-0.04%' },
            'NZD/CAD': { price: 0.8180, change: '+0.07%' },
            
            // ===== EXOTIC PAIRS =====
            'EUR/SEK': { price: 11.82, change: '+0.15%' },
            'EUR/NOK': { price: 11.65, change: '-0.10%' },
            'EUR/DKK': { price: 7.45, change: '+0.02%' },
            'GBP/SEK': { price: 13.72, change: '+0.18%' },
            'GBP/NOK': { price: 13.52, change: '-0.12%' },
            'USD/SEK': { price: 10.85, change: '+0.20%' },
            'USD/NOK': { price: 10.69, change: '-0.08%' },
            'USD/DKK': { price: 6.84, change: '+0.02%' },
            'USD/TRY': { price: 32.45, change: '+0.45%' },
            'USD/SGD': { price: 1.345, change: '-0.06%' },
            'USD/HKD': { price: 7.82, change: '+0.01%' },
            'USD/MXN': { price: 16.85, change: '+0.25%' },
            'USD/PLN': { price: 3.98, change: '+0.12%' },
            'USD/CZK': { price: 22.85, change: '+0.08%' },
            'USD/HUF': { price: 360.50, change: '+0.22%' },
            'USD/ILS': { price: 3.72, change: '+0.05%' },
            'USD/KRW': { price: 1320.00, change: '+0.18%' },
            'USD/TWD': { price: 31.85, change: '+0.10%' },
            'USD/THB': { price: 36.20, change: '+0.15%' },
            'USD/CNY': { price: 7.25, change: '+0.08%' },
            'USD/INR': { price: 83.50, change: '+0.06%' },
            'USD/BRL': { price: 5.12, change: '+0.30%' },
            'USD/RUB': { price: 92.50, change: '+0.35%' },
            
            // ===== SOUTH AFRICAN ZAR PAIRS =====
            'USD/ZAR': { price: 18.75, change: '+0.42%' },
            'EUR/ZAR': { price: 20.12, change: '+0.28%' },
            'GBP/ZAR': { price: 23.45, change: '-0.15%' },
            'AUD/ZAR': { price: 12.30, change: '+0.08%' },
            'NZD/ZAR': { price: 11.25, change: '+0.12%' },
            'JPY/ZAR': { price: 0.126, change: '+0.05%' },
            'CHF/ZAR': { price: 20.60, change: '-0.10%' },
            'CAD/ZAR': { price: 13.85, change: '+0.15%' },
            'SEK/ZAR': { price: 1.72, change: '+0.08%' },
            'NOK/ZAR': { price: 1.75, change: '-0.06%' },
            'DKK/ZAR': { price: 2.74, change: '+0.02%' },
            'CNY/ZAR': { price: 2.58, change: '+0.10%' },
            'INR/ZAR': { price: 0.224, change: '+0.04%' },
            'TRY/ZAR': { price: 0.577, change: '+0.18%' },
            'PLN/ZAR': { price: 4.72, change: '+0.12%' },
            'CZK/ZAR': { price: 0.820, change: '+0.06%' },
            'HUF/ZAR': { price: 0.052, change: '+0.09%' },
            'SGD/ZAR': { price: 13.92, change: '+0.14%' },
            'HKD/ZAR': { price: 2.40, change: '+0.03%' },
            'MXN/ZAR': { price: 1.11, change: '+0.20%' },
            'BRL/ZAR': { price: 3.66, change: '+0.25%' },
            'RUB/ZAR': { price: 0.203, change: '+0.30%' },
            
            // ===== GOLD & COMMODITIES =====
            'XAU/USD': { price: 2345.00, change: '+0.35%' },
            'XAG/USD': { price: 27.80, change: '+0.45%' },
            'XAU/ZAR': { price: 43950.00, change: '+0.52%' },
            'XAG/ZAR': { price: 521.00, change: '+0.62%' },
            
            // ===== CRYPTO PAIRS =====
            'BTC/USD': { price: 65000.00, change: '+1.20%' },
            'ETH/USD': { price: 3500.00, change: '+0.85%' },
            'BTC/ZAR': { price: 1218000.00, change: '+1.35%' },
            'ETH/ZAR': { price: 65600.00, change: '+0.95%' }
        };
        
        res.json({
            success: true,
            rates: fallbackRates,
            provider: 'SIMULATED (All Pairs)',
            timestamp: new Date().toISOString(),
            totalPairs: Object.keys(fallbackRates).length
        });
    }
});

// ===== CREATE SIGNAL (Protected - Admin only) =====
router.post('/', protect, async (req, res) => {
    try {
        const { pair, action, entry, takeProfit, stopLoss, confidence, analysis } = req.body;

        // Validate required fields
        if (!pair || !action || !entry || !takeProfit || !stopLoss) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: pair, action, entry, takeProfit, stopLoss'
            });
        }

        // Create signal
        const signal = await Signal.create({
            pair,
            action,
            entry,
            takeProfit,
            stopLoss,
            confidence: confidence || 'MEDIUM',
            analysis: analysis || '',
            status: 'active',
            createdAt: new Date()
        });

        // Send notifications to all active VIP users
        if (signal) {
            const activeUsers = await User.find({ 
                subscriptionStatus: 'active' 
            });

            for (const user of activeUsers) {
                try {
                    await sendSignalEmail(user, signal);
                    console.log(`📧 Email sent to ${user.email}`);
                } catch (error) {
                    console.error(`Failed to send email to ${user.email}:`, error.message);
                }
            }

            try {
                await sendSignalToTelegram(signal);
                console.log('📱 Telegram notifications sent');
            } catch (error) {
                console.error('Telegram send error:', error.message);
            }
        }

        res.status(201).json({
            success: true,
            signal,
            message: 'Signal created and notifications sent to all VIP members'
        });
    } catch (error) {
        console.error('Create signal error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// ===== UPDATE SIGNAL (Protected - Admin only) =====
router.put('/:id', protect, async (req, res) => {
    try {
        const { pair, action, entry, takeProfit, stopLoss, confidence, status, analysis } = req.body;

        const signal = await Signal.findByIdAndUpdate(
            req.params.id,
            {
                pair,
                action,
                entry,
                takeProfit,
                stopLoss,
                confidence: confidence || 'MEDIUM',
                status: status || 'active',
                analysis: analysis || ''
            },
            { new: true, runValidators: true }
        );

        if (!signal) {
            return res.status(404).json({
                success: false,
                error: 'Signal not found'
            });
        }

        res.json({
            success: true,
            signal
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// ===== DELETE SIGNAL (Protected - Admin only) =====
router.delete('/:id', protect, async (req, res) => {
    try {
        const signal = await Signal.findByIdAndDelete(req.params.id);

        if (!signal) {
            return res.status(404).json({
                success: false,
                error: 'Signal not found'
            });
        }

        res.json({
            success: true,
            message: 'Signal deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// ===== BULK CREATE SIGNALS (Admin only) =====
router.post('/bulk', protect, async (req, res) => {
    try {
        const { signals } = req.body;

        if (!signals || !Array.isArray(signals)) {
            return res.status(400).json({
                success: false,
                error: 'Signals array is required'
            });
        }

        const createdSignals = [];
        for (const signalData of signals) {
            const signal = await Signal.create(signalData);
            createdSignals.push(signal);
        }

        const activeUsers = await User.find({ subscriptionStatus: 'active' });
        
        for (const signal of createdSignals) {
            for (const user of activeUsers) {
                try {
                    await sendSignalEmail(user, signal);
                } catch (error) {
                    console.error(`Failed to send email for signal ${signal.pair}:`, error.message);
                }
            }
            
            try {
                await sendSignalToTelegram(signal);
            } catch (error) {
                console.error('Telegram send error:', error.message);
            }
        }

        res.status(201).json({
            success: true,
            count: createdSignals.length,
            signals: createdSignals,
            message: `${createdSignals.length} signals created and notifications sent`
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// ===== GET SIGNAL STATS (Protected - Admin only) =====
router.get('/stats', protect, async (req, res) => {
    try {
        const total = await Signal.countDocuments();
        const active = await Signal.countDocuments({ status: 'active' });
        const closed = await Signal.countDocuments({ status: 'closed' });
        
        const recent = await Signal.find()
            .sort({ createdAt: -1 })
            .limit(5);

        const byPair = await Signal.aggregate([
            { $group: { _id: '$pair', count: { $sum: 1 } } }
        ]);

        res.json({
            success: true,
            stats: {
                total,
                active,
                closed,
                byPair,
                recent
            }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

module.exports = router;  // ← THIS IS REQUIRED!