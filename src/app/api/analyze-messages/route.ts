import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
    try {
        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json(
                { error: 'GEMINI_API_KEY not configured' },
                { status: 500 }
            );
        }

        const { messages } = await request.json();

        if (!messages || messages.length === 0) {
            return NextResponse.json(
                { error: 'No messages provided' },
                { status: 400 }
            );
        }

        // Generate context and end goal
        const contextModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const contextPrompt = `Based on these chat messages:
    ${JSON.stringify(messages)}
    
    Generate:
    1. The main context/topic of the conversation
    2. The apparent end goal or purpose
    3. Key points or important details
    4. Emotional tone or sentiment
    5. Any action items or next steps
    
    Format the response as a JSON object with the following keys:
    - "topic": The main context/topic of the conversation.
    - "goal": The apparent end goal or purpose.
    - "keyPoints": Key points or important details.
    - "sentiment": Emotional tone or sentiment.
    - "actionItems": Any action items or next steps.
    - "style": The style of the conversation for the user. Make this such that it can be used as a system prompt for a chatbot. This should include the tone, language and specific style of how user speaks
    
    Provide the response strictly as a JSON object adhering to this format.`;

        const contextResult = await contextModel.generateContent(contextPrompt);
        const contextResponse = await contextResult.response;
        let context = contextResponse.text();
        if (context.includes('```json')) {
            context = context.replace('```json', '').replace('```', '');
        }
        context = JSON.parse(context);
        console.log(context);
        return NextResponse.json({
            messages: messages,
            context
        });
    } catch (error) {
        console.error('Error processing chat analysis:', error);
        return NextResponse.json(
            { error: 'Failed to process chat analysis' },
            { status: 500 }
        );
    }
} 