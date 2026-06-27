const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined in environment variables');
        }

        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            // These options are for Mongoose 6+ (default, but good to be explicit)
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        console.log(`📊 Database Name: ${conn.connection.name}`);
        console.log(`🔗 Connection String: ${process.env.MONGODB_URI.replace(/\/\/.*@/, '//****:****@')}`);
        
    } catch (error) {
        console.error('❌ MongoDB Connection Error:');
        console.error(`   Message: ${error.message}`);
        console.error(`   Code: ${error.code || 'N/A'}`);
        
        // Don't exit the process on Render - let it retry
        if (process.env.NODE_ENV === 'production') {
            console.log('⚠️ Continuing despite DB error - will retry on next request');
        } else {
            process.exit(1);
        }
    }
};

module.exports = connectDB;
