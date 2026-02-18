// 🌐 GESTIONNAIRE DE LANGUES SIMPLE ET RAPIDE

const fs = require('fs-extra');
const path = require('path');
const config = require('../config.js');

const LANG_CACHE = {};

// Charger une langue en mémoire (Optimisation)
function loadLocale(langCode) {
  if (LANG_CACHE[langCode]) return LANG_CACHE[langCode];
  
  const localePath = path.join(__dirname, `../locales/${langCode}.json`);
  if (!fs.existsSync(localePath)) return null;
  
  const data = JSON.parse(fs.readFileSync(localePath, 'utf8'));
  LANG_CACHE[langCode] = data;
  return data;
}

// Récupérer une traduction
function t(key, lang = config.defaultLang) {
  let locale = loadLocale(lang);
  if (!locale) locale = loadLocale('en'); // Fallback en anglais si langue introuvable
  return locale[key] || key;
}

module.exports = { t };