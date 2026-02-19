module.exports = {
  name: 'ping',
  aliases: ['p'],
  category: 'misc',
  description: 'Vérifie la latence',
  usage: '.ping',
  
  // FLAGS
  groupOnly: false,
  ownerOnly: false,
  adminOnly: false,

  execute: async (client, message, args, msgOptions) => {
    const start = Date.now();
    
    // 1. Réaction
    await client.sendMessage(message.key.remoteJid, { 
        react: { text: "♟", key: message.key } 
    });

    const end = Date.now();
    const latency = end - start;

    // 2. Message unique (avec msgOptions pour supporter les flags si ajoutés plus tard)
    await client.sendMessage(message.key.remoteJid, { 
        text: `📺 *Ping !* ${latency}ms` 
    }, { quoted: message, ...msgOptions });
  }
};