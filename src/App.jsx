import React, { useState, useEffect, useCallback } from 'react';
import ProgressBar from './components/ProgressBar';
import GlitchMessage from './components/GlitchMessage';
import SpiderManGame from './components/SpiderManGame';
import './App.css';

function App() {
  const [progress, setProgress] = useState(0);
  const [score, setScore] = useState(0);
  const [isGlitching, setIsGlitching] = useState(false);

  useEffect(() => {
    const totalTime = 60000;
    const intervalTime = 50; 
    
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + (100 / (totalTime / intervalTime)); 
      });
    }, intervalTime);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`app-container`}>
      {/* Halftone overlay on top of the 2D scene but below some UI */}
      <div className="halftone-overlay"></div>
      
      <div className="content-wrapper">
        <div className="comic-panel header-panel">
          <h1>Spider-Verse Sync</h1>
          <div className="score-display">Distance: {Math.floor(score)}m</div>
        </div>

        <div className="main-display">
          {progress < 100 ? (
            <GlitchMessage progress={progress} />
          ) : (
            <div className="glitch-wrapper" data-text="SYNC COMPLETE">
              SYNC COMPLETE
            </div>
          )}
        </div>

        <ProgressBar progress={progress} />
      </div>

      {progress < 100 && (
        <SpiderManGame setScore={setScore} />
      )}
    </div>
  );
}

export default App;
