/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState } from 'react';
import ChatDisplay from '@/components/ChatDisplay';
import AnalysisPanel from '@/components/AnalysisPanel';

interface Message {
    role: 'user' | 'other';
    content: string;
    timestamp?: string;
    explanation?: string;
    confidence?: number;
}

interface APIMessage {
    text: string;
    sender: string;
    timestamp?: string;
}

interface AnalysisContext {
    topic: string;
    goal: string;
    keyPoints: string[];
    sentiment: string;
    actionItems: string[];
    style: string;
}

interface PredictedMessage {
    role: 'user' | 'other';
    content: string;
    explanation?: string;
}

interface PredictionResponse {
    predictedMessages: PredictedMessage[];
    topic: string;
    keyPoints: string[];
    sentiment: string;
    strategies: string[];
    style: string;
}

interface ConversationSettings {
    style: string;
    tone: string;
    maxIterations: number;
    maxChildren: number;
}

interface MCTSMessage {
    role: 'user' | 'other';
    content: string;
    explanation: string;
}

interface SimulationStats {
    totalSimulations: number;
    averageScore: number;
    bestScore: number;
}

export default function Home() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [context, setContext] = useState<AnalysisContext | undefined>();
    const [goal, setGoal] = useState<string>('');
    const [inputMessage, setInputMessage] = useState('');
    const [goalInput, setGoalInput] = useState('');
    const [isSetup, setIsSetup] = useState(true);
    const [predictedMessages, setPredictedMessages] = useState<Message[]>([]);
    const [showPredictions, setShowPredictions] = useState(false);
    const [settings, setSettings] = useState<ConversationSettings>({
        style: '',
        tone: 'friendly',
        maxIterations: 100,
        maxChildren: 3
    });
    const [error, setError] = useState<string | null>(null);
    const [simulationStats, setSimulationStats] = useState<SimulationStats | null>(null);
    const [activeMessage, setActiveMessage] = useState<Message | null>(null);

    const handleSetGoal = async () => {
        if (!goalInput.trim()) return;
        setGoal(goalInput);
        setIsLoading(true);
        setError(null);

        try {
            // Get initial prediction using MCTS
            const response = await fetch('/api/analyze-goal', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    goal: goalInput,
                    settings: {
                        style: settings.style,
                        tone: settings.tone,
                        maxIterations: settings.maxIterations,
                        maxChildren: settings.maxChildren
                    }
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to analyze goal');
            }

            const data = await response.json();

            if (data.warning) {
                setError(data.warning);
            }

            if (data.predictedMessages?.length > 0) {
                // Transform MCTS predictions into messages
                const transformedMessages = data.predictedMessages.map((msg: MCTSMessage) => ({
                    role: msg.role,
                    content: msg.content,
                    explanation: msg.explanation,
                    confidence: parseFloat(msg.explanation.match(/\d+\.\d+/)?.[0] || '0'),
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }));

                setPredictedMessages(transformedMessages);
                setShowPredictions(true);
            }

            setContext({
                topic: data.topic,
                goal: goalInput,
                keyPoints: data.keyPoints,
                sentiment: data.sentiment,
                actionItems: data.strategies,
                style: data.style
            });

            // Update settings based on analysis
            setSettings(prev => ({
                ...prev,
                style: data.style || prev.style
            }));

        } catch (error) {
            console.error('Error getting prediction:', error);
            setError('Failed to generate predictions. Please try again.');
        } finally {
            setIsLoading(false);
            setIsSetup(false);
        }
    };

    const handleSendMessage = () => {
        if (!inputMessage.trim()) return;

        const newMessage: Message = {
            role: 'user',
            content: inputMessage,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        const updatedMessages = [...messages, newMessage];
        setMessages(updatedMessages);
        setInputMessage('');
        analyzeMessages(updatedMessages);
    };

    const analyzeMessages = async (msgs: Message[]) => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/analyze-messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ messages: msgs }),
            });

            if (!response.ok) {
                throw new Error('Failed to analyze messages');
            }

            const data = await response.json();
            setContext(data.context);
        } catch (error) {
            console.error('Error analyzing messages:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileUpload = async (file: File) => {
        setIsLoading(true);
        const formData = new FormData();
        formData.append('files', file);

        try {
            // First analyze the chat screenshot
            const response = await fetch('/api/analyze-chat', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Failed to analyze chat');
            }

            const data = await response.json();

            const transformedMessages = data.messages.map((msg: APIMessage) => ({
                role: msg.sender === 'user' ? 'user' : 'other',
                content: msg.text,
                timestamp: msg.timestamp,
            }));

            setMessages(transformedMessages);

            // Then analyze the messages for context
            const analysisResponse = await fetch('/api/analyze-messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ messages: transformedMessages }),
            });

            if (!analysisResponse.ok) {
                throw new Error('Failed to analyze messages');
            }

            const analysisData = await analysisResponse.json();
            setContext(analysisData.context);

            // If we're in setup mode and have a goal, get predictions
            if (isSetup && goalInput.trim()) {
                await handleSetGoal();
            }

            // If we were in setup, exit it
            if (isSetup) {
                setIsSetup(false);
            }
        } catch (error) {
            console.error('Error processing chat:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="flex min-h-screen bg-gray-100">
            <div className="flex w-full shadow-lg mx-auto">
                <div className="w-2/3 overflow-y-auto">
                    {isSetup ? (
                        <div className="flex flex-col min-h-full bg-white p-10">
                            <h2 className="text-3xl font-bold mb-6 text-gray-800">Conversation Simulator</h2>
                            <p className="text-lg text-gray-700 mb-8">Set up your conversation parameters and goals to generate optimal responses using Monte Carlo Tree Search.</p>

                            {/* Goal Input */}
                            <div className="mb-8">
                                <label className="block text-base font-semibold text-gray-800 mb-3">
                                    Conversation Goal
                                </label>
                                <textarea
                                    value={goalInput}
                                    onChange={(e) => setGoalInput(e.target.value)}
                                    placeholder="Type your goal..."
                                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 h-32 resize-none text-base"
                                />
                            </div>



                            {/* Action Buttons */}
                            <div className="flex gap-4 mb-6">
                                <button
                                    onClick={handleSetGoal}
                                    disabled={isLoading || !goalInput.trim()}
                                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${isLoading || !goalInput.trim()
                                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                            : 'bg-blue-500 text-white hover:bg-blue-600'
                                        }`}
                                >
                                    {isLoading ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                                            <span>Simulating...</span>
                                        </div>
                                    ) : (
                                        'Run MCTS Simulation'
                                    )}
                                </button>
                            </div>

                            {/* Upload Section */}
                            <div className="border-t pt-6">
                                <h3 className="text-lg font-medium mb-4">Existing Conversation</h3>
                                <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleFileUpload(file);
                                        }}
                                        className="hidden"
                                        id="setup-file-upload"
                                    />
                                    <label
                                        htmlFor="setup-file-upload"
                                        className="flex flex-col items-center gap-2 cursor-pointer"
                                    >
                                        <div className="p-3 rounded-full bg-blue-100 text-blue-500">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="font-medium text-blue-500">Upload Chat Screenshot</p>
                                            <p className="text-sm text-gray-500">Drag & drop or click to select</p>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {error && (
                                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                                    <div className="flex items-center gap-2 text-red-600 font-medium">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                        <span>{error}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col min-h-screen w-2/3 fixed bg-white shadow-lg">
                            {/* Chat Header */}
                            <div className="flex items-center p-6 border-b">
                                <button
                                    className="text-blue-600 mr-4 hover:bg-blue-50 p-2 rounded-full transition-colors"
                                    onClick={() => setIsSetup(true)}
                                    title="Back to Setup"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                <div className="flex-1">
                                    <h2 className="text-2xl font-semibold text-center text-gray-800">Conversation</h2>
                                    {showPredictions && (
                                        <p className="text-base text-gray-600 text-center mt-1">
                                            Showing top {settings.maxChildren} responses from {settings.maxIterations} simulations
                                        </p>
                                    )}
                                </div>
                                <button
                                    className="text-blue-500"
                                    onClick={() => setShowPredictions(!showPredictions)}
                                    title={showPredictions ? "Show actual chat" : "Show predictions"}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                </button>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {(showPredictions ? predictedMessages : messages).map((message, index) => (
                                    <div
                                        key={index}
                                        className={`space-y-3 ${message === activeMessage ? 'scale-105 transition-transform' : ''}`}
                                        onClick={() => setActiveMessage(message)}
                                    >
                                        <div
                                            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-[70%] rounded-lg px-5 py-3 shadow-sm hover:shadow transition-shadow ${message.role === 'user'
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-gray-100 text-gray-900'
                                                    }`}
                                            >
                                                <p className="text-base whitespace-pre-wrap leading-relaxed">{message.content}</p>
                                                {message.timestamp && (
                                                    <span className="text-sm opacity-85 mt-2 block">
                                                        {message.timestamp}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {showPredictions && message.explanation && (
                                            <div className="px-5">
                                                <div className="text-sm text-gray-700 flex items-center gap-3">
                                                    <div className="flex-1">{message.explanation}</div>
                                                    {message.confidence && (
                                                        <div className="flex items-center gap-2">
                                                            <div
                                                                className={`h-2 w-20 rounded-full overflow-hidden bg-gray-200`}
                                                            >
                                                                <div
                                                                    className={`h-full transition-all duration-500 ${message.confidence > 80 ? 'bg-green-600' :
                                                                            message.confidence > 60 ? 'bg-yellow-600' :
                                                                                'bg-red-600'
                                                                        }`}
                                                                    style={{ width: `${message.confidence}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-sm font-semibold">
                                                                {message.confidence.toFixed(1)}%
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Input */}
                            {!showPredictions && (
                                <div className="border-t bg-white p-4">
                                    <div className="flex items-center gap-2">
                                        <label htmlFor="file-upload" className="p-2 text-gray-500 hover:bg-gray-100 rounded-full cursor-pointer transition-colors">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <input
                                                id="file-upload"
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                                                className="hidden"
                                            />
                                        </label>
                                        <div className="flex-1 bg-gray-100 rounded-full px-4 py-2">
                                            <input
                                                type="text"
                                                placeholder="Type a message..."
                                                className="w-full bg-transparent outline-none"
                                                value={inputMessage}
                                                onChange={(e) => setInputMessage(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                            />
                                        </div>
                                        <button
                                            className="p-2 text-blue-500 hover:bg-blue-50 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            onClick={handleSendMessage}
                                            disabled={!inputMessage.trim()}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="w-1/3">
                    <AnalysisPanel
                        goal={goal}
                        isLoading={isLoading}
                        context={context}
                        simulationStats={simulationStats}
                        activeMessage={activeMessage}
                        settings={settings}
                        setSettings={setSettings}
                    />
                </div>
            </div>
        </main>
    );
}
