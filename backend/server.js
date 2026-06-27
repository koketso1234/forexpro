const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/database');

// Load environment variables
dotenv.config();

// Set timezone to South Africa
process.env.TZ = 'Africa/Johannesburg';

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/signals', require('./routes/signals'));
app.use('/api/admin', require('./routes/admin'));

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'ForexPro SA Server is running',
        timezone: process.env.TZ,
        timestamp: new Date().toISOString()
    });
});
// Test database connection
app.get('/test-db', async (req, res) => {
    try {
        const db = mongoose.connection;
        
        if (db.readyState === 1) { // 1 = connected
            const collections = await mongoose.connection.db.listCollections().toArray();
            res.json({
                success: true,
                message: '✅ Database connected!',
                databaseName: db.name,
                collections: collections.map(c => c.name),
                readyState: db.readyState,
                host: db.host
            });
        } else {
            res.status(500).json({
                success: false,
                message: '❌ Database not connected',
                readyState: db.readyState,
                states: {
                    0: 'disconnected',
                    1: 'connected',
                    2: 'connecting',
                    3: 'disconnecting'
                }
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        success: false,
        error: 'Route not found' 
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ 
        success: false,
        error: 'Server error' 
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 ForexPro SA Server running on http://localhost:${PORT}`);
    console.log(`🇿🇦 Timezone: ${process.env.TZ}`);
});
