import React from 'react';
import { motion } from 'framer-motion';

const ProgressBar = ({ progress }) => {
  return (
    <div style={{
      width: '100%',
      height: '40px',
      border: '4px solid white',
      position: 'relative',
      background: 'rgba(0,0,0,0.5)',
      boxShadow: '4px 4px 0 var(--neon-cyan)',
      overflow: 'hidden'
    }}>
      <motion.div 
        style={{
          height: '100%',
          background: 'var(--neon-magenta)',
          borderRight: '4px solid white'
        }}
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ type: 'tween', ease: 'linear', duration: 0.1 }}
      />
      
      {/* Halftone/Pattern Overlay on Bar */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)',
        pointerEvents: 'none'
      }}></div>

      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        fontFamily: 'var(--comic-font)',
        fontSize: '1.5rem',
        color: 'white',
        textShadow: '2px 2px 0 #000',
        zIndex: 2
      }}>
        {Math.floor(progress)}%
      </div>
    </div>
  );
};

export default ProgressBar;
