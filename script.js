// ===== FIREBASE CONFIG =====
const firebaseConfig = {
    apiKey: 'AIzaSyB8jARNZNyekakuZ3i-gNez9q7oXTNskzs',
    databaseURL: 'https://galaxy-ring-project-default-rtdb.europe-west1.firebasedatabase.app'
};
const FIREBASE_ENABLED = !firebaseConfig.apiKey.includes('ВАШ') && !firebaseConfig.databaseURL.includes('ВАШ');

// ===== FIREBASE INIT =====
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getDatabase, ref, get, set } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js';

const app = initializeApp(firebaseConfig);
const db  = getDatabase(app);
const cmsRef = ref(db, 'cms');

// ===== I18N =====
let currentLang = localStorage.getItem('tgrp-lang') || 'en';
let i18nData = {};

async function loadTranslations(lang) {
    try {
        const response = await fetch(`${lang}.json`);
        if (!response.ok) throw new Error('Failed to load translations');
        i18nData[lang] = await response.json();
    } catch (e) {
        console.error('Error loading translations:', e);
        if (lang !== 'en') {
            await loadTranslations('en');
        }
    }
}

function getNestedValue(obj, path) {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

async function setLanguage(lang) {
    if (!i18nData[lang]) {
        await loadTranslations(lang);
    }
    currentLang = lang;
    localStorage.setItem('tgrp-lang', lang);

    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === lang);
    });

    const langData = i18nData[lang] || i18nData['en'] || {};

    document.querySelectorAll('[data-i18n]').forEach(el => {
        if (el.closest('.cms-panel')) return;

        const key = el.dataset.i18n;
        const t = getNestedValue(langData, key) || getNestedValue(i18nData['en'], key) || key;

        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            el.value = t;
        } else {
            el.textContent = t;
        }
    });

    document.documentElement.lang = lang;
}

document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => setLanguage(btn.dataset.lang));
});

// ===== STARFIELD =====
const canvas = document.getElementById('starfield');
const ctx = canvas.getContext('2d');
let stars = [];
const STAR_COUNT = 800;
const STAR_SPEED = 0.2;

function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }

class Star {
    constructor() { this.reset(); }
    reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.z = Math.random() * 2 + 0.5;
        this.size = Math.random() * 1.5 + 0.3;
        this.opacity = Math.random() * 0.8 + 0.2;
        this.twinkleSpeed = Math.random() * 0.02 + 0.005;
        this.twinklePhase = Math.random() * Math.PI * 2;
    }
    update() {
        this.y -= STAR_SPEED * this.z;
        this.twinklePhase += this.twinkleSpeed;
        if (this.y < 0) { this.y = canvas.height; this.x = Math.random() * canvas.width; }
    }
    draw() {
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

function initStars() { stars = []; for (let i = 0; i < STAR_COUNT; i++) stars.push(new Star()); }
function animateStars() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    stars.forEach(s => { s.update(); s.draw(); });
    requestAnimationFrame(animateStars);
}
resizeCanvas(); initStars(); animateStars();
window.addEventListener('resize', () => { resizeCanvas(); initStars(); });

// ===== FAQ =====
document.querySelectorAll('.faq-question').forEach(q => {
    q.addEventListener('click', () => {
        const item = q.parentElement;
        const isOpen = item.classList.contains('open');
        document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
        if (!isOpen) item.classList.add('open');
    });
});

// ===== CMS PASSWORD =====
const CMS_PASSWORD = '6103365';
const cmsToggle = document.getElementById('cmsToggle');
const cmsOverlay = document.getElementById('cmsOverlay');
const cmsLoginPanel = document.getElementById('cmsLoginPanel');
const cmsLoginClose = document.getElementById('cmsLoginClose');
const cmsLoginBtn = document.getElementById('cmsLoginBtn');
const cmsPassword = document.getElementById('cmsPassword');
const cmsLoginError = document.getElementById('cmsLoginError');
const cmsPanel = document.getElementById('cmsPanel');
const cmsClose = document.getElementById('cmsClose');
const cmsSave = document.getElementById('cmsSave');
const cmsReset = document.getElementById('cmsReset');
const cmsExport = document.getElementById('cmsExport');
const cmsSyncRaven = document.getElementById('cmsSyncRaven');

