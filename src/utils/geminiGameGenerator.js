'use strict';

const { callGeminiWithRetry } = require('./geminiTriage');

/**
 * Build prompt for quiz generation
 * @param {string} difficulty - Difficulty level (beginner, intermediate, advanced)
 * @param {string} topic - Topic area (optional)
 * @param {number} numQuestions - Number of questions to generate
 * @returns {string} - Formatted prompt
 */
function buildQuizPrompt(difficulty, topic = null, numQuestions = 5) {
    const topicText = topic ? ` focusing on ${topic}` : '';
    
    return `Generate ${numQuestions} fitness and health quiz questions for a ${difficulty} level user${topicText}.
Each question should have:
- A clear question about fitness, nutrition, exercise form, or health
- 4 multiple choice answers (A, B, C, D)
- One correct answer
- A brief explanation

Topics to include: exercise form and technique, nutrition basics, muscle groups and anatomy, workout principles, recovery and rest.

Return as a valid JSON array with this exact format:
[
  {
    "question": "What is the recommended daily water intake for adults?",
    "options": ["A) 2-3 liters", "B) 4-5 liters", "C) 1-2 liters", "D) 5-6 liters"],
    "correctIndex": 0,
    "explanation": "The recommended daily water intake for adults is 2-3 liters, which helps maintain proper hydration and supports bodily functions."
  }
]

Important: Return ONLY valid JSON, no markdown formatting, no code blocks, just the JSON array.`;
}

/**
 * Build prompt for memory game generation
 * @param {string} difficulty - Difficulty level (beginner, intermediate, advanced)
 * @param {number} numPairs - Number of exercise pairs to generate
 * @returns {string} - Formatted prompt
 */
function buildMemoryGamePrompt(difficulty, numPairs = 8) {
    return `Generate ${numPairs} pairs of fitness exercises for a memory matching game.
Each pair should be related (same muscle group, similar movement, or complementary exercises).
For ${difficulty} level users.

Return as a valid JSON array with this exact format:
[
  {
    "exercise1": {
      "name": "Push-ups",
      "muscleGroup": "Chest, Triceps",
      "description": "Bodyweight exercise targeting upper body"
    },
    "exercise2": {
      "name": "Chest Press",
      "muscleGroup": "Chest, Triceps",
      "description": "Weighted exercise targeting same muscle groups"
    }
  }
]

Important: Return ONLY valid JSON, no markdown formatting, no code blocks, just the JSON array.`;
}

/**
 * Parse quiz response from Gemini
 * @param {string} geminiText - Raw text response from Gemini
 * @returns {Array} - Parsed quiz questions
 */
function parseQuizResponse(geminiText) {
    try {
        // Remove markdown code blocks if present
        let cleaned = geminiText.trim();
        if (cleaned.startsWith('```json')) {
            cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
        } else if (cleaned.startsWith('```')) {
            cleaned = cleaned.replace(/```\n?/g, '');
        }

        // Parse JSON
        const parsed = JSON.parse(cleaned);
        
        if (!Array.isArray(parsed)) {
            throw new Error('Response is not an array');
        }

        // Validate structure
        const validated = parsed.map((item, index) => {
            if (!item.question || !Array.isArray(item.options) || item.options.length !== 4) {
                throw new Error(`Invalid question structure at index ${index}`);
            }
            if (typeof item.correctIndex !== 'number' || item.correctIndex < 0 || item.correctIndex > 3) {
                throw new Error(`Invalid correctIndex at index ${index}`);
            }
            return {
                question: item.question,
                options: item.options,
                correctIndex: item.correctIndex,
                explanation: item.explanation || ''
            };
        });

        return validated;
    } catch (error) {
        console.error('Failed to parse quiz response:', error);
        console.error('Raw response:', geminiText);
        throw new Error(`Invalid quiz response format: ${error.message}`);
    }
}

/**
 * Parse memory game response from Gemini
 * @param {string} geminiText - Raw text response from Gemini
 * @returns {Array} - Parsed exercise pairs
 */
function parseMemoryGameResponse(geminiText) {
    try {
        // Remove markdown code blocks if present
        let cleaned = geminiText.trim();
        if (cleaned.startsWith('```json')) {
            cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
        } else if (cleaned.startsWith('```')) {
            cleaned = cleaned.replace(/```\n?/g, '');
        }

        // Parse JSON
        const parsed = JSON.parse(cleaned);
        
        if (!Array.isArray(parsed)) {
            throw new Error('Response is not an array');
        }

        // Validate structure
        const validated = parsed.map((item, index) => {
            if (!item.exercise1 || !item.exercise2) {
                throw new Error(`Invalid pair structure at index ${index}`);
            }
            if (!item.exercise1.name || !item.exercise2.name) {
                throw new Error(`Missing exercise names at index ${index}`);
            }
            return {
                exercise1: {
                    name: item.exercise1.name,
                    muscleGroup: item.exercise1.muscleGroup || '',
                    description: item.exercise1.description || ''
                },
                exercise2: {
                    name: item.exercise2.name,
                    muscleGroup: item.exercise2.muscleGroup || '',
                    description: item.exercise2.description || ''
                }
            };
        });

        return validated;
    } catch (error) {
        console.error('Failed to parse memory game response:', error);
        console.error('Raw response:', geminiText);
        throw new Error(`Invalid memory game response format: ${error.message}`);
    }
}

/**
 * Generate quiz questions using Gemini AI
 * @param {string} difficulty - Difficulty level
 * @param {string} topic - Topic area (optional)
 * @param {number} numQuestions - Number of questions
 * @param {number} maxRetries - Maximum retry attempts
 * @returns {Promise<Array>} - Generated quiz questions
 */
async function generateQuizWithGemini(difficulty, topic = null, numQuestions = 5, maxRetries = 3) {
    const prompt = buildQuizPrompt(difficulty, topic, numQuestions);
    
    try {
        const response = await callGeminiWithRetry(prompt, maxRetries);
        const responseText = typeof response === 'string' ? response : response.text;
        
        return parseQuizResponse(responseText);
    } catch (error) {
        console.error('Failed to generate quiz with Gemini:', error);
        throw error;
    }
}

/**
 * Generate memory game pairs using Gemini AI
 * @param {string} difficulty - Difficulty level
 * @param {number} numPairs - Number of pairs
 * @param {number} maxRetries - Maximum retry attempts
 * @returns {Promise<Array>} - Generated exercise pairs
 */
async function generateMemoryGameWithGemini(difficulty, numPairs = 8, maxRetries = 3) {
    const prompt = buildMemoryGamePrompt(difficulty, numPairs);
    
    try {
        const response = await callGeminiWithRetry(prompt, maxRetries);
        const responseText = typeof response === 'string' ? response : response.text;
        
        return parseMemoryGameResponse(responseText);
    } catch (error) {
        console.error('Failed to generate memory game with Gemini:', error);
        throw error;
    }
}

module.exports = {
    buildQuizPrompt,
    buildMemoryGamePrompt,
    parseQuizResponse,
    parseMemoryGameResponse,
    generateQuizWithGemini,
    generateMemoryGameWithGemini
};

