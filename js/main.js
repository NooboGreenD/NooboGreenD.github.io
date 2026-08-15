/**
 * Main Entry Point
 * Orchestrates all modules initialization.
 */

import { CONFIG } from './config.js';
import { initFirebase, isFirebaseReady, hasConnectionBeenChecked } from './firebase-module.js';
import { setLanguage, initLanguageSwitcher, getCurrentLang } from './i18n-module.js';
import { startStarfield } from './starfield.js';
import {
    isCmsAuthenticated,
    authenticate,
    loadCmsData,
    saveCmsData,
    resetCmsData,
    exportCmsData,
    syncRavenColonial,
    collectCmsData,
} from './cms-module.js';
import { initFaq, initSmoothScroll, initNavScroll, initTypingEffect, initCmsPanel } from './ui-module.js';

async function main() {
    // 1. Initialize Firebase first
    initFirebase();

    // 2. Language
    initLanguageSwitcher();
    await setLanguage(getCurrentLang());

    // 3. UI components
    startStarfield();
    initFaq();
    initSmoothScroll();
    initNavScroll();
    initTypingEffect();

    // 4. CMS Panel wiring
    const cmsPanel = initCmsPanel();

    // Wait a bit for Firebase connection check, then load CMS data
    const tryLoadCms = async (attempts = 0) => {
        if (attempts > 10) {
            console.warn('[Main] Firebase connection timeout, loading from localStorage');
            await loadCmsData();
            return;
        }
        if (!hasConnectionBeenChecked()) {
            setTimeout(() => tryLoadCms(attempts + 1), 200);
            return;
        }
        await loadCmsData();
    };
    tryLoadCms();

    // 5. CMS Login
    const loginBtn = document.getElementById('cmsLoginBtn');
    const passwordInput = document.getElementById('cmsPassword');
    const loginError = document.getElementById('cmsLoginError');
    const loginPanel = document.getElementById('cmsLoginPanel');
    const panel = document.getElementById('cmsPanel');

    function doAuth() {
        const ok = authenticate(passwordInput.value);
        if (ok) {
            loginError?.classList.remove('show');
            loginPanel?.classList.remove('open');
            panel?.classList.add('open');
        } else {
            loginError?.classList.add('show');
            if (passwordInput) {
                passwordInput.value = '';
                passwordInput.focus();
            }
        }
    }

    loginBtn?.addEventListener('click', doAuth);
    passwordInput?.addEventListener('keydown', e => {
        if (e.key === 'Enter') doAuth();
    });

    // 6. CMS Save
    const cmsSave = document.getElementById('cmsSave');
    cmsSave?.addEventListener('click', async () => {
        const originalText = cmsSave.textContent;
        cmsSave.textContent = 'Saving...';
        cmsSave.style.borderColor = 'var(--ed-yellow)';

        const result = await saveCmsData();

        if (result.server) {
            cmsSave.textContent = 'SAVED!';
            cmsSave.style.borderColor = 'var(--ed-green)';
        } else if (isFirebaseReady()) {
            cmsSave.textContent = 'SAVED (local)';
            cmsSave.style.borderColor = 'var(--ed-yellow)';
        } else {
            cmsSave.textContent = 'SAVED!';
            cmsSave.style.borderColor = 'var(--ed-green)';
        }

        setTimeout(() => {
            cmsSave.textContent = originalText;
            cmsSave.style.borderColor = '';
        }, 2000);
    });

    // 7. CMS Reset
    const cmsReset = document.getElementById('cmsReset');
    cmsReset?.addEventListener('click', () => {
        if (confirm('Reset all content to default? This cannot be undone.')) {
            resetCmsData();
        }
    });

    // 8. CMS Export
    const cmsExport = document.getElementById('cmsExport');
    cmsExport?.addEventListener('click', exportCmsData);

    // 9. Raven Colonial Sync
    const cmsSyncRaven = document.getElementById('cmsSyncRaven');
    cmsSyncRaven?.addEventListener('click', async () => {
        const originalText = cmsSyncRaven.textContent;
        cmsSyncRaven.textContent = 'Syncing...';
        cmsSyncRaven.style.borderColor = 'var(--ed-yellow)';

        try {
            const results = await syncRavenColonial((current, total) => {
                cmsSyncRaven.textContent = `Syncing ${current}/${total}...`;
            });

            // Apply updated data to page immediately
            const data = collectCmsData();
            await saveCmsData(data);

            const syncedCount = results.filter(r => r.status === 'synced').length;
            cmsSyncRaven.textContent = syncedCount > 0 ? `Synced ${syncedCount} routes!` : 'Nothing to sync';
            cmsSyncRaven.style.borderColor = syncedCount > 0 ? 'var(--ed-green)' : 'var(--ed-cyan)';
        } catch (e) {
            console.error('[Main] Raven sync error:', e);
            cmsSyncRaven.textContent = 'Sync failed';
            cmsSyncRaven.style.borderColor = 'var(--ed-red)';
        }

        setTimeout(() => {
            cmsSyncRaven.textContent = originalText;
            cmsSyncRaven.style.borderColor = 'var(--ed-cyan)';
        }, 3000);
    });
}

main().catch(err => console.error('[Main] Initialization error:', err));
