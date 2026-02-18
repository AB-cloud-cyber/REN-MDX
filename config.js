// ⚙️ REN-MDX - CONFIGURATION CENTRALE
// Facile à modifier pour tous les développeurs

module.exports = {
  // --- IDENTITÉ ---
  botName: 'REN-MDX',
  ownerName: 'Admin',
  ownerNumber: ['237650471093'], // Ton numéro
  phoneNumber: '237650471093', // Numéro du BOT pour le Pairing Code
  prefix: '.', // Préfixe par défaut

  // --- PARAMÈTRES INTERNES ---
  sessionName: 'session',
  defaultLang: 'fr', 
  autoRead: false, 
  
  // --- OPTIMISATIONS ---
  syncFullHistory: false, 
  keepAliveInterval: 30000, 

  // --- BASE DE DONNÉES (JSON) ---
  database: {
    users: './database/users.json',
    groups: './database/groups.json',
    settings: './database/settings.json'
  }
};