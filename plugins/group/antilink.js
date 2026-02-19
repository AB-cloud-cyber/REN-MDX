// 🛡️ Plugin: ANTILINK
// Protection contre les liens WhatsApp

const { updateGroupSetting, getGroupSettings } = require('../../lib/database');

module.exports = {
  name: 'antilink',
  aliases: ['link'],
  category: 'group',
  description: 'Configure la protection antilink',
  usage: '.antilink <on/off/action>',
  
  // FLAGS
  groupOnly: true,
  adminOnly: true, // Seuls les admins touchent à la config
  botAdminNeeded: true, // Le bot doit être admin pour agir (supprimer/kick)

  execute: async (client, message, args) => {
    const chatId = message.key.remoteJid;
    const setting = args[0]?.toLowerCase();
    
    // Récupération état actuel
    const currentConfig = getGroupSettings(chatId);

    if (!setting) {
        return client.sendMessage(chatId, { 
            text: `> *ANTILINK* : ${currentConfig.antilink ? 'on' : 'off'}\n> *ACTION* : ${currentConfig.antilinkAction}` 
        }, { quoted: message });
    }

    if (setting === 'on') {
        updateGroupSetting(chatId, 'antilink', true);
        return client.sendMessage(chatId, { text: '> *ANTILINK* : on' }, { quoted: message });
    }

    if (setting === 'off') {
        updateGroupSetting(chatId, 'antilink', false);
        return client.sendMessage(chatId, { text: '> *ANTILINK* : off' }, { quoted: message });
    }

    if (['kick', 'delete'].includes(setting)) {
        updateGroupSetting(chatId, 'antilinkAction', setting);
        return client.sendMessage(chatId, { text: `> *ACTION* : ${setting}` }, { quoted: message });
    }

    client.sendMessage(chatId, { text: '> *ERREUR* : usage .antilink <on/off/kick/delete>' }, { quoted: message });
  }
};