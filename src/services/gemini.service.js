import 'dotenv/config';

/**
 * Gemini API Service
 * All Gemini API calls are proxied through backend for security
 */
class GeminiService {
    constructor() {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY environment variable is required');
        }
        this.apiKey = process.env.GEMINI_API_KEY;
        this.baseURL = 'https://generativelanguage.googleapis.com/v1beta/models';
    }

    async _makeRequest(model, endpoint, payload) {
        try {
            const url = `${this.baseURL}/${model}:${endpoint}?key=${this.apiKey}`;
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Gemini API error (${response.status}): ${errorText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Gemini API request failed:', error.message);
            throw new Error(`Gemini service unavailable: ${error.message}`);
        }
    }

    /**
     * Research medical topics using Gemini
     */
    async research(query) {
        try {
            const payload = {
                contents: [{
                    parts: [{
                        text: `As a medical research assistant, provide accurate, concise information about: "${query}". 
                        Focus on evidence-based medical information relevant to elderly care. 
                        Include citations if available. Keep response under 500 words.`
                    }]
                }],
                generationConfig: {
                    temperature: 0.2,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 1000,
                }
            };

            const result = await this._makeRequest(
                'gemini-2.5-flash-preview-09-2025',
                'generateContent',
                payload
            );

            return result.candidates?.[0]?.content?.parts?.[0]?.text || 
                   'No information available at the moment.';
        } catch (error) {
            console.error('Research service error:', error);
            return 'Research service is temporarily unavailable. Please try again later.';
        }
    }

    /**
     * Summarize medical notes
     */
    async summarize(notes) {
        try {
            const notesText = notes.map(n => 
                typeof n === 'string' ? n : n.text || JSON.stringify(n)
            ).join('\n---\n');

            const payload = {
                contents: [{
                    parts: [{
                        text: `As a clinical summary assistant, analyze these patient notes and provide a concise summary.
                        
                        Notes:
                        ${notesText}
                        
                        Please provide:
                        1. Key observations and trends
                        2. Any concerning patterns
                        3. Recommendations for follow-up
                        4. Overall patient status
                        
                        Keep it professional, clinical, and under 300 words.`
                    }]
                }],
                generationConfig: {
                    temperature: 0.1,
                    topK: 20,
                    topP: 0.9,
                    maxOutputTokens: 800,
                }
            };

            const result = await this._makeRequest(
                'gemini-2.5-flash-preview-09-2025',
                'generateContent',
                payload
            );

            return result.candidates?.[0]?.content?.parts?.[0]?.text || 
                   'Unable to generate summary at this time.';
        } catch (error) {
            console.error('Summarization service error:', error);
            return 'Summary service is temporarily unavailable.';
        }
    }

    /**
     * Text-to-Speech for medication schedules
     */
    async textToSpeech(text) {
        try {
            const payload = {
                contents: [{
                    parts: [{
                        text: `In a warm, clear, caregiver voice, say: ${text}`
                    }]
                }],
                generationConfig: {
                    responseModalities: ["AUDIO"],
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: {
                                voiceName: "Kore"
                            }
                        }
                    }
                }
            };

            const result = await this._makeRequest(
                'gemini-2.5-flash-preview-tts',
                'generateContent',
                payload
            );

            // Extract audio data
            const audioPart = result.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
            if (!audioPart?.inlineData?.data) {
                throw new Error('No audio data returned from TTS service');
            }

            return audioPart.inlineData.data;
        } catch (error) {
            console.error('TTS service error:', error);
            throw new Error('Text-to-speech service is temporarily unavailable.');
        }
    }
}

export default new GeminiService();



// // In src/services/gemini.service.js
// import 'dotenv/config';

// class GeminiService {
//     constructor() {
//         if (!process.env.GEMINI_API_KEY) {
//             throw new Error('GEMINI_API_KEY environment variable is required');
//         }
//         this.apiKey = process.env.GEMINI_API_KEY;
//         this.baseURL = 'https://generativelanguage.googleapis.com/v1beta';
//     }

//     async _makeRequest(endpoint, payload) {
//         try {
//             const url = `${this.baseURL}/${endpoint}?key=${this.apiKey}`;
            
