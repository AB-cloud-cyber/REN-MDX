// 📦 Plugin: PING
// Exemple de structure complète

module.exports = {
  name: 'ping',
  aliases: ['p', 'speed'],
  category: 'misc',
  description: 'Affiche la latence du bot',
  usage: '.ping',
  
  // FLAGS
  groupOnly: false,
  ownerOnly: false,
  adminOnly: false,
  botAdminNeeded: false,

  execute: async (client, message, args) => {
    const start = Date.now();
    await client.sendMessage(message.key.remoteJid, { text: '🏓 Pong !' });
    const end = Date.now();
    // Exemple d'edit (si supporté par la version de baileys) ou de reply
    await client.sendMessage(message.key.remoteJid, { text: `⏱️ Latence : ${end - start}ms` }, { quoted: message });
  }
};