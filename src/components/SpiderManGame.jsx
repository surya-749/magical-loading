import React, { useRef, useEffect } from 'react';

const SpiderManGame = ({ setScore }) => {
  const canvasRef = useRef(null);

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

    // Game state
    const gravity = 0.4;
    const maxVelocity = 35;

    let spidey = {
      x: canvas.width / 4,
      y: canvas.height / 3,
      vx: 15, // Start moving right
      vy: 0,
      width: 100, // Adjusted size
      height: 100,
      state: 'falling', // 'falling' or 'swinging'
    };

    let web = {
      active: false,
      anchorX: 0,
      anchorY: 0,
      length: 0,
      angle: 0,
      angularVelocity: 0
    };

    let buildings = [];
    let particles = [];
    let distanceTraveled = 0;
    
    // Load Spider-Man image downloaded via curl
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

    const spawnParticle = (x, y, color, isSpeedLine = false) => {
      particles.push({
        x, y,
        vx: isSpeedLine ? -Math.abs(spidey.vx) * 2 - 5 : (Math.random() - 0.5) * 6,
        vy: isSpeedLine ? 0 : (Math.random() - 0.5) * 6,
        life: 1,
        color,
        isSpeedLine
      });
    };

    const attachWeb = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX ? e.clientX - rect.left : e.touches[0].clientX - rect.left;
      const mouseY = e.clientY ? e.clientY - rect.top : e.touches[0].clientY - rect.top;

      web.active = true;
      web.anchorX = mouseX;
      web.anchorY = Math.min(mouseY, canvas.height * 0.3); // Anchor to top skyline
      
      const dx = spidey.x - web.anchorX;
      const dy = spidey.y - web.anchorY;
      web.length = Math.sqrt(dx * dx + dy * dy);
      
      // Prevent 0 length
      if (web.length === 0) web.length = 1;
      
      web.angle = Math.atan2(dx, dy);
      
      // V = r * omega -> omega = V / r
      // Resolving linear velocity to angular
      web.angularVelocity = (spidey.vx * Math.cos(web.angle) - spidey.vy * Math.sin(web.angle)) / web.length;
      
      spidey.state = 'swinging';

      for (let i = 0; i < 15; i++) {
        spawnParticle(web.anchorX, web.anchorY, '#ffffff');
      }
    };

    const detachWeb = () => {
      if (web.active) {
        web.active = false;
        spidey.state = 'falling';
        
        // Boost momentum on release for fun game feel
        const momentumBoost = 1.2;
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

    const update = () => {
      const targetX = canvas.width * 0.3; // Spidey stays at 30% of screen width
      let xShift = 0;

      if (spidey.state === 'swinging') {
        let angularAcceleration = (-gravity / web.length) * Math.sin(web.angle);
        web.angularVelocity += angularAcceleration;
        web.angle += web.angularVelocity;
        
        web.angularVelocity *= 0.999; // Less dampening = wilder swings!

        const nextX = web.anchorX + web.length * Math.sin(web.angle);
        const nextY = web.anchorY + web.length * Math.cos(web.angle);
        
        spidey.vx = nextX - spidey.x;
        spidey.vy = nextY - spidey.y;

        spidey.x = nextX;
        spidey.y = nextY;
      } else {
        spidey.vy += gravity;
        spidey.x += spidey.vx;
        spidey.y += spidey.vy;
        spidey.vx *= 0.995;
      }

      // Terminal velocity
      spidey.vx = Math.max(Math.min(spidey.vx, maxVelocity), -maxVelocity);
      spidey.vy = Math.max(Math.min(spidey.vy, maxVelocity), -maxVelocity);

      // Scroll world to keep spidey at targetX
      xShift = spidey.x - targetX;
      spidey.x = targetX; 

      if (web.active) {
        web.anchorX -= xShift;
      }

      // Floor bounce & penalty
      if (spidey.y > canvas.height + 200) {
         spidey.y = 100;
         spidey.vy = 5;
         spidey.vx = 15; // Give speed to keep playing
         setScore(prev => Math.max(0, prev - 50)); 
         // Glitch effect on floor hit
         document.querySelector('.app-container').classList.add('severe-glitch');
         setTimeout(() => {
             const app = document.querySelector('.app-container');
             if(app) app.classList.remove('severe-glitch');
         }, 300);
      }

      distanceTraveled += xShift > 0 ? xShift : 0;
      
      if (Math.floor(distanceTraveled) % 150 < Math.abs(xShift) && xShift > 0) {
        setScore(prev => prev + 10);
      }

      // Parallax Buildings
      buildings.forEach(b => {
        b.x -= xShift * 0.8; // Slower scroll for parallax depth
      });

      buildings = buildings.filter(b => b.x + b.width > -500);
      while (buildings.length < 20) {
        buildings.push(createBuilding());
      }

      // Particles
      particles.forEach(p => {
        p.x -= xShift;
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.isSpeedLine ? 0.1 : 0.03;
      });
      particles = particles.filter(p => p.life > 0);
      
      // Generate speed lines
      if (Math.abs(spidey.vx) > 15 && Math.random() > 0.4) {
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

      if (web.active) {
        ctx.beginPath();
        ctx.moveTo(web.anchorX, web.anchorY);
        ctx.lineTo(spidey.x, spidey.y);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(web.anchorX, web.anchorY, 6, 0, Math.PI*2);
        ctx.fillStyle = '#00ffff';
        ctx.fill();
      }

      particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        if (p.isSpeedLine) {
           ctx.fillRect(p.x, p.y, 80, 2);
        } else {
           ctx.beginPath();
           ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
           ctx.fill();
        }
      });
      ctx.globalAlpha = 1.0;

      ctx.save();
      ctx.translate(spidey.x, spidey.y);
      
      // Calculate visual rotation
      if (spidey.state === 'swinging') {
         // Rotate relative to web angle
         ctx.rotate(-web.angle + Math.PI/2);
      } else {
         // Face trajectory
         ctx.rotate(Math.atan2(spidey.vy, spidey.vx));
      }

      if (spideyImg.complete && spideyImg.naturalHeight !== 0) {
        // We have the downloaded spiderman png
        ctx.drawImage(spideyImg, -spidey.width/2, -spidey.height/2, spidey.width, spidey.height);
      } else {
        // Fallback drawing
        ctx.fillStyle = '#ff00ff'; 
        ctx.beginPath();
        ctx.arc(0, 0, 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#00ffff'; 
        ctx.fillRect(-15, -15, 30, 30);
      }
      
      ctx.restore();
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
  }, [setScore]);

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
