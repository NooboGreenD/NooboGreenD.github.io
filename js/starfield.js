/**
 * Starfield Canvas Animation
 */

import { CONFIG } from './config.js';

const canvas = document.getElementById('starfield');
if (!canvas) {
    console.warn('[Starfield] Canvas #starfield not found');
}

const ctx = canvas?.getContext('2d');
let stars = [];
let animId = null;
let isRunning = false;

class Star {
    constructor(w, h) {
        this.reset(w, h);
    }
    reset(w, h) {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.z = Math.random() * 2 + 0.5;
        this.size = Math.random() * 1.5 + 0.3;
        this.opacity = Math.random() * 0.8 + 0.2;
        this.twinkleSpeed = Math.random() * 0.02 + 0.005;
        this.twinklePhase = Math.random() * Math.PI * 2;
    }
    update(w, h) {
        this.y -= CONFIG.ui.starSpeed * this.z;
        this.twinklePhase += this.twinkleSpeed;
        if (this.y < 0) {
            this.y = h;
            this.x = Math.random() * w;
        }
    }
    draw(ctx) {
        const twinkle = Math.sin(this.twinklePhase) * 0.3 + 0.7;
        const alpha = this.opacity * twinkle;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * this.z, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 220, 255, ${alpha})`;
        ctx.fill();
        if (this.size > 1 && this.z > 1.5) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * this.z * 3, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 212, 255, ${alpha * 0.15})`;
            ctx.fill();
        }
    }
}

function resize() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initStars();
}

function initStars() {
    if (!canvas) return;
    stars = [];
    for (let i = 0; i < CONFIG.ui.starCount; i++) {
        stars.push(new Star(canvas.width, canvas.height));
    }
}

function animate() {
    if (!isRunning || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    stars.forEach(s => {
        s.update(canvas.width, canvas.height);
        s.draw(ctx);
    });
    animId = requestAnimationFrame(animate);
}

export function startStarfield() {
    if (!canvas || isRunning) return;
    resize();
    isRunning = true;
    animate();
    window.addEventListener('resize', resize);
}

export function stopStarfield() {
    isRunning = false;
    if (animId) cancelAnimationFrame(animId);
    window.removeEventListener('resize', resize);
}
