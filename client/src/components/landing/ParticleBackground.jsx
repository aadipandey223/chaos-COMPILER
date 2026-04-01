import React, { useState, useEffect, useRef } from 'react';

// using namespace std; // Keeping your C++ roots in mind, even in JS! ;)

// Helper for linear interpolation
const lerp = (start, end, t) => start * (1 - t) + end * t;

export default function ParticleBackground({ activeShape }) {
  const canvasRef = useRef(null);
  const activeShapeRef = useRef(activeShape);

  useEffect(() => {
    activeShapeRef.current = activeShape;
  }, [activeShape]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    // --- 1. PARTICLE DATA STRUCTURE ---
    const particles = [];
    const numShapeParticles = 800; 
    const numAmbientParticles = 80; 
    
    for (let i = 0; i < numShapeParticles + numAmbientParticles; i++) {
      const isShape = i < numShapeParticles;
      
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 1.5, 
        vy: (Math.random() - 0.5) * 1.5,
        tx: 0, 
        ty: 0, 
        size: Math.random() > 0.6 ? 2.5 : 1.5, 
        isShapeParticle: isShape,
        
        offsetX: (Math.random() - 0.5) * 0.015, 
        offsetY: (Math.random() - 0.5) * 0.015,

        activationDelay: 0, 

        // Adjusted friction so they glide smoothly around their targets, scaled down for slower speed
        springForce: Math.random() * 0.003 + 0.001, 
        friction: Math.random() * 0.02 + 0.92,     

        alpha: 1.0,
        settledFrames: 0,
        // DRASTICALLY increased lifespan. They stay on the shape for thousands of frames.
        // This prevents the screen from going black and heavily reduces edge-spawning.
        maxSettledFrames: Math.random() * 2000 + 1000, 

        noiseSeed: Math.random() * Math.PI * 2,
        color: isShape 
          ? (Math.random() > 0.15 ? '#f97316' : '#fdba74') 
          : 'rgba(255, 255, 255, 0.10)'
      });
    }

    // --- 2. SHAPE FORMATION (Target Points) ---
    let targetPointMaps = { code: [] };

    const generatePointMaps = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const scale = Math.min(canvas.width, canvas.height) * 0.45;

      const codePoints = [];
      const thickness = scale * 0.08; 

      const segments = [
        { x1: cx - scale * 0.5, y1: cy - scale * 0.6, x2: cx - scale * 0.9, y2: cy },
        { x1: cx - scale * 0.9, y1: cy,               x2: cx - scale * 0.5, y2: cy + scale * 0.6 },
        { x1: cx + scale * 0.15, y1: cy - scale * 0.8, x2: cx - scale * 0.15, y2: cy + scale * 0.8 },
        { x1: cx + scale * 0.5, y1: cy - scale * 0.6, x2: cx + scale * 0.9, y2: cy },
        { x1: cx + scale * 0.9, y1: cy,               x2: cx + scale * 0.5, y2: cy + scale * 0.6 },
      ];

      for (let i = 0; i < numShapeParticles; i++) {
        const seg = segments[Math.floor(Math.random() * segments.length)];
        
        const dx = seg.x2 - seg.x1;
        const dy = seg.y2 - seg.y1;
        const len = Math.hypot(dx, dy);
        const nx = (-dy / len) * thickness;
        const ny = (dx / len) * thickness;

        const r = Math.random();
        const t = Math.random();
        let bx, by;

        if (r < 0.43) {
          bx = lerp(seg.x1 + nx, seg.x2 + nx, t);
          by = lerp(seg.y1 + ny, seg.y2 + ny, t);
        } else if (r < 0.86) {
          bx = lerp(seg.x1 - nx, seg.x2 - nx, t);
          by = lerp(seg.y1 - ny, seg.y2 - ny, t);
        } else if (r < 0.90) {
          bx = seg.x1 + lerp(nx, -nx, t);
          by = seg.y1 + lerp(ny, -ny, t);
        } else if (r < 0.94) {
          bx = seg.x2 + lerp(nx, -nx, t);
          by = seg.y2 + lerp(ny, -ny, t);
        } else {
          const interiorWeight = (Math.random() * 2 - 1) * 0.85; 
          bx = lerp(seg.x1 + nx * interiorWeight, seg.x2 + nx * interiorWeight, t);
          by = lerp(seg.y1 + ny * interiorWeight, seg.y2 + ny * interiorWeight, t);
        }

        codePoints.push({ x: bx, y: by });
      }

      targetPointMaps = { code: codePoints };
    };

    window.addEventListener('resize', generatePointMaps);
    generatePointMaps();

    // --- 3 & 4. MOVEMENT LOGIC & PHYSICS ---
    let time = 0;
    let shapeActiveFrames = 0;
    let lastShape = 'scatter';

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height); // Keep transparent for CSS hero background!
      time += 0.02;

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const scale = Math.min(canvas.width, canvas.height) * 0.45;
      const currentShape = activeShapeRef.current;
      const targetPoints = targetPointMaps[currentShape] || [];

      if (currentShape !== lastShape) {
        shapeActiveFrames = 0;
        if (currentShape !== 'scatter') {
          particles.forEach(p => {
            // Remove huge distance delay so they form the shape instantly
            p.activationDelay = Math.random() * 5; 
            p.settledFrames = 0;
          });
        } else {
          // FAST DISPERSION: Explode particles outward when cursor leaves
          particles.forEach(p => {
            if (p.isShapeParticle) {
              const angle = Math.atan2(p.y - cy, p.x - cx) + (Math.random() - 0.5) * 0.5;
              const burst = Math.random() * 5 + 2; // Made explosion gentler and slower
              p.vx += Math.cos(angle) * burst;
              p.vy += Math.sin(angle) * burst;
            }
          });
        }
        lastShape = currentShape;
      }

      if (currentShape !== 'scatter') {
        shapeActiveFrames++;
      }

      let shapeIdx = 0;

      particles.forEach((p) => {
        
        if (p.isShapeParticle && currentShape !== 'scatter') {
          
          if (shapeActiveFrames > p.activationDelay) {
            const target = targetPoints[shapeIdx];
            
            // NEW: Micro-Orbiting Targets
            // The target point itself moves in a tiny slow circle. 
            // This guarantees the particles never fully "stop", they are always swimming.
            const roamX = Math.sin(time * 0.5 + p.noiseSeed) * 6;
            const roamY = Math.cos(time * 0.5 + p.noiseSeed) * 6;

            p.tx = target.x + p.offsetX * scale + roamX;
            p.ty = target.y + p.offsetY * scale + roamY;

            let dx = p.tx - p.x;
            let dy = p.ty - p.y;
            let dist = Math.hypot(dx, dy);

            // Fading & Recycling
            if (dist < 20) {
              p.settledFrames++;
            }
            
            if (p.settledFrames > p.maxSettledFrames) {
              p.alpha -= 0.02; 
              if (p.alpha <= 0) {
                const angle = Math.random() * Math.PI * 2;
                // Spawn just outside the shape so they arrive instantly, but maintain their slow speed
                const spawnRadius = Math.min(canvas.width, canvas.height) * 0.45 + 20 + Math.random() * 40;
                p.x = cx + Math.cos(angle) * spawnRadius;
                p.y = cy + Math.sin(angle) * spawnRadius;
                p.vx = -Math.cos(angle) * 0.5; // Slight drift towards center
                p.vy = -Math.sin(angle) * 0.5;
                p.settledFrames = 0; 
                p.activationDelay = 0; 
              }
            } else {
              if (p.alpha < 1) p.alpha += 0.03;
            }

            let dynamicSpring = p.springForce;
            
            if (dist > 250) {
              dynamicSpring *= 0.6; 
            } else if (dist > 80) {
              dynamicSpring *= 1.2; 
            } else {
              dynamicSpring *= 2.0; 
            }

            p.vx += dx * dynamicSpring; 
            p.vy += dy * dynamicSpring;
            
            // Added slightly more noise for a "living" wobble effect
            p.vx += Math.sin(time + p.noiseSeed) * 0.03;
            p.vy += Math.cos(time + p.noiseSeed) * 0.03;

            p.vx *= p.friction; 
            p.vy *= p.friction;
          } else {
            p.vx *= 0.95;
            p.vy *= 0.95;
          }
          
          shapeIdx++;
        } else {
          // --- SCATTER STATE ---
          if (p.isShapeParticle) shapeIdx++;
          
          if (p.alpha < 1) p.alpha += 0.05;
          p.settledFrames = 0;

          p.vx += (Math.random() - 0.5) * 0.05; 
          p.vy += (Math.random() - 0.5) * 0.05;

          const maxSpeed = p.isShapeParticle ? 15.0 : 0.3;
          const speed = Math.hypot(p.vx, p.vy);
          if (speed > maxSpeed) {
            p.vx = (p.vx / speed) * maxSpeed;
            p.vy = (p.vy / speed) * maxSpeed;
          }

          // DYNAMIC FRICTION: Slow down quickly from burst, then drift gently
          if (speed > 1.5) {
            p.vx *= 0.92;
            p.vy *= 0.92;
          } else {
            p.vx *= 0.99;
            p.vy *= 0.99;
          }
        }

        p.x += p.vx;
        p.y += p.vy;

        // Wrap around edges when not forming shape
        if (currentShape === 'scatter') {
          if (p.x < -30) p.x += canvas.width + 60;
          if (p.x > canvas.width + 30) p.x -= canvas.width + 60;
          if (p.y < -30) p.y += canvas.height + 60;
          if (p.y > canvas.height + 30) p.y -= canvas.height + 60;
        }

        ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      });
      
      ctx.globalAlpha = 1.0;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', generatePointMaps);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0, // Put it behind text but above the dark background
        pointerEvents: 'none'
      }}
    />
  );
}