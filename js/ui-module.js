/**
 * UI Module
 * FAQ accordion, smooth scroll, nav scroll effect, typing animation.
 */

import { CONFIG } from './config.js';

// ─── FAQ ───────────────────────────────────────────────────────────────
export function initFaq() {
    document.querySelectorAll('.faq-question').forEach(q => {
        q.addEventListener('click', () => {
            const item = q.parentElement;
            const isOpen = item.classList.contains('open');
            document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
            if (!isOpen) item.classList.add('open');
        });
    });
}

// ─── Smooth Scroll ───────────────────────────────────────────────────
export function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

// ─── Nav Scroll Effect ───────────────────────────────────────────────
export function initNavScroll() {
    const nav = document.querySelector('.nav-hud');
    if (!nav) return;
    window.addEventListener('scroll', () => {
        nav.style.background = window.scrollY > 100
            ? 'rgba(5, 5, 8, 0.95)'
            : 'rgba(5, 5, 8, 0.85)';
    });
}

// ─── Typing Effect ───────────────────────────────────────────────────
export function initTypingEffect() {
    window.addEventListener('load', () => {
        const subtitle = document.querySelector('.hero-subtitle');
        if (!subtitle) return;
        const text = subtitle.textContent.trim();
        if (!text) return;

        subtitle.textContent = '';
        subtitle.classList.add('typing-cursor');
        let i = 0;
        const interval = setInterval(() => {
            subtitle.textContent += text[i];
            i++;
            if (i >= text.length) {
                clearInterval(interval);
                subtitle.classList.remove('typing-cursor');
            }
        }, CONFIG.ui.typingSpeed);
    });
}

// ─── CMS Panel Toggle ────────────────────────────────────────────────
export function initCmsPanel() {
    const toggle = document.getElementById('cmsToggle');
    const overlay = document.getElementById('cmsOverlay');
    const loginPanel = document.getElementById('cmsLoginPanel');
    const panel = document.getElementById('cmsPanel');
    const loginClose = document.getElementById('cmsLoginClose');
    const panelClose = document.getElementById('cmsClose');
    const passwordInput = document.getElementById('cmsPassword');
    const loginBtn = document.getElementById('cmsLoginBtn');
    const loginError = document.getElementById('cmsLoginError');

    if (!toggle || !overlay) return;

    let isOpen = false;

    function open() {
        isOpen = true;
        overlay.classList.add('open');
        const isAuth = sessionStorage.getItem('tgrp-cms-auth') === 'true';
        if (isAuth && panel) {
            panel.classList.add('open');
        } else if (loginPanel) {
            loginPanel.classList.add('open');
            setTimeout(() => passwordInput?.focus(), 400);
        }
    }

    function close() {
        isOpen = false;
        overlay.classList.remove('open');
        loginPanel?.classList.remove('open');
        panel?.classList.remove('open');
        loginError?.classList.remove('show');
        if (passwordInput) passwordInput.value = '';
    }

    toggle.addEventListener('click', open);
    overlay.addEventListener('click', close);
    loginClose?.addEventListener('click', close);
    panelClose?.addEventListener('click', close);

    return { open, close };
}
