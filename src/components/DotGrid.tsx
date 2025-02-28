/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState } from 'react';

interface DotGridProps {
    color: string;
    rows: number;
    cols: number;
    isLoading?: boolean;
    progress?: number;
}

const DotGrid: React.FC<DotGridProps> = ({ color, rows, cols, isLoading, progress = 0 }) => {
    const [activeDots, setActiveDots] = useState<number[]>([]);
    const totalDots = rows * cols;

    useEffect(() => {
        if (!isLoading) {
            setActiveDots(Array.from({ length: totalDots }, (_, i) => i));
            return;
        }

        // Reset animation
        setActiveDots([]);

        // Create wave effect
        let currentDot = 0;
        const interval = setInterval(() => {
            if (currentDot >= totalDots) {
                currentDot = 0;
                setActiveDots([]);
            }

            setActiveDots(prev => {
                // Keep only the last 30 dots active to create a wave effect
                const newDots = [...prev, currentDot].slice(-30);
                return newDots;
            });
            currentDot++;
        }, 20); // Adjust speed of animation

        return () => clearInterval(interval);
    }, [isLoading, totalDots]);

    return (
        <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}> {/* Increased gap */}
            {Array.from({ length: totalDots }).map((_, i) => (
                <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        activeDots.includes(i) ? color : 'bg-gray-200'
                    }`} /* Increased size and transition duration */
                    style={{
                        transform: activeDots.includes(i) ? 'scale(1.1)' : 'scale(0.8)', /* Adjusted scale for better visibility */
                        opacity: activeDots.includes(i) ? '1' : '0.4', /* Increased inactive opacity */
                        transition: 'transform 0.3s ease-out, opacity 0.3s ease-out'
                    }}
                />
            ))}
        </div>
    );
};

export default DotGrid; 