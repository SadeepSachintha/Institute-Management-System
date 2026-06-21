export default function ApplicationLogo(props) {
    return (
        <svg
            {...props}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Background glowing circle */}
            <circle cx="50" cy="50" r="45" fill="url(#logo-grad)" opacity="0.12" />
            
            {/* Outer Shield Border */}
            <path
                d="M50 10 L82 22 V54 C82 72 68 84 50 90 C32 84 18 72 18 54 V22 Z"
                stroke="url(#logo-stroke)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
            />

            {/* Inner Shield Line */}
            <path
                d="M50 16 L76 26 V52 C76 67 65 77 50 82 C35 77 24 67 24 52 V26 Z"
                stroke="url(#logo-accent)"
                strokeWidth="1.5"
                strokeOpacity="0.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="3 3"
            />
            
            {/* Inner Graduation Cap */}
            <path
                d="M50 24 L72 32 L50 40 L28 32 Z"
                fill="url(#logo-stroke)"
            />
            <path
                d="M38 36.5 V44 C38 48 43 51 50 51 C57 51 62 48 62 44 V36.5"
                stroke="url(#logo-stroke)"
                strokeWidth="2.5"
                strokeLinecap="round"
            />
            <path
                d="M72 32 V43 L75 45 V34"
                stroke="url(#logo-accent)"
                strokeWidth="1.5"
                strokeLinecap="round"
            />

            {/* Stylized Open Book at the bottom */}
            <path
                d="M50 72 C43 70 34 71 30 74 V61 C34 58 43 57 50 59"
                stroke="url(#logo-stroke)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M50 72 C57 70 66 71 70 74 V61 C66 58 57 57 50 59"
                stroke="url(#logo-stroke)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <line
                x1="50" y1="59" x2="50" y2="72"
                stroke="url(#logo-stroke)"
                strokeWidth="3"
                strokeLinecap="round"
            />

            {/* Neural Network Nodes and Connections */}
            {/* Left Node */}
            <circle cx="32" cy="51" r="2.5" fill="url(#logo-accent)" />
            {/* Right Node */}
            <circle cx="68" cy="51" r="2.5" fill="url(#logo-accent)" />
            {/* Center Node */}
            <circle cx="50" cy="53" r="2.5" fill="url(#logo-accent)" />
            
            {/* Connection lines */}
            <line x1="32" y1="51" x2="50" y2="53" stroke="url(#logo-accent)" strokeWidth="1" strokeOpacity="0.6" strokeDasharray="2 2" />
            <line x1="68" y1="51" x2="50" y2="53" stroke="url(#logo-accent)" strokeWidth="1" strokeOpacity="0.6" strokeDasharray="2 2" />
            <line x1="50" y1="53" x2="50" y2="59" stroke="url(#logo-accent)" strokeWidth="1" strokeOpacity="0.6" strokeDasharray="2 2" />
            <line x1="32" y1="51" x2="38" y2="44" stroke="url(#logo-accent)" strokeWidth="1" strokeOpacity="0.6" strokeDasharray="2 2" />
            <line x1="68" y1="51" x2="62" y2="44" stroke="url(#logo-accent)" strokeWidth="1" strokeOpacity="0.6" strokeDasharray="2 2" />

            {/* Gradients definitions */}
            <defs>
                <linearGradient id="logo-grad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#0ea5e9" />
                </linearGradient>
                <linearGradient id="logo-stroke" x1="20" y1="10" x2="80" y2="90" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#818cf8" />
                    <stop offset="50%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#38bdf8" />
                </linearGradient>
                <linearGradient id="logo-accent" x1="20" y1="10" x2="80" y2="90" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#f43f5e" />
                    <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
            </defs>
        </svg>
    );
}
