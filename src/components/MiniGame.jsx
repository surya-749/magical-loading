import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Bug } from 'lucide-react';

const MiniGame = ({ setScore }) => {
  const [targets, setTargets] = useState([]);

  const spawnTarget = useCallback(() => {
    const id = Math.random().toString(36).substring(2, 9);
    const x = Math.random() * 80 + 10; // 10% to 90% vw
    const isSpider = Math.random() > 0.5;
    
    setTargets(prev => [...prev, { id, x, isSpider }]);

    // Remove target after it falls
    setTimeout(() => {
      setTargets(prev => prev.filter(t => t.id !== id));
    }, 4000); // 4 seconds to fall
  }, []);

  useEffect(() => {
    // Spawn a target every 1-2.5 seconds
    const interval = setInterval(() => {
      spawnTarget();
    }, Math.random() * 1500 + 1000);

    return () => clearInterval(interval);
  }, [spawnTarget]);

  const handleHit = (id, isSpider, e) => {
    e.stopPropagation();
    setScore(prev => prev + (isSpider ? 100 : 50));
    setTargets(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: 20,
      overflow: 'hidden'
    }}>
      <AnimatePresence>
        {targets.map(target => (
          <motion.div
            key={target.id}
            initial={{ y: -100, x: `${target.x}vw`, rotate: 0, opacity: 0 }}
            animate={{ y: '110vh', rotate: target.isSpider ? 360 : -360, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 4, ease: 'linear' }}
            style={{
              position: 'absolute',
              pointerEvents: 'auto',
              cursor: 'crosshair',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '60px',
              height: '60px',
              background: target.isSpider ? 'rgba(255,0,255,0.2)' : 'rgba(0,255,255,0.2)',
              border: `2px solid ${target.isSpider ? 'var(--neon-magenta)' : 'var(--neon-cyan)'}`,
              borderRadius: '50%',
              boxShadow: `0 0 15px ${target.isSpider ? 'var(--neon-magenta)' : 'var(--neon-cyan)'}`
            }}
            onClick={(e) => handleHit(target.id, target.isSpider, e)}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.8 }}
          >
            {target.isSpider ? 
              <Bug size={32} color="var(--neon-magenta)" /> : 
              <Target size={32} color="var(--neon-cyan)" />
            }
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default MiniGame;
