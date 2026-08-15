/**
 * Firebase Module
 * Handles initialization, connection status, CRUD with error handling,
 * and automatic fallback to localStorage.
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getDatabase, ref, get, set, onValue, off } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js';
import { CONFIG } from './config.js';

// ─── State ───────────────────────────────────────────────────────────
let app = null;
let db = null;
let cmsRef = null;
let isConnected = false;
let connectionChecked = false;
let listeners = [];

// ─── Status UI helpers ───────────────────────────────────────────────
function setStatus(type, message) {
    const el = document.getElementById('firebase-status');
    if (!el) return;
    el.className = `firebase-status ${type}`;
    el.textContent = message;
    el.style.opacity = '1';
}

function hideStatus(delay = 3000) {
    const el = document.getElementById('firebase-status');
    if (!el) return;
    setTimeout(() => { el.style.opacity = '0'; }, delay);
}

// ─── Initialization ──────────────────────────────────────────────────
export function initFirebase() {
    try {
        app = initializeApp(CONFIG.firebase);
        db = getDatabase(app);
        cmsRef = ref(db, CONFIG.cms.dbPath);

        // Listen for connection state
        const connectedRef = ref(db, '.info/connected');
        onValue(connectedRef, (snap) => {
            isConnected = snap.val() === true;
            connectionChecked = true;
            if (isConnected) {
                setStatus('ok', 'Firebase: Connected');
                hideStatus(2000);
            } else {
                setStatus('warn', 'Firebase: Offline — using localStorage');
            }
        });

        return true;
    } catch (err) {
        console.error('[Firebase] Init failed:', err);
        isConnected = false;
        connectionChecked = true;
        setStatus('error', 'Firebase: Init failed — using localStorage');
        return false;
    }
}

export function isFirebaseReady() {
    return isConnected && db !== null && cmsRef !== null;
}

export function hasConnectionBeenChecked() {
    return connectionChecked;
}

// ─── Read ────────────────────────────────────────────────────────────
export async function loadFromServer() {
    if (!isFirebaseReady()) {
        console.warn('[Firebase] Not connected, skipping server load');
        return null;
    }
    try {
        const snapshot = await get(cmsRef);
        if (snapshot.exists()) {
            const data = snapshot.val();
            console.log('[Firebase] Data loaded from server:', Object.keys(data).length, 'keys');
            return data;
        }
        console.log('[Firebase] No data on server');
        return {};
    } catch (err) {
        console.error('[Firebase] Load error:', err.code, err.message);
        setStatus('error', `Firebase read error: ${err.code || err.message}`);
        return null;
    }
}

// ─── Write ───────────────────────────────────────────────────────────
export async function saveToServer(data) {
    if (!isFirebaseReady()) {
        console.warn('[Firebase] Not connected, skipping server save');
        return false;
    }
    try {
        await set(cmsRef, data);
        console.log('[Firebase] Data saved to server');
        setStatus('ok', 'Firebase: Saved');
        hideStatus(2000);
        return true;
    } catch (err) {
        console.error('[Firebase] Save error:', err.code, err.message);
        setStatus('error', `Firebase write error: ${err.code || err.message}. Check Database Rules!`);
        return false;
    }
}

// ─── Realtime sync (optional) ────────────────────────────────────────
export function subscribeToChanges(callback) {
    if (!isFirebaseReady()) return;
    const unsub = onValue(cmsRef, (snap) => {
        if (snap.exists()) callback(snap.val());
    });
    listeners.push({ ref: cmsRef, unsub });
}

export function unsubscribeAll() {
    listeners.forEach(({ ref: r, unsub }) => off(r, 'value', unsub));
    listeners = [];
}

// ─── Test connection ─────────────────────────────────────────────────
export async function testConnection() {
    if (!isFirebaseReady()) return false;
    try {
        const testRef = ref(db, '.info/connected');
        await get(testRef);
        return true;
    } catch {
        return false;
    }
}
