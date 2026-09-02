import React, { useState, useEffect, useCallback } from 'react';
import SpiderManGame from '../SpiderManGame';
import ProgressBar from '../ProgressBar';
import GlitchMessage from '../GlitchMessage';

const SpiderVerseLoader = ({ onComplete, duration = 60000 }) => {
  const [progress, setProgress] = useState(0);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState('PLAYING'); // 'PLAYING' | 'GAME_OVER'

  // Loading progress timer
  useEffect(() => {
    const intervalTime = 50;
    const increment = 100 / (duration / intervalTime);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        const next = prev + increment;
        if (next >= 100) {
          clearInterval(interval);
          if (onComplete) onComplete();
          return 100;
        }
        return next;
      });
    }, intervalTime);

    return () => clearInterval(interval);
  }, [duration, onComplete]);

  const handleGameOver = useCallback(() => {
    setGameState('GAME_OVER');
  }, []);

  const handleRevive = useCallback(() => {
    setGameState('PLAYING');
  }, []);

  // Keyboard shortcut to revive
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && gameState === 'GAME_OVER') {
        e.preventDefault();
        handleRevive();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, handleRevive]);

  return (
    <>
      <div className="halftone-overlay" />

      {/* Spider-Man Interactive Web Swing Game */}
      <SpiderManGame
        setScore={setScore}
        gameState={gameState}
        onGameOver={handleGameOver}
        onRevive={handleRevive}
      />

      {/* Top HUD: Score / Distance */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          zIndex: 25,
          fontFamily: 'var(--comic-font)',
          fontSize: '1.8rem',
          color: 'white',
          textShadow: '2px 2px 0 var(--neon-cyan), -2px -2px 0 var(--neon-magenta)',
          pointerEvents: 'none'
        }}
      >
        SCORE: {Math.floor(score)}
      </div>

      {/* Bottom Right Loader and Messages */}
      <div className="bottom-right-loader">
        <GlitchMessage progress={progress} />
        <div className="loading-text">SYNCING: {Math.floor(progress)}%</div>
        <ProgressBar progress={progress} />
      </div>

      {/* Game Over Screen */}
      {gameState === 'GAME_OVER' && (
        <div className="overlay-center game-over-ui futuristic-panel">
          <h1 className="glitch-text" data-text="MISSION FAILED">
            MISSION FAILED
          </h1>
          <h2>Distance: {Math.floor(score)}m</h2>
          <div className="retry-hints">
            <button className="play-button" onClick={handleRevive}>
              RETRY
            </button>
            <p className="small-hint">or press SPACE to instantly revive</p>
          </div>
        </div>
      )}
    </>
  );
};

export default SpiderVerseLoader;
