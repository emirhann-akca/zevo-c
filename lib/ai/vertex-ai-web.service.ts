/**
 * ZEVO Web Vertex AI Service
 *
 * Web-optimized version with:
 * - Streaming support (SSE)
 * - No Firebase dependency
 * - Singleton pattern
 * - Next.js compatible
 * - Vercel deployment ready
 */

import {
    VertexAI,
    HarmCategory,
    HarmBlockThreshold,
} from '@google-cloud/vertexai';

// ─── Types ─────────────────────────────────────────────────

export interface ChatMessage {
    role: 'user' | 'model';
    content: string;
}

export interface ChatRequest {
    message: string;
    history?: ChatMessage[];
    systemInstruction?: string;
    context?: Record<string, unknown>;
}

export interface ChatResponse {
    message: string;
    usage: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
}

export class VertexAIWebError extends Error {
    constructor(
        message: string,
        public statusCode: number = 500,
        public retryable: boolean = false
    ) {
        super(message);
        this.name = 'VertexAIWebError';
    }
}

// ─── Service ───────────────────────────────────────────────

export class VertexAIWebService {
    private vertexAI: VertexAI;
    private model: any;
    private modelName: string;
    private MAX_RETRIES = 3;
    private BASE_RETRY_DELAY = 1000;

    constructor() {
        const projectId = process.env.VERTEX_PROJECT_ID;
        const location = process.env.VERTEX_AI_LOCATION || 'us-central1';
        this.modelName = process.env.VERTEX_AI_MODEL || 'gemini-2.0-flash-exp';

        if (!projectId) {
            throw new Error(
                'VERTEX_PROJECT_ID environment variable is required. ' +
                'Set it in .env.local or Vercel environment variables.'
            );
        }

        // Handle credentials for Vercel deployment
        if (process.env.GOOGLE_CLOUD_CREDENTIALS) {
            const credentials = JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS);
            this.vertexAI = new VertexAI({
                project: projectId,
                location: location,
                googleAuthOptions: { credentials },
            });
        } else {
            // Uses GOOGLE_APPLICATION_CREDENTIALS env var automatically
            this.vertexAI = new VertexAI({
                project: projectId,
                location: location,
            });
        }

        this.model = this.vertexAI.getGenerativeModel({
            model: this.modelName,
            generationConfig: {
                temperature: 0.7,
                topP: 0.95,
                topK: 40,
                maxOutputTokens: 2048,
            },
            safetySettings: [
                {
                    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                },
            ],
        });