//             console.log(`🔊 Gemini request to: ${endpoint.split('/')[0]}`);
            
//             const response = await fetch(url, {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify(payload)
//             });

//             if (!response.ok) {
//                 const errorText = await response.text();
//                 console.error(`Gemini API error (${response.status}):`, errorText);
//                 throw new Error(`Gemini API error (${response.status}): ${errorText}`);
//             }

//             return await response.json();
//         } catch (error) {
//             console.error('Gemini API request failed:', error.message);
//             throw new Error(`Gemini service unavailable: ${error.message}`);
//         }
//     }

//     /**
//      * CORRECT Gemini TTS - Works with gemini-2.5-flash-exp model
//      */
//     async textToSpeech(text) {
//         try {
//             console.log('🔊 Gemini TTS Request:', text.substring(0, 50) + '...');
            
//             // Method 1: Try gemini-2.5-flash-exp model (supports TTS)
//             try {
//                 const payload = {
//                     contents: [{
//                         role: "user",
//                         parts: [{
//                             text: `Speak this in a warm, clear caregiver voice: ${text}`
//                         }]
//                     }],
//                     generationConfig: {
//                         temperature: 0.7,
//                         responseModalities: ["AUDIO"],
//                         audioConfig: {
//                             audioEncoding: "LINEAR16",
//                             speakingRate: 1.0,
//                             pitch: 0.0,
//                             voiceConfig: {
//                                 prebuiltVoiceConfig: {
//                                     voiceName: "en-US-Neural2-J"
//                                 }
//                             }
//                         }
//                     }
//                 };

//                 const result = await this._makeRequest(
//                     'models/gemini-2.5-flash-exp:generateContent',
//                     payload
//                 );

//                 // Extract audio from response
//                 if (result.candidates?.[0]?.content?.parts) {
//                     for (const part of result.candidates[0].content.parts) {
//                         if (part.inlineData?.data) {
//                             console.log('✅ Gemini TTS successful (inlineData)');
//                             return part.inlineData.data;
//                         }
//                     }
//                 }

//                 if (result.audioContent) {
//                     console.log('✅ Gemini TTS successful (audioContent)');
//                     return result.audioContent;
//                 }
//             } catch (error) {
//                 console.log('❌ gemini-2.5-flash-exp failed:', error.message);
//             }

//             // Method 2: Try older model
//             try {
//                 const payload = {
//                     contents: [{
//                         parts: [{
//                             text: `[SPEAK THIS] ${text}`
//                         }]
//                     }],
//                     generationConfig: {
//                         temperature: 0.7,
//                         response_modalities: ["AUDIO"]
//                     }
//                 };

//                 const result = await this._makeRequest(
//                     'models/gemini-1.5-pro:generateContent',
//                     payload
//                 );

//                 if (result.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data) {
//                     console.log('✅ gemini-1.5-pro TTS successful');
//                     return result.candidates[0].content.parts[0].inlineData.data;
//                 }
//             } catch (error) {
//                 console.log('❌ gemini-1.5-pro failed:', error.message);
//             }

//             throw new Error('No Gemini TTS models available');
            
//         } catch (error) {
//             console.error('Gemini TTS failed:', error.message);
            
//             // Fallback to browser Web Speech API via frontend
//             console.log('⚠️ Gemini TTS not available. Using fallback.');
//             throw new Error('TTS not available. Please use browser speech instead.');
//         }
//     }

//     /**
//      * Get available models to check TTS support
//      */
//     async getAvailableModels() {
//         try {
//             const response = await fetch(
//                 `${this.baseURL}/models?key=${this.apiKey}`,
//                 { headers: { 'Content-Type': 'application/json' } }
//             );
            
//             if (response.ok) {
//                 const data = await response.json();
//                 console.log('📊 Available Gemini models:');
//                 data.models?.forEach(model => {
//                     console.log(`   - ${model.name} (${model.displayName})`);
//                     if (model.supportedGenerationMethods) {
//                         console.log(`     Methods: ${model.supportedGenerationMethods.join(', ')}`);
//                     }
//                 });
//             }
//         } catch (error) {
//             console.error('Failed to get models:', error.message);
//         }
//     }

//     // ... [keep other methods: research(), summarize(), etc.] ...
// }

// export default new GeminiService();