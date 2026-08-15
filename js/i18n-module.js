/**
 * Internationalization Module
 */

import { CONFIG } from './config.js';

const cache = {};
let currentLang = localStorage.getItem(CONFIG.cms.langKey) || CONFIG.defaultLang;

function getNestedValue(obj, path) {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

export async function loadTranslations(lang) {
    if (cache[lang]) return cache[lang];
    try {
        const response = await fetch(`lang/${lang}.json`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        cache[lang] = await response.json();
        return cache[lang];
    } catch (e) {
        console.error(`[i18n] Failed to load ${lang}:`, e);
        if (lang !== CONFIG.defaultLang) {
            return loadTranslations(CONFIG.defaultLang);
        }
        return {};
    }
}

export async function setLanguage(lang) {
    if (!CONFIG.languages.includes(lang)) lang = CONFIG.defaultLang;

    const data = await loadTranslations(lang);
    if (!data || Object.keys(data).length === 0) return;

    currentLang = lang;
    localStorage.setItem(CONFIG.cms.langKey, lang);
    document.documentElement.lang = lang;

    // Update buttons
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === lang);
    });

    // Update all i18n elements (skip CMS panel)
    document.querySelectorAll('[data-i18n]').forEach(el => {
        if (el.closest('.cms-panel')) return;
        const key = el.dataset.i18n;
        const t = getNestedValue(data, key) || getNestedValue(cache[CONFIG.defaultLang], key) || key;

        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            el.value = t;
        } else {
            el.textContent = t;
        }
    });

    // Dispatch event for other modules
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang, data } }));
}

export function getCurrentLang() {
    return currentLang;
}

export function getTranslation(key, lang = currentLang) {
    const data = cache[lang] || cache[CONFIG.defaultLang] || {};
    return getNestedValue(data, key) || getNestedValue(cache[CONFIG.defaultLang], key) || key;
}

export function initLanguageSwitcher() {
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', () => setLanguage(btn.dataset.lang));
    });
}
