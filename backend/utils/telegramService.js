// Telegram Bot Service - Simplified Version

let TelegramBot = null;
let bot = null;
let isTelegramEnabled = false;

// Try to load telegram library
try {
    TelegramBot = require('node-telegram-bot-api');
} catch (error) {
    console.log('⚠️ Telegram bot library not installed - telegram features disabled');
}

// Initialize Telegram bot
const initTelegramBot = () => {
    try {
        if (!TelegramBot) {
            console.log('⚠️ Telegram library not available');
            return null;
        }

        // Check if Telegram bot token exists
        if (!process.env.TELEGRAM_BOT_TOKEN) {
            console.log('⚠️ Telegram bot token not found - Telegram features disabled');
            return null;
        }

        bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
        isTelegramEnabled = true;
        console.log('✅ Telegram Bot initialized');
        
        // Welcome message for /start command
        bot.onText(/\/start/, (msg) => {
            const chatId = msg.chat.id;
            bot.sendMessage(chatId, 
                '🤖 Welcome to ForexPro SA VIP Bot!\n\n' +
                '🇿🇦 You will receive VIP signals here.\n' +
                '📊 All signals are for educational purposes only.\n\n' +
                '⚠️ FSCA Warning: Trading involves substantial risk.'
            );
        });
        
        return bot;
    } catch (error) {
        console.log('⚠️ Telegram bot error:', error.message);
        return null;
    }
};

// Send signal to Telegram
const sendSignalToTelegram = async (signal) => {
    try {
        if (!isTelegramEnabled || !bot) {
            console.log('📱 Telegram: Signal ready (bot not configured)');
            return;
        }

        const isZAR = signal.pair.includes('ZAR');
        const flag = isZAR ? '🇿🇦' : '';

        const message = 
            `📊 *NEW VIP SIGNAL*\n\n` +
            `📌 Pair: *${flag} ${signal.pair}*\n` +
            `🔹 Action: *${signal.action}*\n` +
            `💰 Entry: *${signal.entry}*\n` +
            `🎯 Take Profit: *${signal.takeProfit}*\n` +
            `🛑 Stop Loss: *${signal.stopLoss}*\n` +
            `📈 Confidence: *${signal.confidence}*\n` +
            `${signal.analysis ? `📝 Analysis: ${signal.analysis}\n` : ''}` +
            `\n🇿🇦 ForexPro SA | ${new Date().toLocaleDateString('en-ZA')}\n\n` +
            `⚠️ *FSCA RISK WARNING:* Only trade with funds you can afford to lose.`;

        // In production, you would send to actual chat IDs
        console.log('📱 Telegram signal ready:', signal.pair);
        
        // To actually send, you'd need chat IDs stored in DB
        // Example: await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
        
    } catch (error) {
        console.log('⚠️ Telegram send error:', error.message);
    }
};

// Initialize on load (try to connect)
try {
    initTelegramBot();
} catch (error) {
    console.log('⚠️ Telegram service could not be initialized');
}

module.exports = { initTelegramBot, sendSignalToTelegram };