'use client';

import React, { useEffect, useRef, useState } from 'react';

interface Node {
    x: number;
    y: number;
    vx: number;
    vy: number;
    baseX: number;
    baseY: number;
    radius: number;
    label: string;
    pulse: number;
    col: number;
    row: number;
}

export default function ConstellationGrid() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        setIsDarkMode(mediaQuery.matches);
        const handler = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return;

        let animationFrameId: number;
        let width = 0;
        let height = 0;
        let cols = 0;
        let rows = 0;
        const spacing = 65;

        const mouse = {
            x: -1000,
            y: -1000,
            prevX: -1000,
            prevY: -1000,
            vx: 0,
            vy: 0,
            radius: 320, 
        };

        let nodes: Node[] = [];

        const handleResize = () => {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            ctx.scale(dpr, dpr);
            initNodes();
        };

        const handleMouseMove = (e: MouseEvent) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        };

        const handleMouseLeave = () => {
            mouse.x = -1000;
            mouse.y = -1000;
        };

        const initNodes = () => {
            nodes = [];
            cols = Math.ceil(width / spacing) + 1;
            rows = Math.ceil(height / spacing) + 1;

            for (let i = 0; i < cols; i++) {
                for (let j = 0; j < rows; j++) {
                    const x = i * spacing;
                    const y = j * spacing;
                    nodes.push({
                        x,
                        y,
                        vx: 0,
                        vy: 0,
                        baseX: x,
                        baseY: y,
                        radius: Math.random() * 1.5 + 2.0, 
                        label: `${i}:${j}`,
                        pulse: Math.random() * Math.PI * 2,
                        col: i,
                        row: j
                    });
                }
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseleave', handleMouseLeave);

        let lastTime = performance.now();

        const render = (now: number) => {
            const dt = Math.min((now - lastTime) / 1000, 0.05);
            lastTime = now;

            mouse.vx = (mouse.x - mouse.prevX) / (dt * 1000 || 1);
            mouse.vy = (mouse.y - mouse.prevY) / (dt * 1000 || 1);
            mouse.prevX = mouse.x;
            mouse.prevY = mouse.y;

            const speed = Math.sqrt(mouse.vx * mouse.vx + mouse.vy * mouse.vy);
            const bgColor = isDarkMode ? '#020305' : '#f8fafc';
            
            const nodeColor = isDarkMode ? '255, 255, 255' : '15, 23, 42';
            // 🚀 ULTRA-BRIGHT NEON BLUE: Swapped to highly saturated raw electric cyan/blue
            const accentColor = isDarkMode ? '0, 238, 255' : '0, 153, 255'; 
            const gridLineColor = isDarkMode ? 'rgba(0, 238, 255, 0.025)' : 'rgba(15, 23, 42, 0.015)';

            ctx.fillStyle = bgColor;
            ctx.fillRect(0, 0, width, height);

            // Background Structural Grid Lines
            ctx.strokeStyle = gridLineColor;
            ctx.lineWidth = 0.5;
            for (let i = 0; i < cols; i++) {
                ctx.beginPath();
                ctx.moveTo(i * spacing, 0);
                ctx.lineTo(i * spacing, height);
                ctx.stroke();
            }
            for (let j = 0; j < rows; j++) {
                ctx.beginPath();
                ctx.moveTo(0, j * spacing);
                ctx.lineTo(width, j * spacing);
                ctx.stroke();
            }

            const SPRING_K = 14;  
            const DAMPING = 0.84; 

            // Physics Pass
            for (let i = 0; i < nodes.length; i++) {
                const n = nodes[i];
                n.pulse += dt * 2.5;

                const dx = mouse.x - n.x;
                const dy = mouse.y - n.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < mouse.radius && dist > 0) {
                    const power = (1 - dist / mouse.radius);
                    const force = power * (1200 + speed * 140);
                    const angle = Math.atan2(dy, dx);

                    n.vx -= Math.cos(angle) * force * dt;
                    n.vy -= Math.sin(angle) * force * dt;
                }

                const homeDx = n.baseX - n.x;
                const homeDy = n.baseY - n.y;

                n.vx += homeDx * SPRING_K * dt;
                n.vy += homeDy * SPRING_K * dt;
                n.vx *= DAMPING;
                n.vy *= DAMPING;

                n.x += n.vx * dt * 60;
                n.y += n.vy * dt * 60;
            }

            // High Performance Connections Pass (O(N))
            const MAX_CONN_DIST = 90; 
            const MAX_CONN_DIST_SQ = MAX_CONN_DIST * MAX_CONN_DIST;

            for (let i = 0; i < nodes.length; i++) {
                const n = nodes[i];
                const targets = [i + 1, i + rows, i + rows + 1, i + rows - 1];

                for (let t = 0; t < targets.length; t++) {
                    const n2 = nodes[targets[t]];
                    if (!n2) continue;
                    if (Math.abs(n.col - n2.col) > 1 || Math.abs(n.row - n2.row) > 1) continue;

                    const ndx = n.x - n2.x;
                    const ndy = n.y - n2.y;
                    const distSq = ndx * ndx + ndy * ndy;

                    if (distSq < MAX_CONN_DIST_SQ) {
                        const nDist = Math.sqrt(distSq);
                        const alpha = (1 - nDist / MAX_CONN_DIST) * (isDarkMode ? 0.45 : 0.2);

                        ctx.strokeStyle = `rgba(${accentColor}, ${alpha})`;
                        ctx.lineWidth = 0.85;
                        ctx.beginPath();
                        ctx.moveTo(n.x, n.y);
                        ctx.lineTo(n2.x, n2.y);
                        ctx.stroke();
                    }
                }
            }

            // Render Pass
            const HOVER_EFFECT_RADIUS = 180; 
            
            for (let i = 0; i < nodes.length; i++) {
                const n = nodes[i];
                const dx = mouse.x - n.x;
                const dy = mouse.y - n.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < HOVER_EFFECT_RADIUS && dist > 0) {
                    const alpha = (1 - dist / HOVER_EFFECT_RADIUS);

                    // 🚀 FIXED BLOOM LAYER: Shadow opacity syntax is completely cleaned up
                    ctx.shadowBlur = 25;
                    ctx.shadowColor = `rgba(${accentColor}, 0.95)`;
                    
                    const interactiveSize = n.radius * (1.3 + alpha * 3.0);
                    
                    ctx.fillStyle = `rgba(${accentColor}, ${0.5 + alpha * 0.5})`;
                    ctx.beginPath();
                    ctx.arc(n.x, n.y, interactiveSize, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // High-contrast solid central core anchor
                    ctx.fillStyle = '#ffffff';
                    ctx.beginPath();
                    ctx.arc(n.x, n.y, n.radius * 0.8, 0, Math.PI * 2);
                    ctx.fill();
                    
                    ctx.shadowBlur = 0; // Clear blur constraints

                    // Active proximity text metadata layer
                    ctx.fillStyle = isDarkMode ? `rgba(0, 238, 255, ${alpha * 0.85 + 0.15})` : `rgba(0, 153, 255, ${alpha * 0.85})`;
                    ctx.font = '700 10px monospace';
                    ctx.textAlign = 'center';
                    ctx.fillText(n.label, n.x, n.y - (14 + alpha * 6));
                } else {
                    // Rest state nodes
                    ctx.fillStyle = `rgba(${nodeColor}, ${0.14 + Math.sin(n.pulse) * 0.04})`;
                    ctx.beginPath();
                    ctx.arc(n.x, n.y, n.radius * 0.65, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            animationFrameId = requestAnimationFrame(render);
        };

        animationFrameId = requestAnimationFrame(render);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseleave', handleMouseLeave);
            cancelAnimationFrame(animationFrameId);
        };
    }, [isDarkMode]);

    return (
        <div className="absolute inset-0 w-full h-full">
            <canvas ref={canvasRef} className="block w-full h-full" />
        </div>
    );
}
