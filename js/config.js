/**
 * Global configuration and constants
 */

export const CONFIG = {
    // Firebase
    firebase: {
        apiKey: 'AIzaSyB8jARNZNyekakuZ3i-gNez9q7oXTNskzs',
        databaseURL: 'https://galaxy-ring-project-default-rtdb.europe-west1.firebasedatabase.app',
        projectId: 'galaxy-ring-project',
    },

    // CMS
    cms: {
        password: '6103365',
        storageKey: 'tgrp-cms-data-v2',
        authKey: 'tgrp-cms-auth',
        langKey: 'tgrp-lang',
        dbPath: 'cms',
    },

    // Raven Colonial API
    raven: {
        baseUrl: 'https://ravencolonial100-awcbdvabgze4c5cq.canadacentral-01.azurewebsites.net',
    },

    // UI
    ui: {
        starCount: 800,
        starSpeed: 0.2,
        typingSpeed: 30,
    },

    // Supported languages
    languages: ['en', 'ru', 'de'],
    defaultLang: 'en',
};

export const ROUTE_COUNT = 18;
