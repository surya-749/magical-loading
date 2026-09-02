import React, { useState, useEffect, useCallback, useRef } from 'react';
import ProgressBar from './components/ProgressBar';
import SpiderManGame from './components/SpiderManGame';
import WarpText from './components/WarpText';
import './App.css';

function App() {
  const [progress, setProgress] = useState(0);
  const [score, setScore] = useState(0);
  const [isGlitching, setIsGlitching] = useState(false);
  const [gameState, setGameState] = useState('INTRO'); // INTRO, MENU, PLAYING, GAME_OVER
  const [videoPlaying, setVideoPlaying] = useState(false);
  
  const videoRef = useRef(null);

  // Play video logic
  useEffect(() => {
    if (gameState === 'INTRO' && videoRef.current) {
      const vid = videoRef.current;
      vid.currentTime = 50; // Start at 50s
      vid.muted = true;
      
      const playPromise = vid.play();
      if (playPromise !== undefined) {
        playPromise.catch(e => console.log("Autoplay prevented:", e));
      }

      const handleTimeUpdate = () => {
        if (vid.currentTime >= 50 && !videoPlaying) {
           setVideoPlaying(true);
        }
        if (vid.currentTime >= 55) {
          vid.pause();
          setGameState('MENU');
        }
      };
      
      vid.addEventListener('timeupdate', handleTimeUpdate);
      return () => vid.removeEventListener('timeupdate', handleTimeUpdate);
    }
  }, [gameState, videoPlaying]);

  // Loading Timer
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

  const triggerGlitch = useCallback(() => {
    setIsGlitching(true);
    setTimeout(() => {
      setIsGlitching(false);
    }, 400); 
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && gameState === 'GAME_OVER') {
        handleRevive();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  const handlePlayClick = useCallback(() => {
    setGameState('PLAYING');
  }, []);

  const handleGameOver = useCallback(() => {
    setGameState('GAME_OVER');
  }, []);

  const handleRevive = useCallback(() => {
    setGameState('PLAYING');
  }, []);

  return (
    <div className={`app-container ${isGlitching ? 'severe-glitch' : ''}`}>
      
      {/* Video Background Layer */}
      {(gameState === 'INTRO' || gameState === 'MENU') && (
        <video 
          ref={videoRef}
          src="/trailer_1080p.mp4" 
          className="video-bg"
          autoPlay 
          muted 
          playsInline
        />
      )}

      {/* Cinematic Intro Layer: Black background with WarpText */}
      <div 
        className="intro-layer" 
        style={{ 
          opacity: (gameState === 'INTRO' && !videoPlaying) ? 1 : 0,
          pointerEvents: (gameState === 'INTRO' && !videoPlaying) ? 'auto' : 'none'
        }}
      >
         {(gameState === 'INTRO' && !videoPlaying) && (
            <WarpText
              text="WELCOME"
              color="#ff0044"
              warpStrength={0.1}
              warpScale={2.0}
              speed={0.6}
              fontSize="clamp(4rem, 15vw, 12rem)"
              fontWeight={800}
              style={{ width: '100%', height: '400px' }}
            />
         )}
      </div>

      {/* Menu Overlay */}
      {gameState === 'MENU' && (
        <div className="overlay-center menu-ui futuristic-panel">
          <h1>READY TO SWING?</h1>
          <div className="instructions-card">
             <h3>HOW TO PLAY</h3>
             <ul>
               <li><span className="key-hint">Click & Hold</span> to shoot a web and swing</li>
               <li><span className="key-hint">Release</span> to detach and freefall</li>
               <li><span className="key-hint">Avoid</span> the red security drones</li>
               <li><span className="key-hint">Collect</span> yellow tokens for speed boosts</li>
             </ul>
          </div>
          <button className="play-button" onClick={handlePlayClick}>
            PLAY THE GAME
          </button>
        </div>
      )}

      {/* Game Over Overlay */}
      {gameState === 'GAME_OVER' && (
        <div className="overlay-center game-over-ui futuristic-panel">
          <h1 className="glitch-text" data-text="MISSION FAILED">MISSION FAILED</h1>
          <h2>Distance: {Math.floor(score)}m</h2>
          <div className="retry-hints">
            <button className="play-button" onClick={handleRevive}>RETRY</button>
            <p className="small-hint">or press SPACE to instantly revive</p>
          </div>
        </div>
      )}

      {/* Main Game UI layer */}
      {gameState === 'PLAYING' && (
        <>
          <div className="halftone-overlay"></div>
          
          <div className="bottom-right-loader">
             <div className="loading-text">SYNCING: {Math.floor(progress)}%</div>
             <ProgressBar progress={progress} />
          </div>
        </>
      )}

      {(gameState === 'PLAYING' || gameState === 'GAME_OVER') && (
         <SpiderManGame 
            setScore={setScore} 
            gameState={gameState}
            onGameOver={handleGameOver}
            onRevive={handleRevive}
         />
      )}
    </div>
  );
}

export default App;