let cmsOpen = false;
let cmsAuthenticated = sessionStorage.getItem('tgrp-cms-auth') === 'true';

function openCms() {
    cmsOpen = true;
    cmsOverlay.classList.add('open');
    if (cmsAuthenticated) {
        cmsPanel.classList.add('open');
    } else {
        cmsLoginPanel.classList.add('open');
        setTimeout(() => cmsPassword.focus(), 400);
    }
}

function closeCms() {
    cmsOpen = false;
    cmsOverlay.classList.remove('open');
    cmsLoginPanel.classList.remove('open');
    cmsPanel.classList.remove('open');
    cmsLoginError.classList.remove('show');
    cmsPassword.value = '';
}

function authenticate() {
    if (cmsPassword.value === CMS_PASSWORD) {
        cmsAuthenticated = true;
        sessionStorage.setItem('tgrp-cms-auth', 'true');
        cmsLoginPanel.classList.remove('open');
        cmsLoginError.classList.remove('show');
        cmsPanel.classList.add('open');
    } else {
        cmsLoginError.classList.add('show');
        cmsPassword.value = '';
        cmsPassword.focus();
    }
}

cmsToggle.addEventListener('click', openCms);
cmsLoginClose.addEventListener('click', closeCms);
cmsClose.addEventListener('click', closeCms);
cmsOverlay.addEventListener('click', closeCms);
cmsLoginBtn.addEventListener('click', authenticate);
cmsPassword.addEventListener('keydown', e => { if (e.key === 'Enter') authenticate(); });

// ===== RAVEN COLONIAL SYNC =====
const RAVEN_API_BASE = 'https://ravencolonial100-awcbdvabgze4c5cq.canadacentral-01.azurewebsites.net';

async function fetchSystemProjects(systemName) {
    const response = await fetch(`${RAVEN_API_BASE}/api/System/${encodeURIComponent(systemName)}/all`);
    if (!response.ok) return null;
    return await response.json();
}

async function fetchProjectStats(buildId) {
    const response = await fetch(`${RAVEN_API_BASE}/api/project/${buildId}/stats`);
    if (!response.ok) return null;
    return await response.json();
}

