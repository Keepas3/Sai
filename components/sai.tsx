'use client'; 

import React, { useEffect, useRef } from 'react';

export default function SakuraCanvas() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // --- 1. SAKURA ASSETS & RATIO LAYOUT CONFIGS ---
        const regularPaths = ['/sakura.png', '/sakura2.png'];
        const rarePath = '/reimu.png'; // 
        const rareProbability = 0.02;       // ◄ 0.5 = 50% chance to spawn this asset

        const regularImages: HTMLImageElement[] = [];
        let rareImage: HTMLImageElement | null = null;
        let loadedImageCount = 0;
        const totalImagesToLoad = regularPaths.length + 1;

        // Preload standard uniform items
        regularPaths.forEach((path) => {
            const img = new Image();
            img.src = path;
            img.onload = () => loadedImageCount++;
            img.onerror = () => console.error(`Failed loading layout path: ${path}`);
            regularImages.push(img);
        });

        // Preload rare asset node item
        rareImage = new Image();
        rareImage.src = rarePath;
        rareImage.onload = () => loadedImageCount++;
        rareImage.onerror = () => console.error(`Failed loading rare layout path: ${rarePath}`);

        let animationFrameId: number;
        const petalsArray: any[] = [];
        const maxPetals = 30; 

        // --- VIEWPORT & RESOLUTION TRACKING ---
        let logicalWidth = window.innerWidth;
        let logicalHeight = window.innerHeight;

        const resizeCanvas = () => {
            logicalWidth = window.innerWidth;
            logicalHeight = window.innerHeight;
            const dpr = window.devicePixelRatio || 1;
            
            canvas.width = logicalWidth * dpr;
            canvas.height = logicalHeight * dpr;
            canvas.style.width = `${logicalWidth}px`;
            canvas.style.height = `${logicalHeight}px`;
            
            ctx.scale(dpr, dpr);
        };
        
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        class Petal {
            x!: number; y!: number; w!: number; h!: number;
            opacity!: number; speedY!: number; speedX!: number;
            angle!: number; spinSpeed!: number; flipSpeed!: number; flip!: number;
            image!: HTMLImageElement;

            constructor() {
                this.init(true);
            }

            init(isFirstLoad = false) {
                
                if (Math.random() < rareProbability && rareImage) {
                    this.image = rareImage;
                } else {
                    this.image = regularImages[Math.floor(Math.random() * regularImages.length)];
                }
                
                this.x = Math.random() * logicalWidth;
                this.y = isFirstLoad ? Math.random() * logicalHeight : -50; 
                
                const depth = Math.random() * 0.6 + 0.4;
                this.w = 20 * depth; 
                this.h = 24 * depth; 
                
                this.opacity = depth; 
                this.speedY = (Math.random() * 2 + 1.5) * depth;
                this.speedX = Math.random() * 1.2 - 0.2;
                
                this.angle = Math.random() * Math.PI * 2;
                this.spinSpeed = Math.random() * 0.01 - 0.005;
                this.flipSpeed = Math.random() * 0.02 + 0.005;
                this.flip = Math.random() * Math.PI;
            }

            draw() {
                if (!ctx || !this.image.complete) return;
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.angle);
                ctx.scale(Math.sin(this.flip), 1);
                ctx.globalAlpha = this.opacity;
                ctx.drawImage(this.image, -this.w / 2, -this.h / 2, this.w, this.h);
                ctx.restore();
            }

            update() {
                this.y += this.speedY;
                this.x += this.speedX + Math.sin(this.y * 0.01 + this.angle) * 0.5;
                this.angle += this.spinSpeed;
                this.flip += this.flipSpeed;

                if (this.y > logicalHeight + this.h || this.x > logicalWidth + this.w || this.x < -this.w) {
                    this.init();
                }
            }
        }

        // Loop checks if loading thresholds have completed smoothly before execution bounds trigger
        const checkAllLoaded = setInterval(() => {
            if (loadedImageCount === totalImagesToLoad) {
                clearInterval(checkAllLoaded);
                
                for (let i = 0; i < maxPetals; i++) {
                    petalsArray.push(new Petal());
                }

                const animate = () => {
                    ctx.clearRect(0, 0, logicalWidth, logicalHeight);
                    for (let i = 0; i < petalsArray.length; i++) {
                        petalsArray[i].update();
                        petalsArray[i].draw();
                    }
                    animationFrameId = requestAnimationFrame(animate);
                };
                animate();
            }
        }, 50);

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            cancelAnimationFrame(animationFrameId);
            clearInterval(checkAllLoaded);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed top-0 left-0 z-[-1] pointer-events-none block"
        />
    );
}