        console.log('✅ Vertex AI Web Service initialized:', {
            project: projectId,
            location,
            model: this.modelName,
        });
    }

    /**
     * Standard chat (non-streaming)
     */
    async chat(request: ChatRequest): Promise<ChatResponse> {
        if (!request.message?.trim()) {
            throw new VertexAIWebError('Message cannot be empty', 400, false);
        }

        let systemInstruction = request.systemInstruction || '';
        if (request.context && Object.keys(request.context).length > 0) {
            systemInstruction += `\n\nContext: ${JSON.stringify(request.context)}`;
        }

        return this.retryWithBackoff(async () => {
            const chat = this.model.startChat({
                history: (request.history || []).map((msg: ChatMessage) => ({
                    role: msg.role === 'user' ? 'user' : 'model',
                    parts: [{ text: msg.content }],
                })),
                systemInstruction: systemInstruction || undefined,
            });

            const result = await chat.sendMessage(request.message);
            const response = result.response;
            const text =
                response.candidates?.[0]?.content?.parts
                    ?.map((p: any) => p.text || '')
                    .join('')
                    .trim() || '';

            const usage = response.usageMetadata;

            return {
                message: text,
                usage: {
                    promptTokens: usage?.promptTokenCount || 0,
                    completionTokens: usage?.candidatesTokenCount || 0,
                    totalTokens: usage?.totalTokenCount || 0,
                },
            };
        });
    }

    /**
     * Streaming chat — returns ReadableStream for SSE
     */
    async chatStream(request: ChatRequest): Promise<ReadableStream> {
        if (!request.message?.trim()) {
            throw new VertexAIWebError('Message cannot be empty', 400, false);
        }

        let systemInstruction = request.systemInstruction || '';
        if (request.context && Object.keys(request.context).length > 0) {
            systemInstruction += `\n\nContext: ${JSON.stringify(request.context)}`;
        }

        const chat = this.model.startChat({
            history: (request.history || []).map((msg: ChatMessage) => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }],
            })),
            systemInstruction: systemInstruction || undefined,
        });

        const streamResult = await chat.sendMessageStream(request.message);
        const encoder = new TextEncoder();

        return new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of streamResult.stream) {
                        const text =
                            chunk.candidates?.[0]?.content?.parts
                                ?.map((p: any) => p.text || '')
                                .join('') || '';

                        if (text) {
                            const data = JSON.stringify({ type: 'chunk', content: text });
                            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                        }
                    }

                    // Send done signal
                    const doneData = JSON.stringify({ type: 'done' });
                    controller.enqueue(encoder.encode(`data: ${doneData}\n\n`));
                    controller.close();
                } catch (error) {
                    const errorData = JSON.stringify({
                        type: 'error',
                        message:
                            error instanceof Error ? error.message : 'Unknown error',
                    });
                    controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
                    controller.close();
                }
            },
        });
    }

    /**
     * Analyze image with Vertex AI Vision
     */
    async analyzeImage(
        imageBase64: string,
        mimeType: string,
        prompt: string
    ): Promise<string> {
        if (!imageBase64 || !prompt) {
            throw new VertexAIWebError(
                'Image and prompt are required',
                400,
                false
            );
        }

        return this.retryWithBackoff(async () => {
            const request = {
                contents: [
                    {
                        role: 'user',
                        parts: [
                            { text: prompt },
                            { inlineData: { mimeType, data: imageBase64 } },
                        ],
                    },
                ],
            };

            const response = await this.model.generateContent(request);
            const responseData = response.response;

            return (
                responseData.candidates?.[0]?.content?.parts
                    ?.map((p: any) => p.text || '')
                    .join('')
                    .trim() || ''
            );
        });
    }

    /**
     * Generate structured JSON response
     */
    async generateStructured<T>(prompt: string, schema: object): Promise<T> {
        if (!prompt || !schema) {
            throw new VertexAIWebError(
                'Prompt and schema are required',
                400,
                false
            );
        }

        const schemaPrompt = `${prompt}

Return the response as a valid JSON object matching this schema:
${JSON.stringify(schema, null, 2)}

Important:
- Return ONLY the JSON object, no markdown code blocks
- Ensure all required fields are present
- Use null for optional missing values`;

        return this.retryWithBackoff(async () => {
            const result = await this.model.generateContent(schemaPrompt);
            const responseData = result.response;
            let text =
                responseData.candidates?.[0]?.content?.parts
                    ?.map((p: any) => p.text || '')
                    .join('')
                    .trim() || '';

            // Strip markdown code blocks
            text = text
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .trim();

            // Extract JSON
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) text = jsonMatch[0];

            return JSON.parse(text) as T;
        });
    }

    /**
     * Retry with exponential backoff
     */
    private async retryWithBackoff<T>(fn: () => Promise<T>): Promise<T> {
        let lastError: Error | null = null;

        for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
            try {
                return await fn();
            } catch (error) {
                lastError =
                    error instanceof Error ? error : new Error(String(error));

                if (error instanceof VertexAIWebError && !error.retryable) {
                    throw error;
                }

                if (attempt < this.MAX_RETRIES - 1) {
                    const delay = this.BASE_RETRY_DELAY * Math.pow(2, attempt);
                    await new Promise((resolve) => setTimeout(resolve, delay));
                }
            }
        }

        throw new VertexAIWebError(
            `Failed after ${this.MAX_RETRIES} attempts: ${lastError?.message}`,
            500,
            false
        );
    }
}

// ─── Singleton ─────────────────────────────────────────────

let instance: VertexAIWebService | null = null;

export function getVertexAIService(): VertexAIWebService {
    if (!instance) {
        instance = new VertexAIWebService();
    }
    return instance;
}
