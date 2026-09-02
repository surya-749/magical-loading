import React, { useState, useEffect } from 'react';
import HalftoneBackground from './components/HalftoneBackground';
import ProgressBar from './components/ProgressBar';
import GlitchMessage from './components/GlitchMessage';
import MiniGame from './components/MiniGame';
import './App.css';

function App() {
  const [progress, setProgress] = useState(0);
  const [score, setScore] = useState(0);

  useEffect(() => {
    // Exactly 60 seconds = 60000ms
    const totalTime = 60000;
    const intervalTime = 50; // Update every 50ms for smooth visual
    
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
    <div className="app-container">
      <HalftoneBackground />
      
      <div className="content-wrapper">
        <div className="comic-panel header-panel">
          <h1>Multiverse Sync</h1>
          <div className="score-display">Score: {score}</div>
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

      {progress < 100 && <MiniGame setScore={setScore} />}
    </div>
  );
}

export default App;
