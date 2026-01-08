import React from 'react';

interface LanternProps {
    type: 'fu' | 'chun';
    className?: string;
    delay?: boolean;
}

export const Lantern: React.FC<LanternProps> = ({ type, className = '', delay = false }) => {
    const animationClass = delay ? 'animate-sway-delayed' : 'animate-sway';
    
    if (type === 'fu') {
        return (
            <div className={`lantern-container pointer-events-none ${animationClass} ${className}`}>
                <svg fill="none" height="180" viewBox="0 0 80 160" width="100" xmlns="http://www.w3.org/2000/svg">
                    <line stroke="#5c3a3a" strokeWidth="2" x1="40" x2="40" y1="0" y2="30"></line>
                    <path d="M10 40 C10 25, 70 25, 70 40 L70 110 C70 125, 10 125, 10 110 Z" fill="#d92828" filter="drop-shadow(0 4px 6px rgba(217, 40, 40, 0.3))" stroke="#991b1b" strokeWidth="2"></path>
                    <path d="M10 40 L70 40" stroke="#D4AF37" strokeWidth="4"></path>
                    <path d="M10 110 L70 110" stroke="#D4AF37" strokeWidth="4"></path>
                    <path d="M40 110 L40 125" stroke="#991b1b" strokeWidth="2"></path>
                    <path d="M40 125 L32 155 M40 125 L40 160 M40 125 L48 155" stroke="#D4AF37" strokeWidth="2"></path>
                    <circle cx="40" cy="75" fill="#b91c1c" r="18" stroke="#D4AF37" strokeWidth="1.5"></circle>
                    <text fill="#D4AF37" fontFamily="Noto Sans SC" fontSize="18" fontWeight="900" textAnchor="middle" x="40" y="81">福</text>
                </svg>
            </div>
        );
    }

    return (
        <div className={`lantern-container pointer-events-none ${animationClass} ${className}`}>
            <svg fill="none" height="150" viewBox="0 0 80 160" width="80" xmlns="http://www.w3.org/2000/svg">
                <line stroke="#5c3a3a" strokeWidth="2" x1="40" x2="40" y1="0" y2="30"></line>
                <path d="M15 40 C15 25, 65 25, 65 40 L65 100 C65 115, 15 115, 15 100 Z" fill="#d92828" filter="drop-shadow(0 4px 6px rgba(217, 40, 40, 0.3))" stroke="#991b1b" strokeWidth="2"></path>
                <path d="M15 40 L65 40" stroke="#D4AF37" strokeWidth="3"></path>
                <path d="M15 100 L65 100" stroke="#D4AF37" strokeWidth="3"></path>
                <path d="M40 100 L40 115" stroke="#991b1b" strokeWidth="2"></path>
                <path d="M40 115 L35 145 M40 115 L40 150 M40 115 L45 145" stroke="#D4AF37" strokeWidth="2"></path>
                <circle cx="40" cy="70" fill="#b91c1c" r="14" stroke="#D4AF37" strokeWidth="1.5"></circle>
                <text fill="#D4AF37" fontFamily="Noto Sans SC" fontSize="14" fontWeight="900" textAnchor="middle" x="40" y="75">春</text>
            </svg>
        </div>
    );
};
