/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import DotGrid from './DotGrid';

interface AnalysisPanelProps {
    goal: string;
    isLoading: boolean;
    context: any;
    activeMessage: any;
    simulationStats: any;
    settings: any;
    setSettings: any;
}

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ goal, isLoading, context, activeMessage, simulationStats, settings, setSettings }) => {
    return (
        <div className="flex flex-col min-h-full bg-[#f3f5f7] shadow-sm p-10 space-y-8">
            <div className="flex items-start justify-between">
                <div>
                    <img src="https://i.pinimg.com/originals/4b/16/83/4b1683db9806d6e4d853a3f350b6b273.jpg" className="w-16 rounded-lg" alt="pfp" />
                    <h1 className="text-2xl font-bold text-gray-800 mt-2">Conversation Predictor</h1>
                    <span className="text-sm text-gray-500">v0.1</span>
                </div>
                <div className="flex items-center gap-2 bg-green-200 px-3 py-1 rounded-full border border-white">
                    <span className="block w-2.5 h-2.5 rounded-full bg-green-600 shadow-xl"></span>
                    <span className="text-base text-gray-700">Connected</span>
                </div>
            </div>

            <div className="flex items-center justify-between text-base text-gray-700 pb-4">

                {simulationStats && (
                    <div className="flex gap-6">
                        <span>Simulations: {simulationStats.totalSimulations}</span>
                        <span>Avg Score: {(simulationStats.averageScore * 100).toFixed(1)}%</span>
                        <span>Best: {(simulationStats.bestScore * 100).toFixed(1)}%</span>
                    </div>
                )}
            </div>

            <div className="space-y-3">
                <div className="flex items-center space-x-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <h2 className="text-lg font-semibold text-gray-800">CONVERSATION GOAL</h2>
                </div>
                <div className="bg-blue-500 rounded-lg p-5">
                    <p className="text-base text-slate-100 leading-relaxed">{goal}</p>
                </div>
            </div>

            <div className="space-y-3 flex-1 overflow-auto">
                <div className="flex items-center space-x-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <h2 className="text-lg font-semibold text-gray-800">ANALYSIS RESULTS</h2>
                </div>
                {isLoading ? (
                    <div className="text-base text-gray-600 animate-pulse">Analyzing conversation patterns...</div>
                ) : context ? (
                    <div className="space-y-6">
                        <div className="bg-gray-50 rounded-lg p-5">
                            <h3 className="text-base font-semibold text-gray-800 mb-3">Topic</h3>
                            <p className="text-base text-gray-700 leading-relaxed">{context.topic}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-5">
                            <h3 className="text-base font-semibold text-gray-800 mb-3">Key Points</h3>
                            <ul className="space-y-2">
                                {context.keyPoints.map((point: string, i: number) => (
                                    <li key={i} className="flex items-start gap-3 text-base text-gray-700">
                                        <span className="text-blue-600 mt-1">•</span>
                                        <span className="leading-relaxed">{point}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-5">
                            <h3 className="text-base font-semibold text-gray-800 mb-3">Sentiment & Style</h3>
                            <div className="space-y-3">
                                <p className="text-base text-gray-700">
                                    <span className="font-semibold">Sentiment:</span> {context.sentiment}
                                </p>
                                <p className="text-base text-gray-700">
                                    <span className="font-semibold">Style:</span> {context.style}
                                </p>
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>

            {/* Conversation Settings */}
            <div className="border-t pt-6 mb-8">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">MCTS Parameters</h3>
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-base font-medium text-gray-800 mb-2">
                            Conversation Style
                        </label>
                        <select
                            value={settings.tone}
                            onChange={(e) => setSettings(prev => ({ ...prev, tone: e.target.value }))}
                            className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                        >
                            <option value="friendly">Friendly & Casual</option>
                            <option value="professional">Professional & Formal</option>
                            <option value="flirty">Flirty & Playful</option>
                            <option value="humorous">Humorous & Light</option>
                            <option value="empathetic">Empathetic & Understanding</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-base font-medium text-gray-800 mb-2">
                            Personality Traits
                        </label>
                        <input
                            type="text"
                            value={settings.style}
                            onChange={(e) => setSettings(prev => ({ ...prev, style: e.target.value }))}
                            placeholder="e.g., witty, confident, genuine"
                            className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                        />
                    </div>

                    <div>
                        <label className="block text-base font-medium text-gray-800 mb-2">
                            Simulation Depth
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                type="range"
                                min="50"
                                max="200"
                                step="10"
                                value={settings.maxIterations}
                                onChange={(e) => setSettings(prev => ({ ...prev, maxIterations: parseInt(e.target.value) }))}
                                className="flex-1"
                            />
                            <span className="text-sm text-gray-600 w-12">{settings.maxIterations}</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-base font-medium text-gray-800 mb-2">
                            Response Options
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                type="range"
                                min="1"
                                max="5"
                                value={settings.maxChildren}
                                onChange={(e) => setSettings(prev => ({ ...prev, maxChildren: parseInt(e.target.value) }))}
                                className="flex-1"
                            />
                            <span className="text-sm text-gray-600 w-8">{settings.maxChildren}</span>
                        </div>
                    </div>
                </div>
            </div>

            {activeMessage && (
                <div className="space-y-3 border-t pt-6">
                    <div className="flex items-center space-x-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h2 className="text-lg font-semibold text-gray-800">MESSAGE ANALYSIS</h2>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-5">
                        <p className="text-base text-gray-800 mb-3 leading-relaxed">{activeMessage.content}</p>
                        {activeMessage.explanation && (
                            <div className="text-base text-gray-600">
                                <p className="leading-relaxed">{activeMessage.explanation}</p>
                                {activeMessage.confidence && (
                                    <div className="mt-4 flex items-center gap-3">
                                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-500 ${activeMessage.confidence > 80 ? 'bg-green-600' :
                                                    activeMessage.confidence > 60 ? 'bg-yellow-600' :
                                                        'bg-red-600'
                                                    }`}
                                                style={{ width: `${activeMessage.confidence}%` }}
                                            />
                                        </div>
                                        <span className="font-semibold text-gray-800">{activeMessage.confidence.toFixed(1)}%</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="space-y-6 border-t pt-6">
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                            </svg>
                            <h2 className="text-lg font-semibold text-gray-800">CONVERSATION EXPLORATION</h2>
                        </div>
                        {simulationStats && (
                            <span className="text-base text-gray-600">
                                {simulationStats.totalSimulations} paths explored
                            </span>
                        )}
                    </div>
                    <div className="bg-white p-5 rounded-lg">
                        <DotGrid
                            color="bg-blue-600"
                            rows={8}
                            cols={24}
                            isLoading={isLoading}
                            progress={simulationStats?.totalSimulations}
                        />
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            <h2 className="text-lg font-semibold text-gray-800">MONTE CARLO EVALUATION</h2>
                        </div>
                        {simulationStats && (
                            <span className="text-base text-gray-600">
                                Best score: {(simulationStats.bestScore * 100).toFixed(1)}%
                            </span>
                        )}
                    </div>
                    <div className="bg-white p-5 rounded-lg">
                        <DotGrid
                            color="bg-blue-600"
                            rows={8}
                            cols={24}
                            isLoading={isLoading}
                            progress={simulationStats?.totalSimulations}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalysisPanel;
