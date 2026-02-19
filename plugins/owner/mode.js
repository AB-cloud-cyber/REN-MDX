// 👑 Plugin: MODE
// Change le mode d'accès du bot (Public / Privé)

const { updateSetting } = require('../../lib/database');

module.exports = {
  name: 'mode',
  aliases: [],
  category: 'owner',
  description: 'Change le mode du bot (public/private)',
  usage: '.mode <public/private>',
  
  // FLAGS
  groupOnly: false,
  ownerOnly: true, // IMPORTANT: Seul l'owner peut changer le mode
  adminOnly: false,

  execute: async (client, message, args, msgOptions) => {
    const newMode = args[0]?.toLowerCase();

    if (!['public', 'private'].includes(newMode)) {
      return client.sendMessage(message.key.remoteJid, { 
        text: '❌ Usage: .mode <public/private>' 
      }, { quoted: message });
    }

    updateSetting('mode', newMode);

    await client.sendMessage(message.key.remoteJid, { text: `> *MODE* : ${newMode}` }, { quoted: message });
  }
};