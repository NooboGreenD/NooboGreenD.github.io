/**
 * CMS Module
 * Content management: auth, load/save, Raven sync, DOM apply.
 */

import { CONFIG, ROUTE_COUNT } from './config.js';
import { isFirebaseReady, loadFromServer, saveToServer } from './firebase-module.js';
import { getCurrentLang, getTranslation } from './i18n-module.js';

// ─── DOM refs (lazy) ───────────────────────────────────────────────────
function getEl(id) { return document.getElementById(id); }

// ─── Auth ──────────────────────────────────────────────────────────────
let cmsAuthenticated = sessionStorage.getItem(CONFIG.cms.authKey) === 'true';

export function isCmsAuthenticated() {
    return cmsAuthenticated;
}

export function authenticate(password) {
    if (password === CONFIG.cms.password) {
        cmsAuthenticated = true;
        sessionStorage.setItem(CONFIG.cms.authKey, 'true');
        return true;
    }
    return false;
}

export function logout() {
    cmsAuthenticated = false;
    sessionStorage.removeItem(CONFIG.cms.authKey);
}

// ─── Data collection ───────────────────────────────────────────────────
export function collectCmsData() {
    const data = {};

    // data-cms-input (text content keys)
    document.querySelectorAll('[data-cms-input]').forEach(el => {
        data[el.dataset.cmsInput] = el.value;
    });

    // data-cms-key (page state keys: stats, progress, status, links)
    document.querySelectorAll('.cms-panel [data-cms-key]').forEach(el => {
        data[el.dataset.cmsKey] = el.value;
    });

    return data;
}

// ─── Apply data to page DOM ──────────────────────────────────────────
export function applyCmsData(data) {
    if (!data || Object.keys(data).length === 0) return;

    // 1. Text content (data-i18n override)
    Object.keys(data).forEach(key => {
        const input = document.querySelector(`[data-cms-input="${key}"]`);
        if (input) input.value = data[key];

        const displayEl = document.querySelector(`[data-i18n="${key}"]`);
        if (displayEl && !displayEl.closest('.cms-panel')) {
            if (displayEl.tagName === 'INPUT' || displayEl.tagName === 'TEXTAREA') {
                displayEl.value = data[key];
            } else {
                displayEl.textContent = data[key];
            }
        }
    });

    // 2. State values (data-cms-key)
    Object.keys(data).forEach(key => {
        const el = document.querySelector(`[data-cms-key="${key}"]`);
        if (el && !el.closest('.cms-panel')) {
            if (el.tagName === 'A') {
                el.href = data[key] || '#';
            } else {
                el.textContent = data[key];
            }
        }
        const cmsEl = document.querySelector(`.cms-panel [data-cms-key="${key}"]`);
        if (cmsEl) cmsEl.value = data[key];
    });

    // 3. Progress bars
    for (let i = 1; i <= ROUTE_COUNT; i++) {
        const valKey = `route.r${i}.progressVal`;
        const barKey = `route.r${i}.progress`;
        const bar = document.querySelector(`[data-cms-key="${barKey}"]`);
        if (bar && data[valKey]) {
            bar.style.width = data[valKey];
        }
    }

    // 4. Route statuses
    for (let i = 1; i <= ROUTE_COUNT; i++) {
        const statusKey = `route.r${i}.status`;
        if (data[statusKey]) {
            applyRouteStatus(i, data[statusKey]);
        }
    }

    // 5. External links
    ['link.discord', 'link.edsm', 'link.inara'].forEach(linkKey => {
        if (data[linkKey]) {
            const el = document.querySelector(`[data-cms-key="${linkKey}"]`);
            if (el && el.tagName === 'A') el.href = data[linkKey];
        }
    });

    // 6. Raven Colonial links
    for (let i = 1; i <= ROUTE_COUNT; i++) {
        const ravenKey = `route.r${i}.raven`;
        if (data[ravenKey]) {
            const el = document.querySelector(`[data-cms-key="${ravenKey}"]`);
            if (el && el.classList.contains('raven-link')) {
                el.href = data[ravenKey];
            }
        }
    }
}

