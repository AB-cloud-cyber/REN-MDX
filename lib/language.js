// 🌐 GESTIONNAIRE DE LANGUES DYNAMIQUE
const fs = require('fs-extra');
const path = require('path');
const config = require('../config.js');
const { getSettings } = require('./database');

const LANG_CACHE = {};

function loadLocale(langCode) {
  if (LANG_CACHE[langCode]) return LANG_CACHE[langCode];
  
  const localePath = path.join(__dirname, `../locales/${langCode}.json`);
  if (!fs.existsSync(localePath)) return null;
  
  const data = JSON.parse(fs.readFileSync(localePath, 'utf8'));
  LANG_CACHE[langCode] = data;
  return data;
}

function t(key) {
  // Récupérer la langue active depuis la DB
  const settings = getSettings();
  const currentLang = settings.lang || config.defaultLang;

  let locale = loadLocale(currentLang);
  if (!locale) locale = loadLocale('en'); // Fallback

  return locale[key] || key;
}

module.exports = { t };