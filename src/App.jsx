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
      vid.muted = true;
      
      const playPromise = vid.play();
      if (playPromise !== undefined) {
        playPromise.catch(e => console.log("Autoplay prevented:", e));
      }

      const handlePlayStart = () => {
        if (!videoPlaying) {
           setVideoPlaying(true);
        }
      };
      
      const handleEnded = () => {
        if (videoPlaying) {
           setGameState('MENU');
        }
      };
      
      vid.addEventListener('playing', handlePlayStart);
      vid.addEventListener('ended', handleEnded);
      return () => {
         vid.removeEventListener('playing', handlePlayStart);
         vid.removeEventListener('ended', handleEnded);
      }
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
          src="/cropped-miles.mp4" 
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
              fontSize="clamp(3rem, 10vw, 7rem)"
              fontWeight={800}
              style={{ width: '100%', height: '300px' }}
            />
         )}
      </div>

      {/* Menu Overlay */}
      {gameState === 'MENU' && (
        <div className="overlay-center menu-ui futuristic-panel">
          <h1>READY TO SWING?</h1>
          <div className="instructions-card">
             <h3>MISSION BRIEFING</h3>
             <ul>
               <li><span className="key-hint">LEFT CLICK</span> to shoot a web and start swinging</li>
               <li><span className="key-hint">TARGETS</span> Webs can <strong>ONLY</strong> be attached to buildings!</li>
               <li><span className="key-hint">RELEASE</span> mouse button to detach and freefall</li>
               <li><span className="key-hint">MISSION TIME</span> Play for the duration of website sync/loading!</li>
               <li><span className="key-hint">AVOID</span> red security drones & stay out of the abyss</li>
             </ul>
          </div>
          <button className="play-button" onClick={handlePlayClick}>
            ENTER SPIDER-VERSE
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
