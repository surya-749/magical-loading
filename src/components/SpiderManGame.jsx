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
    let bgBuildings = [];
    let fgBuildings = [];
    let particles = [];
    let entities = [];
    let distanceTraveled = 0;
    let gameTime = 0;
    
    const spideyImg = new Image();
    spideyImg.src = '/spiderman.png'; 

    // Main interactive buildings
    const createBuilding = (xOffset = 0) => {
      const width = Math.random() * 80 + 60;  // 60–140px wide
      const height = canvas.height * 0.5 + Math.random() * canvas.height * 0.6;
      const lastB = buildings[buildings.length - 1];
      const gap = Math.random() * 120 + 60; // 60–180px gap between buildings
      const x = lastB ? lastB.x + lastB.width + gap : xOffset;
      const hue = [200, 260, 300, 180, 240][Math.floor(Math.random() * 5)];
      return { x, width, height, hue };
    };

    // Background silhouettes
    const createBgBuilding = (xOffset = 0) => {
      const width = Math.random() * 120 + 60;
      const height = canvas.height * 0.6 + Math.random() * canvas.height * 0.5;
      const lastB = bgBuildings[bgBuildings.length - 1];
      const gap = Math.random() * 70 + 30; // 30–100px gap
      const x = lastB ? lastB.x + lastB.width + gap : xOffset;
      return { x, width, height };
    };

    // Foreground blurry buildings
    const createFgBuilding = (xOffset = 0) => {
      const width = Math.random() * 250 + 150;
      const height = Math.random() * (canvas.height * 0.4) + 50;
      const x = (fgBuildings.length > 0 ? fgBuildings[fgBuildings.length - 1].x + fgBuildings[fgBuildings.length - 1].width + Math.random() * 400 + 300 : 0) + xOffset;
      return { x, width, height };
    };

    for (let i = 0; i < 60; i++) {
      buildings.push(createBuilding(canvas.width));
      bgBuildings.push(createBgBuilding(canvas.width));
    }
    for (let i = 0; i < 15; i++) {
      fgBuildings.push(createFgBuilding(canvas.width));
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

      let hitBuilding = null;
      for (let b of buildings) {
         if (mouseX >= b.x && mouseX <= b.x + b.width) {
            hitBuilding = b;
            break;
         }
      }

      if (!hitBuilding) return; // Missed the building!

      web.active = true;
      web.anchorX = mouseX;
      web.anchorY = canvas.height - hitBuilding.height; // Anchor to the top of the building
      
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

    let lastGameState = gameStateRef.current;

    const update = () => {
      // Check for revive transition
      if (lastGameState === 'GAME_OVER' && gameStateRef.current === 'PLAYING') {
         resetGame();
      }
      lastGameState = gameStateRef.current;

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

      // Death condition: Allow dipping if swinging, but die if too deep.
      let isDead = false;
      if (web.active) {
         if (spidey.y > canvas.height + 600) isDead = true; // Way too deep
      } else {
         if (spidey.y > canvas.height + 50) isDead = true; // Normal falling death
      }

      if (isDead) {
         triggerGlitch();
         setScoreRef.current(prev => Math.max(0, prev - 100));
         if(onGameOverRef.current) onGameOverRef.current();
         return; // Stop updating this frame
      }

      distanceTraveled += xShift > 0 ? xShift : 0;
      if (Math.floor(distanceTraveled) % 150 < Math.abs(xShift) && xShift > 0) {
        setScoreRef.current(prev => prev + 10);
      }

      // Parallax updates
      bgBuildings.forEach(b => b.x -= xShift * 0.3); // Slowest
      bgBuildings = bgBuildings.filter(b => b.x + b.width > -500);
      while (bgBuildings.length < 60) {
        bgBuildings.push(createBgBuilding());
      }

      buildings.forEach(b => b.x -= xShift * 0.8); // Normal
      buildings = buildings.filter(b => b.x + b.width > -500);
      while (buildings.length < 60) {
        buildings.push(createBuilding());
      }

      fgBuildings.forEach(b => b.x -= xShift * 1.4); // Fastest
      fgBuildings = fgBuildings.filter(b => b.x + b.width > -1000);
      while (fgBuildings.length < 15) {
        fgBuildings.push(createFgBuilding(canvas.width + Math.random() * 500));
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

      // ── LAYER 0: Deep night sky gradient ──────────────────────────────
      const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      skyGrad.addColorStop(0,    '#0b0014');
      skyGrad.addColorStop(0.55, '#110033');
      skyGrad.addColorStop(1,    '#1a0045');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // ── LAYER 0.5: Stars (deterministic, no flicker) ─────────────────
      for (let i = 0; i < 120; i++) {
        const sx = (i * 137.5) % canvas.width;
        const sy = (i * 97.3 + 13) % (canvas.height * 0.65);
        const sr = (i % 3 === 0) ? 1.5 : 0.7;
        ctx.globalAlpha = 0.3 + (i % 4) * 0.17;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(sx, sy, sr, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;

      // ── LAYER 1: Far background silhouettes ───────────────────────────
      bgBuildings.forEach(b => {
        const h = b.height;
        const y = canvas.height - h;
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = '#0d0028';
        ctx.fillRect(b.x, y, b.width, h);
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#1e0055';
        for (let wy = y + 15; wy < canvas.height - 10; wy += 18) {
          for (let wx = b.x + 6; wx < b.x + b.width - 6; wx += 14) {
            if ((wx + wy) % 3 !== 0) ctx.fillRect(wx, wy, 5, 7);
          }
        }
      });
      ctx.globalAlpha = 1.0;

      // ── LAYER 2: Mid buildings (interactive, web-anchor layer) ────────
      buildings.forEach(b => {
        const h = b.height;
        const y = canvas.height - h;
        const hue = b.hue;
        const bodyGrad = ctx.createLinearGradient(b.x, y, b.x + b.width, y);
        bodyGrad.addColorStop(0, `hsl(${hue}, 60%, 12%)`);
        bodyGrad.addColorStop(1, `hsl(${hue + 30}, 80%, 16%)`);
        ctx.fillStyle = bodyGrad;
        ctx.globalAlpha = 0.95;
        ctx.fillRect(b.x, y, b.width, h);
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = `hsl(${hue}, 100%, 55%)`;
        ctx.fillRect(b.x, y, 2, h);
        for (let row = y + 20; row < canvas.height - 15; row += 22) {
          for (let col = b.x + 8; col < b.x + b.width - 8; col += 16) {
            if ((col * 3 + row * 7) % 5 === 0) continue;
            const wHue = (col + row) % 2 === 0 ? hue : hue + 60;
            ctx.globalAlpha = 0.7 + Math.sin(Date.now() / 1500 + col) * 0.2;
            ctx.fillStyle = `hsl(${wHue}, 100%, 65%)`;
            ctx.fillRect(col, row, 8, 10);
          }
        }
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = `hsl(${hue}, 100%, 70%)`;
        ctx.fillRect(b.x + b.width / 2 - 1, y - 12, 2, 12);
        ctx.beginPath();
        ctx.arc(b.x + b.width / 2, y - 12, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#ff4466';
        ctx.fill();
      });
      ctx.globalAlpha = 1.0;

      // ── LAYER 3: Entities (drones / tokens) ───────────────────────────
      entities.forEach(ent => {
        ctx.save();
        ctx.translate(ent.x, ent.y);
        ctx.rotate(ent.rotation);
        if (ent.type === 'drone') {
          ctx.shadowColor = '#ff0000';
          ctx.shadowBlur = 18;
          ctx.fillStyle = '#1a0000';
          ctx.fillRect(-ent.radius, -ent.radius, ent.radius * 2, ent.radius * 2);
          ctx.strokeStyle = '#ff0000';
          ctx.lineWidth = 3;
          ctx.strokeRect(-ent.radius, -ent.radius, ent.radius * 2, ent.radius * 2);
          ctx.fillStyle = '#ff0000';
          ctx.fillRect(-ent.radius * 1.5, -3, ent.radius * 3, 6);
          ctx.fillRect(-3, -ent.radius * 1.5, 6, ent.radius * 3);
        } else {
          ctx.shadowColor = '#ffff00';
          ctx.shadowBlur = 22;
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

      // ── LAYER 4: Spider-Man ───────────────────────────────────────────
      ctx.save();
      ctx.translate(spidey.x, spidey.y);
      ctx.rotate(spidey.rotation);
      if (spidey.flip) ctx.scale(1, -1);
      let scaleX = 1, scaleY = 1;
      if (spidey.state === 'swinging') {
        const vel = Math.hypot(spidey.vx, spidey.vy);
        const stretch = Math.min(vel * 0.015, 0.4);
        scaleX = 1 + stretch;
        scaleY = 1 - stretch * 0.5;
      }
      ctx.scale(scaleX, scaleY);
      if (spideyImg.complete && spideyImg.naturalHeight !== 0) {
        ctx.drawImage(spideyImg, -spidey.width / 2, -spidey.height / 2, spidey.width, spidey.height);
      } else {
        ctx.fillStyle = '#e62429';
        ctx.beginPath();
        ctx.arc(0, 0, 30, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // ── LAYER 4.5: Dynamic Arm & Web ─────────────────────────────────
      if (web.active) {
        const shoulderX = spidey.x + (spidey.flip ? -15 : 15);
        const shoulderY = spidey.y - 15;
        const adx = web.anchorX - shoulderX;
        const ady = web.anchorY - shoulderY;
        const adist = Math.hypot(adx, ady);
        const armLen = Math.min(adist * 0.4, 80);
        const handX = shoulderX + (adx / adist) * armLen;
        const handY = shoulderY + (ady / adist) * armLen;
        ctx.save();
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(shoulderX, shoulderY);
        ctx.lineTo(handX, handY);
        ctx.lineWidth = 14;
        ctx.strokeStyle = '#000';
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(shoulderX, shoulderY);
        ctx.lineTo(handX, handY);
        ctx.lineWidth = 9;
        ctx.strokeStyle = '#1a1a1a';
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(handX, handY, 9, 0, Math.PI * 2);
        ctx.fillStyle = '#e62429';
        ctx.shadowColor = '#ff6688';
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.restore();
        const cx = (web.anchorX + handX) / 2 + Math.sin(Date.now() / 50) * web.wobble;
        const cy = (web.anchorY + handY) / 2 + Math.cos(Date.now() / 50) * web.wobble;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(web.anchorX, web.anchorY);
        ctx.quadraticCurveTo(cx, cy, handX, handY);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = web.visualThickness;
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(web.anchorX, web.anchorY, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#00ffff';
        ctx.fill();
        ctx.restore();
      }

      // ── LAYER 5: Particles ────────────────────────────────────────────
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

      // ── LAYER 6: Foreground buildings (darkest, in front of everything) ─
      fgBuildings.forEach(b => {
        const h = b.height;
        const y = canvas.height - h;
        const fgGrad = ctx.createLinearGradient(b.x, y, b.x + b.width, y);
        fgGrad.addColorStop(0, '#060010');
        fgGrad.addColorStop(1, '#090018');
        ctx.fillStyle = fgGrad;
        ctx.globalAlpha = 0.97;
        ctx.fillRect(b.x, y, b.width, h);
        ctx.fillStyle = '#2a006a';
        ctx.globalAlpha = 0.4;
        ctx.fillRect(b.x, y, 2, h);
        ctx.fillRect(b.x + b.width - 2, y, 2, h);
      });
      ctx.globalAlpha = 1.0;

      // ── Ground fog at the very bottom ─────────────────────────────────
      const fogGrad = ctx.createLinearGradient(0, canvas.height - 60, 0, canvas.height);
      fogGrad.addColorStop(0, 'rgba(30,0,80,0)');
      fogGrad.addColorStop(1, 'rgba(10,0,30,0.9)');
      ctx.fillStyle = fogGrad;
      ctx.fillRect(0, canvas.height - 60, canvas.width, 60);
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
