const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function checkQuota() {
    console.log('📊 Checking Gemini API Quota Status...\n');
    
    try {
        // Method 1: Check usage via API (if available)
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1/usage?key=${GEMINI_API_KEY}`,
            { headers: { 'Content-Type': 'application/json' } }
        );
        
        if (response.ok) {
            const usage = await response.json();
            console.log('✅ Usage data:', JSON.stringify(usage, null, 2));
        } else {
            console.log('❌ Usage API not accessible');
        }
        
    } catch (error) {
        console.log('❌ Error checking quota:', error.message);
    }
    
    console.log('\n🎯 FREE TIER LIMITS:');
    console.log('===================');
    console.log('1. TTS Requests: 10 per day per model');
    console.log('2. Text Generation: 60 requests per minute');
    console.log('3. Total Requests: 1500 per day');
    console.log('4. Input Characters: 1 million per minute');
    console.log('5. Output Characters: 30,000 per minute');
    console.log('');
    console.log('🔄 RESET TIMES:');
    console.log('==============');
    console.log('• Daily Limits: Reset at midnight Pacific Time (PT)');
    console.log('• That\'s 12:30 PM next day in India (IST)');
    console.log('• Minute Limits: Reset every 60 seconds');
    console.log('');
    
    // Calculate when it resets in your timezone
    const now = new Date();
    const pstTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
    const hoursToReset = (24 - pstTime.getHours()) % 24;
    const minutesToReset = 60 - pstTime.getMinutes();
    
    console.log(`⏰ Time until daily reset: ${hoursToReset}h ${minutesToReset}m`);
    console.log(`📅 Reset at: 12:30 PM IST (tomorrow)`);
    console.log('');
    console.log('💡 TIPS:');
    console.log('1. Use browser TTS for development');
    console.log('2. Save Gemini TTS for demos only');
    console.log('3. Implement caching (24h cache)');
    console.log('4. Upgrade to paid for $0.35/1M chars');
}

checkQuota().catch(console.error);