async function syncRavenColonial() {
    if (!cmsSyncRaven) return;
    cmsSyncRaven.textContent = 'Syncing...';
    cmsSyncRaven.style.borderColor = 'var(--ed-yellow)';

    for (let i = 1; i <= 18; i++) {
        const ravenInput = document.querySelector(`.cms-panel [data-cms-key="route.r${i}.raven"]`);
        if (!ravenInput || !ravenInput.value.trim()) continue;

        let systemName = ravenInput.value.trim();
        const sysMatch = systemName.match(/#sys=([^&]+)/);
        if (sysMatch) systemName = decodeURIComponent(sysMatch[1]);
        systemName = systemName.replace(/\/$/, '');

        try {
            const projects = await fetchSystemProjects(systemName);
            if (!Array.isArray(projects) || projects.length === 0) continue;

            let totalNeeded = 0;
            let totalCompleted = 0;
            let allComplete = true;

            for (const project of projects) {
                if (project.complete) {
                    totalCompleted += project.maxNeed || 0;
                    totalNeeded += project.maxNeed || 0;
                } else {
                    allComplete = false;
                    totalNeeded += project.maxNeed || 0;
                    try {
                        const stats = await fetchProjectStats(project.buildId);
                        if (stats) {
                            totalCompleted += stats.totalCargo || 0;
                        }
                    } catch (e) {
                        // ignore
                    }
                }
            }

            const progressPercent = totalNeeded > 0 ? Math.round((totalCompleted / totalNeeded) * 100) : 0;
            const progressStr = progressPercent + '%';

            const progressValInput = document.querySelector(`.cms-panel [data-cms-key="route.r${i}.progressVal"]`);
            const statusSelect = document.querySelector(`.cms-panel [data-cms-key="route.r${i}.status"]`);

            if (progressValInput) progressValInput.value = progressStr;

            if (statusSelect) {
                if (allComplete && projects.length > 0) {
                    statusSelect.value = 'completed';
                } else if (progressPercent > 0) {
                    statusSelect.value = 'active';
                }
            }

            const bar = document.querySelector(`#route [data-cms-key="route.r${i}.progress"]`);
            if (bar) bar.style.width = progressStr;

            const valDisplay = document.querySelector(`#route [data-cms-key="route.r${i}.progressVal"]`);
            if (valDisplay) valDisplay.textContent = progressStr;

            if (statusSelect) {
                applyRouteStatus(i, statusSelect.value);
            }

        } catch (e) {
            console.error(`Failed to sync route ${i}:`, e);
        }
    }

    cmsSyncRaven.textContent = 'Synced!';
    cmsSyncRaven.style.borderColor = 'var(--ed-green)';
    setTimeout(() => {
        cmsSyncRaven.textContent = 'Sync from Raven Colonial';
        cmsSyncRaven.style.borderColor = 'var(--ed-cyan)';
    }, 2000);
}

if (cmsSyncRaven) {
    cmsSyncRaven.addEventListener('click', syncRavenColonial);
}

// ===== FIREBASE LOAD / SAVE =====

async function loadFromServer() {
    if (!FIREBASE_ENABLED) return null;
    try {
        const snapshot = await get(cmsRef);
        if (snapshot.exists()) {
            return snapshot.val();
        }
        return null;
    } catch (e) {
        console.error('Firebase load error:', e);
        return null;
    }
}

async function saveToServer(data) {
    if (!FIREBASE_ENABLED) return false;
    try {
        await set(cmsRef, data);
        return true;
    } catch (e) {
        console.error('Firebase save error:', e);
        return false;
    }
}

// ===== CMS APPLY DATA =====

function applyRouteStatus(routeIndex, status) {
    const routeItems = document.querySelectorAll('#route .route-item');
    if (!routeItems[routeIndex - 1]) return;
    const item = routeItems[routeIndex - 1];
    const statusEl = item.querySelector('.route-status');

    item.classList.remove('active', 'completed', 'planned');
    statusEl.classList.remove('active', 'completed', 'planned');

    item.classList.add(status);
    statusEl.classList.add(status);

    const langData = i18nData[currentLang] || i18nData['en'] || {};
    const statusKey = `route.status.${status}`;
    const statusText = getNestedValue(langData, statusKey) || (status === 'active' ? 'ACTIVE' : status === 'completed' ? 'COMPLETED' : 'PLANNED');
    statusEl.textContent = statusText;
}

function applyLink(key, url) {
    const linkEl = document.querySelector(`[data-cms-key="${key}"]`);
    if (linkEl && linkEl.tagName === 'A') {
        linkEl.href = url;
    }
}

function applyCmsData(data) {
    if (!data || Object.keys(data).length === 0) return;

    // Text inputs (data-cms-input)
    Object.keys(data).forEach(key => {
        const input = document.querySelector(`[data-cms-input="${key}"]`);
        if (input) input.value = data[key];
        const displayEl = document.querySelector(`[data-i18n="${key}"]`);
        if (displayEl && !displayEl.closest('.cms-panel')) {
            if (displayEl.tagName === 'INPUT' || displayEl.tagName === 'TEXTAREA') displayEl.value = data[key];
            else displayEl.textContent = data[key];
        }
    });

    // Stats, progress values, statuses, links (data-cms-key)
    Object.keys(data).forEach(key => {
        const el = document.querySelector(`[data-cms-key="${key}"]`);
        if (el && !el.closest('.cms-panel')) {
            if (el.tagName === 'A') {
                el.href = data[key];
            } else {
                el.textContent = data[key];
            }
        }
        const cmsEl = document.querySelector(`.cms-panel [data-cms-key="${key}"]`);
        if (cmsEl) {
            cmsEl.value = data[key];
        }
    });

    // Sync progress bar widths
    for (let i = 1; i <= 18; i++) {
        const valKey = `route.r${i}.progressVal`;
        const barKey = `route.r${i}.progress`;
        const bar = document.querySelector(`[data-cms-key="${barKey}"]`);
        if (bar && data[valKey]) {
            bar.style.width = data[valKey];
        }
    }

    // Apply route statuses
    for (let i = 1; i <= 18; i++) {
        const statusKey = `route.r${i}.status`;
        if (data[statusKey]) {
            applyRouteStatus(i, data[statusKey]);
        }
    }

    // Apply external links
    ['link.discord', 'link.edsm', 'link.inara'].forEach(linkKey => {
        if (data[linkKey]) applyLink(linkKey, data[linkKey]);
    });

    // Apply Raven Colonial links
    for (let i = 1; i <= 18; i++) {
        const ravenKey = `route.r${i}.raven`;
        if (data[ravenKey]) {
            const el = document.querySelector(`[data-cms-key="${ravenKey}"]`);
            if (el && el.classList.contains('raven-link')) {
                el.href = data[ravenKey];
            }
        }
    }
}

// ===== CMS LOAD =====

async function loadCmsData() {
    let data = null;

    // 1. Try Firebase first
    if (FIREBASE_ENABLED) {
        data = await loadFromServer();
    }

    // 2. Fallback to localStorage
    if (!data) {
        const saved = localStorage.getItem('tgrp-cms-data');
        if (saved) {
            try { data = JSON.parse(saved); } catch (e) {}
        }
    }

    if (data) {
        applyCmsData(data);
    }
}

// ===== CMS SAVE =====

cmsSave.addEventListener('click', async () => {
    const data = {};

    // Collect data-cms-input fields
    document.querySelectorAll('[data-cms-input]').forEach(input => {
        data[input.dataset.cmsInput] = input.value;
    });

    // Collect data-cms-key fields
    document.querySelectorAll('.cms-panel [data-cms-key]').forEach(input => {
        data[input.dataset.cmsKey] = input.value;
    });

    // Apply to page immediately
    applyCmsData(data);

    // Save to localStorage (always, as fallback)
    localStorage.setItem('tgrp-cms-data', JSON.stringify(data));

    // Save to Firebase
    let serverOk = false;
    if (FIREBASE_ENABLED) {
        serverOk = await saveToServer(data);
    }

    // Visual feedback
    cmsSave.textContent = serverOk ? 'SAVED!' : (FIREBASE_ENABLED ? 'SAVED (local)' : 'SAVED!');
    cmsSave.style.borderColor = 'var(--ed-green)';
    setTimeout(() => {
        cmsSave.textContent = 'Save Changes';
        cmsSave.style.borderColor = '';
    }, 1500);
});

cmsReset.addEventListener('click', async () => {
    if (confirm('Reset all content to default? This cannot be undone.')) {
        localStorage.removeItem('tgrp-cms-data');
        if (FIREBASE_ENABLED) {
            await saveToServer({});
        }
        location.reload();
    }
});

cmsExport.addEventListener('click', () => {
    const data = localStorage.getItem('tgrp-cms-data') || '{}';
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'galaxy-ring-content.json'; a.click();
    URL.revokeObjectURL(url);
});

// ===== SMOOTH SCROLL =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});

// ===== NAV SCROLL =====
window.addEventListener('scroll', () => {
    const nav = document.querySelector('.nav-hud');
    nav.style.background = window.scrollY > 100 ? 'rgba(5, 5, 8, 0.95)' : 'rgba(5, 5, 8, 0.85)';
});

// ===== INIT =====
async function init() {
    await loadTranslations(currentLang);
    await setLanguage(currentLang);
    await loadCmsData();
}

init();

window.addEventListener('load', () => {
    const subtitle = document.querySelector('.hero-subtitle');
    if (subtitle) {
        const text = subtitle.textContent;
        subtitle.textContent = '';
        subtitle.classList.add('typing-cursor');
        let i = 0;
        const interval = setInterval(() => {
            subtitle.textContent += text[i]; i++;
            if (i >= text.length) { clearInterval(interval); subtitle.classList.remove('typing-cursor'); }
        }, 30);
    }
});