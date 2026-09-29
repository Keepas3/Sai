'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

// Second, much rarer easter egg — independent of the canvas petal system
// below. It can't be drawn as another falling petal: the canvas is
// `pointer-events-none` and sits behind all page content, so a canvas
// sprite can't be reliably clicked without fragile hit-testing (and risks
// swallowing clicks meant for the rest of the site if pointer-events were
// enabled on the whole canvas). Instead this renders a real DOM <Link>/
// <img> that fades in at a random spot every so often — only present in
// the DOM while visible, so it never intercepts clicks otherwise.
const SANDWICH_CAT_CHECK_INTERVAL_MS = 7_000;
const SANDWICH_CAT_PROBABILITY = 0.025;
const SANDWICH_CAT_VISIBLE_MS = 7_000;
const SANDWICH_CAT_SIZE_PX = 19; // ~70% smaller than the original 64px

// Picks a spot hugging one of the four screen edges (vw/vh %) — never
// anywhere near the center — so the sandwich cat stays a peripheral find
// rather than something planted in the middle of whatever you're reading.
const EDGE_MARGIN = 8; // vw/vh % — how close to the true edge it can land
const EDGE_BAND = 14; // vw/vh % — how deep the "hugging the edge" band is
function getRandomEdgePosition() {
    const side = Math.floor(Math.random() * 4); // 0: left, 1: right, 2: top, 3: bottom
    const along = EDGE_MARGIN + Math.random() * (100 - EDGE_MARGIN * 2);
    const near = EDGE_MARGIN + Math.random() * (EDGE_BAND - EDGE_MARGIN);

    switch (side) {
        case 0: return { x: near, y: along };
        case 1: return { x: 100 - near, y: along };
        case 2: return { x: along, y: near };
        default: return { x: along, y: 100 - near };
    }
}

export default function SakuraCanvas() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [sandwichCatPos, setSandwichCatPos] = useState<{ x: number; y: number } | null>(null);
    const [sandwichCatFadeIn, setSandwichCatFadeIn] = useState(false);

    useEffect(() => {
        const rollForSandwichCat = setInterval(() => {
            setSandwichCatPos((current) => {
                if (current) return current; // already showing — don't restart it
                if (Math.random() >= SANDWICH_CAT_PROBABILITY) return current;
                return getRandomEdgePosition();
            });
        }, SANDWICH_CAT_CHECK_INTERVAL_MS);

        return () => clearInterval(rollForSandwichCat);
    }, []);

    useEffect(() => {
        if (!sandwichCatPos) return;

        setSandwichCatFadeIn(false);
        const fadeInId = setTimeout(() => setSandwichCatFadeIn(true), 20);
        const hideId = setTimeout(() => {
            setSandwichCatFadeIn(false);
            setTimeout(() => setSandwichCatPos(null), 500); // let the fade-out finish first
        }, SANDWICH_CAT_VISIBLE_MS);

        return () => {
            clearTimeout(fadeInId);
            clearTimeout(hideId);
        };
    }, [sandwichCatPos]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // --- 1. SAKURA ASSETS & RATIO LAYOUT CONFIGS ---
        const regularPaths = ['/sakura.png', '/sakura2.png'];
        const rarePath = '/reimu.png'; // 
        const rareProbability = 0.03;       // ◄ 0.5 = 50% chance to spawn this asset

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
                this.speedX = Math.random() * 2.5 - 0.2;
                
                this.angle = Math.random() * Math.PI * 2;
                this.spinSpeed = Math.random() * 0.025 - 0.005;
                this.flipSpeed = Math.random() * 0.025 + 0.005;
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
        <>
            <canvas
                ref={canvasRef}
                className="fixed top-0 left-0 z-[-1] pointer-events-none block"
            />
            {sandwichCatPos && (
                <Link
                    href="/sandwich-cat"
                    className="fixed z-1050 transition-opacity duration-500"
                    style={{
                        left: `${sandwichCatPos.x}%`,
                        top: `${sandwichCatPos.y}%`,
                        opacity: sandwichCatFadeIn ? 1 : 0,
                    }}
                    aria-label="A very rare sandwich cat"
                >
                    <img
                        src="/sandwich_cat.png"
                        alt="Sandwich cat"
                        style={{ width: `${SANDWICH_CAT_SIZE_PX}px`, height: 'auto', display: 'block' }}
                    />
                </Link>
            )}
        </>
    );
}