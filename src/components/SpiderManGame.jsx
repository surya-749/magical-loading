import React, { useRef, useEffect } from 'react';

const SpiderManGame = ({ setScore, gameState, onGameOver, onRevive }) => {
  const canvasRef = useRef(null);
  
  // Refs to hold mutable latest props without causing re-renders
  const gameStateRef = useRef(gameState);
  const setScoreRef = useRef(setScore);
  const onGameOverRef = useRef(onGameOver);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    setScoreRef.current = setScore;
  }, [setScore]);

  useEffect(() => {
    onGameOverRef.current = onGameOver;
  }, [onGameOver]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    // Game variables
    const gravity = 0.4;
    const maxVelocity = 35;

    let spidey = {
      x: canvas.width / 4,
      y: canvas.height / 3,
      vx: 15,
      vy: 0,
      width: 100,
      height: 100,
      state: 'falling',
      flip: false,
      rotation: 0
    };

    let web = {
      active: false,
      anchorX: 0,
      anchorY: 0,
      length: 0,
      angle: 0,
      angularVelocity: 0,
      visualThickness: 0,
      wobble: 0
    };

    let buildings = [];
    let particles = [];
    let entities = [];
    let distanceTraveled = 0;
    let gameTime = 0;
    
    const spideyImg = new Image();
    spideyImg.src = '/spiderman.png'; 

    const createBuilding = (xOffset = 0) => {
      const width = Math.random() * 150 + 80;
      const height = Math.random() * (canvas.height * 0.7) + 50;
      const x = (buildings.length > 0 ? buildings[buildings.length - 1].x + buildings[buildings.length - 1].width + Math.random() * 100 : 0) + xOffset;
      const hue = Math.random() > 0.5 ? 300 : 180; 
      return { x, width, height, hue };
    };

    for (let i = 0; i < 20; i++) {
      buildings.push(createBuilding(canvas.width));
    }

    const spawnParticle = (x, y, color, isSpeedLine = false, customVx = null, customVy = null) => {
      particles.push({
        x, y,
        vx: isSpeedLine ? -Math.abs(spidey.vx) * 2 - 5 : (customVx !== null ? customVx : (Math.random() - 0.5) * 6),
        vy: isSpeedLine ? 0 : (customVy !== null ? customVy : (Math.random() - 0.5) * 6),
        life: 1,
        color,
        isSpeedLine
      });
    };

    const spawnEntity = (xOffset) => {
      const isObstacle = Math.random() > 0.4;
      entities.push({
        id: Math.random(),
        type: isObstacle ? 'drone' : 'token',
        x: xOffset + Math.random() * 500,
        y: Math.random() * (canvas.height - 200) + 50,
        radius: isObstacle ? 25 : 15,
        rotation: 0
      });
    };

    for(let i=1; i<5; i++) {
      spawnEntity(canvas.width + i*400);
    }

    const attachWeb = (e) => {
      if (gameStateRef.current !== 'PLAYING') return;

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX ? e.clientX - rect.left : e.touches[0].clientX - rect.left;
      const mouseY = e.clientY ? e.clientY - rect.top : e.touches[0].clientY - rect.top;

      web.active = true;
      web.anchorX = mouseX;
      web.anchorY = Math.min(mouseY, canvas.height * 0.3);
      
      const dx = spidey.x - web.anchorX;
      const dy = spidey.y - web.anchorY;
      web.length = Math.sqrt(dx * dx + dy * dy);
      if (web.length === 0) web.length = 1;
      
      web.angle = Math.atan2(dx, dy);
      web.angularVelocity = (spidey.vx * Math.cos(web.angle) - spidey.vy * Math.sin(web.angle)) / web.length;
      
      spidey.state = 'swinging';
      web.visualThickness = 8;
      web.wobble = 15;

      for (let i = 0; i < 15; i++) {
        spawnParticle(web.anchorX, web.anchorY, '#ffffff');
      }
    };

    const detachWeb = () => {
      if (web.active && gameStateRef.current === 'PLAYING') {
        web.active = false;
        spidey.state = 'falling';
        const momentumBoost = 1.3;
        spidey.vx = web.length * web.angularVelocity * Math.cos(web.angle) * momentumBoost;
        spidey.vy = -web.length * web.angularVelocity * Math.sin(web.angle) * momentumBoost;
      }
    };

    const handleDown = (e) => attachWeb(e);
    const handleUp = (e) => detachWeb();

    canvas.addEventListener('mousedown', handleDown);
    canvas.addEventListener('mouseup', handleUp);
    canvas.addEventListener('touchstart', (e) => { handleDown(e); e.preventDefault(); }, {passive: false});
    canvas.addEventListener('touchend', (e) => { handleUp(); e.preventDefault(); }, {passive: false});

    const triggerGlitch = () => {
      document.querySelector('.app-container')?.classList.add('severe-glitch');
      setTimeout(() => {
          document.querySelector('.app-container')?.classList.remove('severe-glitch');
      }, 300);
    };

    const resetGame = () => {
      spidey.y = 100;
      spidey.vy = 5;
      spidey.vx = 15;
      web.active = false;
      spidey.state = 'falling';
    };

    const update = () => {
      // If we just revived, reset position
      if (gameStateRef.current === 'PLAYING' && spidey.y > canvas.height) {
         resetGame();
      }

      if (gameStateRef.current !== 'PLAYING') return; // Pause updates if not playing

      gameTime += 0.05;
      const targetX = canvas.width * 0.3;
      let xShift = 0;

      if (spidey.state === 'swinging') {
        let angularAcceleration = (-gravity / web.length) * Math.sin(web.angle);
        web.angularVelocity += angularAcceleration;
        web.angle += web.angularVelocity;
        web.angularVelocity *= 0.999; 

        const nextX = web.anchorX + web.length * Math.sin(web.angle);
        const nextY = web.anchorY + web.length * Math.cos(web.angle);
        
        spidey.vx = nextX - spidey.x;
        spidey.vy = nextY - spidey.y;
        spidey.x = nextX;
        spidey.y = nextY;
        
        web.visualThickness += (2 - web.visualThickness) * 0.1;
        web.wobble *= 0.8;
        spidey.rotation = -web.angle + Math.PI/2;
      } else {
        spidey.vy += gravity;
        spidey.x += spidey.vx;
        spidey.y += spidey.vy;
        spidey.vx *= 0.995;
        spidey.rotation += (spidey.vx > 0 ? 0.2 : -0.2); // Spin while falling
      }

      spidey.vx = Math.max(Math.min(spidey.vx, maxVelocity), -maxVelocity);
      spidey.vy = Math.max(Math.min(spidey.vy, maxVelocity), -maxVelocity);

      if (spidey.vx > 0) spidey.flip = false;
      else if (spidey.vx < -2) spidey.flip = true;

      xShift = spidey.x - targetX;
      spidey.x = targetX; 
      if (web.active) web.anchorX -= xShift;

      // Death condition
      if (spidey.y > canvas.height + 150) {
         triggerGlitch();
         setScoreRef.current(prev => Math.max(0, prev - 100));
         if(onGameOverRef.current) onGameOverRef.current();
      }

      distanceTraveled += xShift > 0 ? xShift : 0;
      if (Math.floor(distanceTraveled) % 150 < Math.abs(xShift) && xShift > 0) {
        setScoreRef.current(prev => prev + 10);
      }

      buildings.forEach(b => b.x -= xShift * 0.8);
      buildings = buildings.filter(b => b.x + b.width > -500);
      while (buildings.length < 20) {
        buildings.push(createBuilding());
      }

      let spawnedThisFrame = false;
      entities.forEach((ent, idx) => {
        ent.x -= xShift;
        ent.rotation += 0.05;
        
        if (ent.type === 'token') {
           ent.y += Math.sin(Date.now() / 200 + ent.id) * 1.5;
        }

        const dist = Math.hypot(ent.x - spidey.x, ent.y - spidey.y);
        if (dist < spidey.width/3 + ent.radius) {
           if (ent.type === 'drone') {
              spidey.vx = -10;
              spidey.vy = -10;
              if (web.active) detachWeb();
              setScoreRef.current(prev => Math.max(0, prev - 100));
              triggerGlitch();
              for(let i=0; i<20; i++) spawnParticle(ent.x, ent.y, '#ff00ff');
           } else if (ent.type === 'token') {
              setScoreRef.current(prev => prev + 150);
              spidey.vx += 5; 
              for(let i=0; i<15; i++) spawnParticle(ent.x, ent.y, '#ffff00');
           }
           entities.splice(idx, 1);
        }
      });
      
      entities = entities.filter(ent => ent.x > -100);
      while(entities.length < 5 && !spawnedThisFrame) {
         spawnEntity(canvas.width + 200);
         spawnedThisFrame = true;
      }

      particles.forEach(p => {
        p.x -= xShift;
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.isSpeedLine ? 0.1 : 0.03;
      });
      particles = particles.filter(p => p.life > 0);
      
      if (Math.abs(spidey.vx) > 20 && Math.random() > 0.3) {
        spawnParticle(canvas.width + Math.random()*200, Math.random() * canvas.height, '#ffffff', true);
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.globalAlpha = 0.6;
      buildings.forEach(b => {
        const grd = ctx.createLinearGradient(0, canvas.height - b.height, 0, canvas.height);
        grd.addColorStop(0, `hsl(${b.hue}, 100%, 40%)`);
        grd.addColorStop(1, '#0a0a0c');
        ctx.fillStyle = grd;
        ctx.fillRect(b.x, canvas.height - b.height, b.width, b.height);
        
        ctx.fillStyle = `hsla(${b.hue}, 100%, 70%, 0.8)`;
        for(let wy = canvas.height - b.height + 30; wy < canvas.height; wy += 40) {
            for(let wx = b.x + 20; wx < b.x + b.width - 20; wx += 30) {
                if (Math.random() > 0.4) ctx.fillRect(wx, wy, 8, 12);
            }
        }
      });
      ctx.globalAlpha = 1.0;

      entities.forEach(ent => {
         ctx.save();
         ctx.translate(ent.x, ent.y);
         ctx.rotate(ent.rotation);
         
         if (ent.type === 'drone') {
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 15;
            ctx.fillStyle = '#111';
            ctx.fillRect(-ent.radius, -ent.radius, ent.radius*2, ent.radius*2);
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 3;
            ctx.strokeRect(-ent.radius, -ent.radius, ent.radius*2, ent.radius*2);
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(-ent.radius*1.5, -3, ent.radius*3, 6);
            ctx.fillRect(-3, -ent.radius*1.5, 6, ent.radius*3);
         } else {
            ctx.shadowColor = '#ffff00';
            ctx.shadowBlur = 20;
            ctx.fillStyle = '#ffff00';
            ctx.beginPath();
            ctx.moveTo(0, -ent.radius);
            ctx.lineTo(ent.radius, 0);
            ctx.lineTo(0, ent.radius);
            ctx.lineTo(-ent.radius, 0);
            ctx.closePath();
            ctx.fill();
         }
         ctx.restore();
      });

      // Draw Main Spidey Image
      ctx.save();
      ctx.translate(spidey.x, spidey.y);
      ctx.rotate(spidey.rotation);

      if (spidey.flip) {
         ctx.scale(1, -1); 
      }

      let scaleX = 1;
      let scaleY = 1;
      if (spidey.state === 'swinging' && gameStateRef.current === 'PLAYING') {
         const vel = Math.hypot(spidey.vx, spidey.vy);
         const stretch = Math.min(vel * 0.015, 0.4); 
         scaleX = 1 + stretch;
         scaleY = 1 - stretch * 0.5;
      }
      ctx.scale(scaleX, scaleY);

      if (spideyImg.complete && spideyImg.naturalHeight !== 0) {
        ctx.drawImage(spideyImg, -spidey.width/2, -spidey.height/2, spidey.width, spidey.height);
      } else {
        ctx.fillStyle = '#ff00ff'; 
        ctx.beginPath();
        ctx.arc(0, 0, 30, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Dynamic Arm & Web
      if (web.active) {
        let shoulderX = spidey.x + (spidey.flip ? -15 : 15);
        let shoulderY = spidey.y - 15;
        
        let dx = web.anchorX - shoulderX;
        let dy = web.anchorY - shoulderY;
        let dist = Math.hypot(dx, dy);
        let armLen = Math.min(dist * 0.4, 80); 
        let nx = (dx / dist) * armLen;
        let ny = (dy / dist) * armLen;
        
        let handX = shoulderX + nx;
        let handY = shoulderY + ny;

        // Draw Arm
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(shoulderX, shoulderY);
        ctx.lineTo(handX, handY);
        ctx.lineWidth = 14;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#000';
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(shoulderX, shoulderY);
        ctx.lineTo(handX, handY);
        ctx.lineWidth = 10;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#111'; // Black suit
        ctx.stroke();

        // Red Hand
        ctx.beginPath();
        ctx.arc(handX, handY, 9, 0, Math.PI*2);
        ctx.fillStyle = '#e62429'; // Miles red
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#000';
        ctx.stroke();
        ctx.restore();

        // Draw Web connecting to hand!
        ctx.save();
        let cx = (web.anchorX + handX) / 2;
        let cy = (web.anchorY + handY) / 2;
        cx += Math.sin(Date.now() / 50) * web.wobble;
        cy += Math.cos(Date.now() / 50) * web.wobble;

        ctx.beginPath();
        ctx.moveTo(web.anchorX, web.anchorY);
        ctx.quadraticCurveTo(cx, cy, handX, handY);
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = web.visualThickness;
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 10;
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(web.anchorX, web.anchorY, 6, 0, Math.PI*2);
        ctx.fillStyle = '#00ffff';
        ctx.fill();
        ctx.restore();
      }

      particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        if (p.isSpeedLine) {
           ctx.fillRect(p.x, p.y, 100, 3);
        } else {
           ctx.beginPath();
           ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
           ctx.fill();
        }
      });
      ctx.globalAlpha = 1.0;
    };

    const loop = () => {
      update();
      draw();
      animationFrameId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousedown', handleDown);
      canvas.removeEventListener('mouseup', handleUp);
      cancelAnimationFrame(animationFrameId);
    };
  }, []); // EMPTY dependency array!

  return (
    <canvas 
      ref={canvasRef} 
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1, 
        cursor: 'crosshair',
        touchAction: 'none'
      }} 
    />
  );
};

export default SpiderManGame;
