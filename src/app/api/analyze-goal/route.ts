/* eslint-disable @typescript-eslint/no-unused-vars */
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';
import { API_URL, endpoints } from '@/config/api';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Add Response type
interface MCTSResponse extends Response {
    ok: boolean;
    statusText: string;
    json(): Promise<{
        cleaned_messages: [number, string][];
        context?: {
            topic?: string;
            key_points?: string[];
            sentiment?: string;
            strategies?: string[];
            style?: string;
        };
        average_score: number;
        best_score: number;
    }>;
}

// Timeout promise for fetch requests
const timeoutPromise = (timeout: number) => {
    return new Promise((_, reject) => {
        setTimeout(() => {
            reject(new Error(`Request timed out after ${timeout}ms`));
        }, timeout);
    });
};

// Validate environment variables
const validateEnv = () => {
    const requiredEnvVars = {
        'GEMINI_API_KEY': process.env.GEMINI_API_KEY,
        'NEXT_PUBLIC_API_URL': process.env.NEXT_PUBLIC_API_URL
    };

    const missingVars = Object.entries(requiredEnvVars)
        .filter(([_, value]) => !value)
        .map(([key]) => key);

    if (missingVars.length > 0) {
        throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
};

// Retry function with exponential backoff
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<MCTSResponse> {
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response as MCTSResponse;
        } catch (error) {
            lastError = error;
            if (i < maxRetries - 1) {
                // Wait for 2^i * 1000 ms before retrying
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
            }
        }
    }
    throw lastError;
}

export async function POST(request: NextRequest) {
    try {
        validateEnv();

        const { goal, settings } = await request.json();

        if (!goal) {
            return NextResponse.json(
                { error: 'No goal provided' },
                { status: 400 }
            );
        }

        // Call MCTS backend with timeout and retry
        try {
            const mctsPromise = fetchWithRetry(
                `${API_URL}${endpoints.mctsGenerate}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        history: {
                            messages: []  // Start with empty history
                        },
                        end_goal: {
                            description: goal
                        },
                        settings: {
                            initial_turn: "user",
                            style: settings?.style || "",
                            max_iterations: settings?.maxIterations || 100,
                            max_children: settings?.maxChildren || 3,
                            exploration_constant: 1.41,
                            rules: []
                        }
                    })
                }
            );

            // Race between the MCTS request and a timeout
            const mctsResponse = await Promise.race([
                mctsPromise,
                timeoutPromise(30000) // 30 second timeout
            ]) as MCTSResponse;

            if (!mctsResponse.ok) {
                throw new Error(`MCTS backend error: ${mctsResponse.statusText}`);
            }

            const mctsData = await mctsResponse.json();
            
            // Transform MCTS responses into predicted messages
            const predictedMessages = mctsData.cleaned_messages.map(([score, content]: [number, string]) => {
                try {
                    const role = content.includes("user:") ? "user" : "other";
                    const cleanContent = content.replace("user:", "").replace("other:", "").trim();
                    
                    return {
                        role,
                        content: cleanContent,
                        explanation: `Confidence Score: ${(score * 100).toFixed(1)}% - Based on ${settings?.maxIterations || 100} simulations`,
                        confidence: score * 100
                    };
                } catch (error) {
                    console.error('Error transforming message:', error);
                    return null;
                }
            }).filter(Boolean);

            // Get context from the best performing simulation
            const context = {
                topic: mctsData.context?.topic || goal,
                keyPoints: mctsData.context?.key_points || [],
                sentiment: mctsData.context?.sentiment || "neutral",
                strategies: mctsData.context?.strategies || [],
                style: settings?.style || mctsData.context?.style || ""
            };

            return NextResponse.json({
                predictedMessages: predictedMessages.slice(0, settings?.maxChildren || 3),
                ...context,
                simulationStats: {
                    totalSimulations: settings?.maxIterations || 100,
                    averageScore: mctsData.average_score,
                    bestScore: mctsData.best_score
                }
            });

        } catch (error: unknown) {
            console.error('Error in MCTS simulation:', error);
            
            if (error instanceof Error && error.message.includes('timed out')) {
                return NextResponse.json(
                    { 
                        error: 'MCTS simulation timed out. Please try with fewer iterations.',
                        warning: 'Consider reducing simulation depth for faster results.'
                    },
                    { status: 408 }
                );
            }

            return NextResponse.json(
                { 
                    error: 'Failed to simulate conversations',
                    details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
                },
                { status: 500 }
            );
        }
    } catch (error: unknown) {
        console.error('Error in analyze-goal:', error);
        return NextResponse.json(
            { 
                error: 'Failed to analyze goal',
                details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
            },
            { status: 500 }
        );
    }
} 