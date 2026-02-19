// 🖼️ Plugin: SETMENUIMAGE
// Configure les images du menu

const { updateSetting } = require('../../lib/database');

module.exports = {
    name: 'setmenuimage',
    aliases: ['setmenu'],
    category: 'owner',
    description: 'Change les images du menu',
    usage: '.setmenu <url1> <url2> ...',
    
    ownerOnly: true,

    execute: async (client, message, args) => {
        // TODO: Support image upload via reply (complex for now, starting with URLs)
        if (args.length === 0) return client.sendMessage(message.key.remoteJid, { text: '> *ERREUR* : URLs manquantes' }, { quoted: message });

        // Filtrer les URLs valides (basique)
        const urls = args.filter(arg => arg.startsWith('http'));
        
        if (urls.length === 0) return client.sendMessage(message.key.remoteJid, { text: '> *ERREUR* : Aucune URL valide' }, { quoted: message });

        updateSetting('menuImages', urls);
        await client.sendMessage(message.key.remoteJid, { text: `> *MENU IMAGES* : ${urls.length} images mises à jour.` }, { quoted: message });
    }
};