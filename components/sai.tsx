'use client'; 

import React, { useEffect, useRef } from 'react';

export default function SakuraCanvas() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // --- MULTIPLE SAKURA IMAGES ---
        // Add more sakura image paths here. Each petal will randomly select one.
        const sakuraImagePaths = ['/sakura.png', '/sakura2.png'];
        const petalImages: HTMLImageElement[] = [];
        let loadedImageCount = 0;

        // Load all sakura images
        sakuraImagePaths.forEach((path) => {
            const img = new Image();
            img.src = path;
            img.onload = () => {
                loadedImageCount++;
            };
            img.onerror = () => {
                console.error(`Failed to load image: ${path}`);
            };
            petalImages.push(img);
        });

        let animationFrameId: number;
        const petalsArray: any[] = [];
        const maxPetals = 30; 

        // --- 1. VIEWPORT TRACKING ---
        // We track the logical size of the window separately from the physical canvas pixels
        let logicalWidth = window.innerWidth;
        let logicalHeight = window.innerHeight;

        // --- 2. HIGH-DPI RESOLUTION SCALING ---
        const resizeCanvas = () => {
            logicalWidth = window.innerWidth;
            logicalHeight = window.innerHeight;
            
            // Get the display's pixel density (Retina screens = 2 or 3)
            const dpr = window.devicePixelRatio || 1;
            
            // Set the massive internal rendering resolution (for crisp image quality)
            canvas.width = logicalWidth * dpr;
            canvas.height = logicalHeight * dpr;
            
            // Lock the visual CSS size to match the exact browser window
            canvas.style.width = `${logicalWidth}px`;
            canvas.style.height = `${logicalHeight}px`;
            
            // Normalize the coordinate system so our falling math works consistently
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
                // Randomly select one of the sakura images
                this.image = petalImages[Math.floor(Math.random() * petalImages.length)];
                
                // Spawn based on the dynamically updating logical boundaries
                this.x = Math.random() * logicalWidth;
                this.y = isFirstLoad ? Math.random() * logicalHeight : -50; 
                
                const depth = Math.random() * 0.6 + 0.4;
                
                // --- IMAGE ASSET SIZING ---
                // If you want the physical size of the petals to be larger or smaller
                // adjust the '20' (width) and '24' (height) multipliers here.
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

                // --- 3. DYNAMIC BOUNDARY CHECK ---
                // Prevents petals from getting permanently stranded off-screen when shrinking the window
                if (this.y > logicalHeight + this.h || this.x > logicalWidth + this.w || this.x < -this.w) {
                    this.init();
                }
            }
        }

        // Wait for all images to load, then start animation
        const checkAllLoaded = setInterval(() => {
            if (loadedImageCount === petalImages.length && petalImages.length > 0) {
                clearInterval(checkAllLoaded);
                
                for (let i = 0; i < maxPetals; i++) {
                    petalsArray.push(new Petal());
                }

                const animate = () => {
                    // Clear using the precise logical dimensions
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
            // Note: Tailwind width/height classes are removed here because we 
            // inject precise CSS dimensions directly in the resizeCanvas function.
        />
    );
}