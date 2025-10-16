import React from 'react';
import './CircularLoader.css';

interface CircularLoaderProps {
  progress: number; // 0-100
}

export const CircularLoader: React.FC<CircularLoaderProps> = ({ progress }) => {
  const radius = 45;
  const strokeWidth = 10;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <svg
      height={radius * 2}
      width={radius * 2}
      className="circular-loader"
    >
      {/* Tło koła */}
      <circle
        stroke="#e0e0e0"
        fill="transparent"
        strokeWidth={strokeWidth}
        r={normalizedRadius}
        cx={radius}
        cy={radius}
      />
      
      {/* Progress koło */}
      <circle
        stroke="#3b82f6"
        fill="transparent"
        strokeWidth={strokeWidth}
        strokeDasharray={`${circumference} ${circumference}`}
        style={{ strokeDashoffset }}
        strokeLinecap="round"
        r={normalizedRadius}
        cx={radius}
        cy={radius}
        className="progress-circle"
      />
    </svg>
  );
};


.circular-loader {
  transform: rotate(-90deg);
}

.progress-circle {
  transition: stroke-dashoffset 0.5s ease-in-out;
}


import { CircularLoader } from './CircularLoader';

function App() {
  const [progress, setProgress] = React.useState(0);

  return (
    <div>
      <CircularLoader progress={progress} />
      <button onClick={() => setProgress(Math.min(progress + 10, 100))}>
        +10%
      </button>
    </div>
  );
}
