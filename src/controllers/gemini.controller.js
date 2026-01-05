import geminiService from '../services/gemini.service.js';
// In ALL controller files (gemini.controller.js, medical.controller.js, etc.)
// import { getFirestoreDB, getFirebaseAuth } from '../firebase/admin.js';

// Helper function that gets Firebase instances when needed
function getFirebase() {
    return {
        db: getFirestoreDB(),
        auth: getFirebaseAuth()
    };
}

// Then use it in each method:
async function someMethod(req, res) {
    try {
        const { db } = getFirebase(); // Get DB instance here, not at top level
        // ... rest of your code
    } catch (error) {
        // Handle error
    }
}


/**
 * Gemini Proxy Controller
 */
const geminiController = {
    async research(req, res) {
        try {
            const { query } = req.body;
            
            if (!query || typeof query !== 'string' || query.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Query is required and must be a non-empty string'
                });
            }

            if (query.length > 1000) {
                return res.status(400).json({
                    success: false,
                    error: 'Query too long. Maximum 1000 characters.'
                });
            }

            const sanitizedQuery = query.trim().substring(0, 1000);
            const result = await geminiService.research(sanitizedQuery);
            
            res.json({
                success: true,
                data: {
                    text: result,
                    timestamp: new Date().toISOString()
                }
            });
        } catch (error) {
            console.error('Research controller error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to process research request'
            });
        }
    },

    async summarize(req, res) {
        try {
            const { notes } = req.body;
            
            if (!Array.isArray(notes)) {
                return res.status(400).json({
                    success: false,
                    error: 'Notes must be an array'
                });
            }

            if (notes.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Notes array cannot be empty'
                });
            }

            const limitedNotes = notes.slice(0, 50);
            const summary = await geminiService.summarize(limitedNotes);
            
            res.json({
                success: true,
                data: {
                    summary: summary,
                    noteCount: limitedNotes.length,
                    timestamp: new Date().toISOString()
                }
            });
        } catch (error) {
            console.error('Summarize controller error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to generate summary'
            });
        }
    },

    async textToSpeech(req, res) {
        try {
            const { text } = req.body;
            
            if (!text || typeof text !== 'string' || text.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Text is required for TTS'
                });
            }

            if (text.length > 2000) {
                return res.status(400).json({
                    success: false,
                    error: 'Text too long for TTS. Maximum 2000 characters.'
                });
            }

            const audioBase64 = await geminiService.textToSpeech(text.trim());
            
            res.json({
                success: true,
                data: {
                    audioBase64: audioBase64,
                    format: 'audio/wav',
                    timestamp: new Date().toISOString()
                }
            });
        } catch (error) {
            console.error('TTS controller error:', error);
            res.status(500).json({
                success: false,
                error: 'Text-to-speech service failed'
            });
        }
    }
};

export { geminiController };