function applyRouteStatus(routeIndex, status) {
    const routeItems = document.querySelectorAll('#route .route-item');
    const item = routeItems[routeIndex - 1];
    if (!item) return;

    const statusEl = item.querySelector('.route-status');
    if (!statusEl) return;

    item.classList.remove('active', 'completed', 'planned');
    statusEl.classList.remove('active', 'completed', 'planned');

    item.classList.add(status);
    statusEl.classList.add(status);

    const statusText = getTranslation(`route.status.${status}`) ||
        (status === 'active' ? 'ACTIVE' : status === 'completed' ? 'COMPLETED' : 'PLANNED');
    statusEl.textContent = statusText;
}

// ─── Persistence ─────────────────────────────────────────────────────
export async function loadCmsData() {
    let data = null;
    let source = '';

    // 1. Try Firebase first
    if (isFirebaseReady()) {
        data = await loadFromServer();
        if (data !== null) {
            source = 'firebase';
            // Mirror to localStorage for offline fallback
            localStorage.setItem(CONFIG.cms.storageKey, JSON.stringify(data));
        }
    }

    // 2. Fallback to localStorage
    if (!data) {
        const saved = localStorage.getItem(CONFIG.cms.storageKey);
        if (saved) {
            try {
                data = JSON.parse(saved);
                source = 'localStorage';
            } catch (e) {
                console.error('[CMS] localStorage parse error:', e);
            }
        }
    }

    if (data) {
        applyCmsData(data);
        console.log(`[CMS] Loaded from ${source}`, Object.keys(data).length, 'keys');
    }
    return data;
}

export async function saveCmsData(data) {
    if (!data) data = collectCmsData();

    // Always save to localStorage
    localStorage.setItem(CONFIG.cms.storageKey, JSON.stringify(data));

    // Try Firebase
    let serverOk = false;
    if (isFirebaseReady()) {
        serverOk = await saveToServer(data);
    }

    // Apply to page
    applyCmsData(data);

    return { local: true, server: serverOk };
}

export function resetCmsData() {
    localStorage.removeItem(CONFIG.cms.storageKey);
    if (isFirebaseReady()) {
        saveToServer({});
    }
    location.reload();
}

export function exportCmsData() {
    const data = localStorage.getItem(CONFIG.cms.storageKey) || '{}';
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'galaxy-ring-content.json';
    a.click();
    URL.revokeObjectURL(url);
}

// ─── Raven Colonial Sync ─────────────────────────────────────────────
async function fetchSystemProjects(systemName) {
    const url = `${CONFIG.raven.baseUrl}/api/System/${encodeURIComponent(systemName)}/all`;
    const response = await fetch(url);
    if (!response.ok) return null;
    return response.json();
}

async function fetchProjectStats(buildId) {
    const url = `${CONFIG.raven.baseUrl}/api/project/${buildId}/stats`;
    const response = await fetch(url);
    if (!response.ok) return null;
    return response.json();
}

export async function syncRavenColonial(onProgress) {
    const results = [];

    for (let i = 1; i <= ROUTE_COUNT; i++) {
        const ravenInput = document.querySelector(`.cms-panel [data-cms-key="route.r${i}.raven"]`);
        if (!ravenInput || !ravenInput.value.trim()) continue;

        let systemName = ravenInput.value.trim();
        const sysMatch = systemName.match(/#sys=([^&]+)/);
        if (sysMatch) systemName = decodeURIComponent(sysMatch[1]);
        systemName = systemName.replace(/\/$/, '');

        try {
            const projects = await fetchSystemProjects(systemName);
            if (!Array.isArray(projects) || projects.length === 0) {
                results.push({ route: i, status: 'skipped', reason: 'no projects' });
                continue;
            }

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
                        if (stats) totalCompleted += stats.totalCargo || 0;
                    } catch (e) { /* ignore */ }
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

            results.push({ route: i, status: 'synced', progress: progressStr, allComplete });

        } catch (e) {
            console.error(`[CMS] Failed to sync route ${i}:`, e);
            results.push({ route: i, status: 'error', error: e.message });
        }

        if (onProgress) onProgress(i, ROUTE_COUNT);
    }

    return results;
}
