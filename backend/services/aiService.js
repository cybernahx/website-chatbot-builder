const OpenAI = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');

class AIService {
    constructor() {
        // OpenAI Setup
        if (process.env.OPENAI_API_KEY) {
            this.openai = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY
            });
        }
        
        // Gemini Setup
        if (process.env.GEMINI_API_KEY) {
            this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            this.geminiModel = this.genAI.getGenerativeModel({ model: "gemini-pro"});
            this.geminiEmbeddingModel = this.genAI.getGenerativeModel({ model: "embedding-001"});
        }

        this.model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
        this.embeddingModel = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';
        
        // Determine provider: Prefer OpenAI if available, else Gemini
        this.provider = process.env.AI_PROVIDER || (this.openai ? 'openai' : (this.genAI ? 'gemini' : null));
        
        if (!this.provider) {
            console.warn('No AI provider configured (OpenAI or Gemini). AI features will not work.');
        } else {
            console.log(`Using AI Provider: ${this.provider}`);
        }
    }

    /**
     * Generate embeddings for text
     */
    async generateEmbedding(text) {
        try {
            if (this.provider === 'gemini') {
                const result = await this.geminiEmbeddingModel.embedContent(text);
                return result.embedding.values;
            } else if (this.provider === 'openai') {
                const response = await this.openai.embeddings.create({
                    model: this.embeddingModel,
                    input: text
                });
                return response.data[0].embedding;
            }
            throw new Error('No AI provider configured');
        } catch (error) {
            console.error('Embedding generation error:', error);
            throw new Error('Failed to generate embedding');
        }
    }

    /**
     * Generate embeddings for multiple texts
     */
    async generateEmbeddings(texts) {
        try {
            const embeddings = [];
            const batchSize = 10;
            
            for (let i = 0; i < texts.length; i += batchSize) {
                const batch = texts.slice(i, i + batchSize);
                
                if (this.provider === 'gemini') {
                    // Gemini doesn't support batch embedding in the same way, do one by one or parallel
                    // For simplicity and rate limits, let's do parallel with limit
                    const batchPromises = batch.map(text => this.generateEmbedding(text));
                    const batchEmbeddings = await Promise.all(batchPromises);
                    embeddings.push(...batchEmbeddings);
                } else {
                    const response = await this.openai.embeddings.create({
                        model: this.embeddingModel,
                        input: batch
                    });
                    embeddings.push(...response.data.map(d => d.embedding));
                }
            }
            
            return embeddings;
        } catch (error) {
            console.error('Batch embedding error:', error);
            throw new Error('Failed to generate embeddings');
        }
    }

    /**
     * Calculate cosine similarity between two vectors
     */
    cosineSimilarity(vecA, vecB) {
        if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
        const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
        const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
        const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
        return dotProduct / (magnitudeA * magnitudeB);
    }

    /**
     * Find most relevant context from knowledge base
     */
    async findRelevantContext(query, knowledgeBase, topK = 3) {
        try {
            // Generate embedding for query
            const queryEmbedding = await this.generateEmbedding(query);
            
            // Calculate similarities
            const similarities = [];
            for (const doc of knowledgeBase) {
                for (const chunk of doc.chunks) {
                    if (chunk.embedding && chunk.embedding.length > 0) {
                        const similarity = this.cosineSimilarity(
                            queryEmbedding,
                            chunk.embedding
                        );
                        similarities.push({
                            text: chunk.text,
                            similarity,
                            source: doc.filename,
                            metadata: chunk.metadata
                        });
                    }
                }
            }
            
            // Sort by similarity and return top K
            similarities.sort((a, b) => b.similarity - a.similarity);
            return similarities.slice(0, topK);
        } catch (error) {
            console.error('Context finding error:', error);
            return [];
        }
    }

    /**
     * Generate chat completion with context
     */
    async chat(messages, systemPrompt, context = [], chatbotSettings = {}) {
        try {
            const {
                model = this.model,
                temperature = 0.7,
                maxTokens = 500
            } = chatbotSettings;

            // Build context string
            let contextString = '';
            if (context.length > 0) {
                contextString = '\n\nRelevant Information:\n' + 
                    context.map((c, i) => `[${i + 1}] ${c.text}`).join('\n\n');
            }

            if (this.provider === 'gemini') {
                // Convert messages to Gemini format
                // Gemini history: [{ role: "user" | "model", parts: [{ text: "..." }] }]
                
                const history = messages.map(msg => ({
                    role: msg.role === 'user' ? 'user' : 'model',
                    parts: [{ text: msg.content }]
                }));

                // Use the chat session
                // We need to separate the last message for sendMessage
                const lastMessage = history.pop();
                
                const chat = this.geminiModel.startChat({
                    history: history,
                    generationConfig: {
                        maxOutputTokens: maxTokens,
                        temperature: temperature,
                    },
                });

                const fullPrompt = `${systemPrompt}\n${contextString}\n\nUser: ${lastMessage.parts[0].text}`;
                
                const result = await chat.sendMessage(fullPrompt);
                const response = await result.response;
                
                return {
                    message: response.text(),
                    usage: { total_tokens: 0 }, // Gemini doesn't return usage in same format
                    model: 'gemini-pro'
                };

            } else {
                // OpenAI Implementation
                const chatMessages = [
                    {
                        role: 'system',
                        content: systemPrompt + contextString
                    },
                    ...messages
                ];

                const response = await this.openai.chat.completions.create({
                    model,
                    messages: chatMessages,
                    temperature,
                    max_tokens: maxTokens
                });

                return {
                    message: response.choices[0].message.content,
                    usage: response.usage,
                    model: response.model
                };
            }
        } catch (error) {
            console.error('Chat completion error:', error);
            throw new Error('Failed to generate response');
        }
    }

    /**
     * Real Estate Specific: Extract property requirements from user message
     */
    async extractPropertyRequirements(userMessage) {
        try {
            const extractionPrompt = `Extract property search requirements from the user message.
Return a JSON object with these fields:
- budget: {min: number, max: number, currency: string}
- location: string
- propertyType: string (house/flat/commercial)
- bedrooms: number
- features: array of strings

User message: "${userMessage}"

Return ONLY valid JSON, no other text. Do not use markdown formatting like \`\`\`json.`;

            if (this.provider === 'gemini') {
                const result = await this.geminiModel.generateContent(extractionPrompt);
                const response = await result.response;
                let text = response.text();
                // Clean up markdown if present
                text = text.replace(/```json/g, '').replace(/```/g, '').trim();
                return JSON.parse(text);
            } else {
                const response = await this.openai.chat.completions.create({
                    model: 'gpt-4o-mini',
                    messages: [{ role: 'user', content: extractionPrompt }],
                    temperature: 0.3,
                    response_format: { type: "json_object" }
                });
                return JSON.parse(response.choices[0].message.content);
            }
        } catch (error) {
            console.error('Property extraction error:', error);
            return null;
        }
    }

    /**
     * Match properties based on requirements
     */
    matchProperties(requirements, properties) {
        return properties.filter(prop => {
            // Budget filter
            if (requirements.budget && prop.price) {
                const budget = requirements.budget;
                if (budget.min && prop.price < budget.min) return false;
                if (budget.max && prop.price > budget.max) return false;
            }

            // Location filter
            if (requirements.location && prop.location) {
                const locationMatch = prop.location.toLowerCase()
                    .includes(requirements.location.toLowerCase()) ||
                    prop.city.toLowerCase()
                    .includes(requirements.location.toLowerCase());
                if (!locationMatch) return false;
            }

            // Property type filter
            if (requirements.propertyType && prop.propertyType) {
                const typeMatch = prop.propertyType.toLowerCase()
                    .includes(requirements.propertyType.toLowerCase());
                if (!typeMatch) return false;
            }

            // Bedrooms filter
            if (requirements.bedrooms && prop.bedrooms) {
                if (prop.bedrooms < requirements.bedrooms) return false;
            }

            return true;
        });
    }

    /**
     * Chunk text for embedding
     */
    chunkText(text, chunkSize = 500, overlap = 50) {
        const chunks = [];
        const words = text.split(/\s+/);
        
        for (let i = 0; i < words.length; i += chunkSize - overlap) {
            const chunk = words.slice(i, i + chunkSize).join(' ');
            chunks.push(chunk);
        }
        
        return chunks;
    }
}

module.exports = new AIService();
