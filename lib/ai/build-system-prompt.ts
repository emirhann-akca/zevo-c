/**
 * Build modular system prompt
 * Replicates mobile's buildCoachSystemPrompt from vertex-ai.functions.ts
 */

import { getBasePrompt, UserProfile } from './prompts/base';
import { detectContext, ContextUserProfile } from './prompts/contextDetector';
import { NUTRITION_MODULE } from './prompts/nutrition';
import { TRAINING_MODULE } from './prompts/training';
import { SUPPLEMENTS_MODULE } from './prompts/supplements';
import { INJURY_MODULE } from './prompts/injury';
import { SPORT_SPECIFIC_MODULE } from './prompts/sportSpecific';
import { ChatMessage } from './vertex-ai-web.service';

export function buildCoachSystemPrompt(
    userMessage: string,
    userProfile?: UserProfile,
    chatHistory?: ChatMessage[]
): string {
    // Always load base
    let prompt = getBasePrompt(userProfile);

    // Detect context from user message
    const contextProfile: ContextUserProfile = {
        hasInjuries: userProfile?.hasInjuries,
        sportType: userProfile?.sportType,
        injuries: userProfile?.injuries,
    };
    const context = detectContext(userMessage, contextProfile);

    // Load relevant modules based on context
    if (context.needsNutrition) prompt += '\n\n' + NUTRITION_MODULE;
    if (context.needsTraining) prompt += '\n\n' + TRAINING_MODULE;
    if (context.needsSupplements) prompt += '\n\n' + SUPPLEMENTS_MODULE;
    if (context.needsInjury) prompt += '\n\n' + INJURY_MODULE;
    if (context.needsSportSpecific) prompt += '\n\n' + SPORT_SPECIFIC_MODULE;

    // Add chat history (last 5 messages)
    if (chatHistory && chatHistory.length > 0) {
        const recent = chatHistory.slice(-5);
        const historyStr = recent
            .map((msg) => {
                const role = msg.role === 'user' ? 'Kullanıcı' : 'AI Coach';
                return `${role}: ${msg.content}`;
            })
            .join('\n\n');

        prompt += `\n\n════════════════════════════════════════
📋 KONUŞMA GEÇMİŞİ
════════════════════════════════════════

${historyStr}`;
    }

    // Log for debugging (server-side only)
    console.log('🔍 Prompt built:', {
        modules: {
            nutrition: context.needsNutrition,
            training: context.needsTraining,
            supplements: context.needsSupplements,
            injury: context.needsInjury,
            sportSpecific: context.needsSportSpecific,
        },
        confidence: context.confidence.toFixed(2),
        historyMessages: chatHistory?.length || 0,
    });

    return prompt;
}
