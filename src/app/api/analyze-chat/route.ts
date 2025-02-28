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

        const formData = await request.formData();
        const files = formData.getAll('files') as File[];

        if (!files || files.length === 0) {
            return NextResponse.json(
                { error: 'No files provided' },
                { status: 400 }
            );
        }

        // Process each image with Gemini Vision
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const processedResults = await Promise.all(
            files.map(async (file) => {
                const arrayBuffer = await file.arrayBuffer();
                const base64String = Buffer.from(arrayBuffer).toString('base64');
                const mimeType = file.type;

                // First request: Extract text and structure from image
                const result = await model.generateContent([
                    {
                        inlineData: {
                            data: base64String,
                            mimeType
                        }
                    },
                    `Extract the text messages from this chat screenshot. For each message, identify:
           1. The message text
           2. Who sent it (user or other)
           3. Any visible timestamp
           
           Format the response as a JSON array of messages, each with 'text', 'sender', and 'timestamp' fields. Messages on right are from user and on left from assistant.
           
           Example Output:
           [
             {
               "text": "Hey, how's it going?",
               "sender": "user",
               "timestamp": "10:30 AM"
             },
             {
               "text": "I'm doing great! Just finished a workout.",
               "sender": "assistant",
               "timestamp": "10:32 AM"
             }
           ]
           
           Strictly adhere to the above JSON schema for each message object in the array.  Ensure that the "sender" field is either "user" or "other". If a timestamp is not visible, set the "timestamp" field to null. Directly return the JSON array without any additional text or formatting.`
                ]);
                let response = result.response.text();
                if (response.includes('```json')) {
                    response = response.replace('```json', '').replace('```', '');
                }
                console.log(response);
                const messages = JSON.parse(response);

                return messages;
            })
        );

        // Combine all messages
        const allMessages = processedResults.flat();

        //     // Second request: Generate context and end goal
        //     const contextModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        //     const contextPrompt = `Based on these chat messages:
        // ${JSON.stringify(allMessages)}

        // Generate:
        // 1. The main context/topic of the conversation
        // 2. The apparent end goal or purpose
        // 3. Key points or important details
        // 4. Emotional tone or sentiment
        // 5. Any action items or next steps

        // Format the response as a JSON object with the following keys:
        // - "topic": The main context/topic of the conversation.
        // - "goal": The apparent end goal or purpose.
        // - "keyPoints": Key points or important details.
        // - "sentiment": Emotional tone or sentiment.
        // - "actionItems": Any action items or next steps.
        // - "style": The style of the conversation for the user. Make this such that it can be used as a system prompt for a chatbot. This should include the tone, language and specific style of how user speaks

        // Provide the response strictly as a JSON object adhering to this format.`;

        //     const contextResult = await contextModel.generateContent(contextPrompt);
        //     const contextResponse = await contextResult.response;
        //     let context = contextResponse.text();
        //     if (context.includes('```json')) {
        //         context = context.replace('```json', '').replace('```', '');
        //     }
        //     context = JSON.parse(context);

        return NextResponse.json({
            messages: allMessages,
            // context
        });
    } catch (error) {
        console.error('Error processing chat analysis:', error);
        return NextResponse.json(
            { error: 'Failed to process chat analysis' },
            { status: 500 }
        );
    }
} 