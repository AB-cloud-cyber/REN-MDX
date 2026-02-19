// 🌐 Plugin: SETLANG
// Change la langue globale du bot

const { updateSetting } = require('../../lib/database');
const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'setlang',
  aliases: ['lang'],
  category: 'owner',
  description: 'Change la langue du bot',
  usage: '.setlang <fr/en>',
  
  // FLAGS
  groupOnly: false,
  ownerOnly: true, 
  adminOnly: false,

  execute: async (client, message, args, msgOptions) => {
    const newLang = args[0]?.toLowerCase();
    
    // Lister les langues disponibles
    const localesDir = path.join(__dirname, '../../locales');
    const availableLangs = fs.readdirSync(localesDir)
        .filter(f => f.endsWith('.json'))
        .map(f => f.replace('.json', ''));

    if (!availableLangs.includes(newLang)) {
      return client.sendMessage(message.key.remoteJid, { 
        text: `❌ Langues disponibles : ${availableLangs.join(', ')}\nUsage: .setlang <lang>` 
      }, { quoted: message });
    }

    updateSetting('lang', newLang);

    await client.sendMessage(message.key.remoteJid, { 
        text: `✅ Langue définie sur : **${newLang.toUpperCase()}**` 
    }, { quoted: message });
  }
};