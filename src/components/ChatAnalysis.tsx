'use client';

interface ChatAnalysisProps {
    result: {
        messages: Array<{
            text: string;
            sender: string;
            timestamp?: string;
        }>;
        context: Record<string, string>;
    };
}

export const ChatAnalysis: React.FC<ChatAnalysisProps> = ({ result }) => {
    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <h2 className="text-lg text-gray-800 font-semibold mb-3">Past Messages</h2>
                <div className="space-y-3">
                    {result.messages.map((message, index) => (
                        <div
                            key={index}
                            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'
                                }`}
                        >
                            <div
                                className={`max-w-[70%] rounded-2xl px-4 py-2 ${message.sender === 'user'
                                    ? 'bg-blue-500 text-white rounded-br-none'
                                    : 'bg-gray-200 text-gray-800 rounded-bl-none'
                                    }`}
                            >
                                <p className="text-sm">{message.text}</p>
                                {message.timestamp && (
                                    <span
                                        className={`text-xs mt-1 block ${message.sender === 'user'
                                            ? 'text-blue-100'
                                            : 'text-gray-500'
                                            }`}
                                    >
                                        {message.timestamp}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            {/* comment out below code. Showing just for reference. Send data from here as the context to server. Send the chat style which has "style" key in the settings part of request*/}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h2 className="text-lg font-semibold mb-3">Context Analysis</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {result.context && Object.entries(result.context).map(([key, value]) => (
                        <div key={key} className="bg-white p-3 rounded-md shadow-sm">
                            <span className="text-sm font-medium text-gray-600">{key}:</span>
                            <p className="text-gray-800 mt-1">{value}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}; 