// ⬇️ Plugin: TIKTOK
// Téléchargement vidéo TikTok

const axios = require('axios');

module.exports = {
    name: 'tiktok',
    aliases: ['tt', 'tik'],
    category: 'download',
    description: 'Télécharge une vidéo TikTok',
    usage: '.tiktok <url>',

    execute: async (client, message, args) => {
        const url = args[0];
        if (!url) return client.sendMessage(message.key.remoteJid, { text: '> *ERREUR* : Lien manquant.' }, { quoted: message });

        await client.sendMessage(message.key.remoteJid, { react: { text: "⬇️", key: message.key } });

        try {
            // API Publique (TikWm)
            const { data } = await axios.post('https://www.tikwm.com/api/', { url: url });
            
            if (!data.data) throw new Error('Vidéo introuvable');

            const videoUrl = data.data.play;
            const caption = `> *TIKTOK DOWNLOAD*\n> *Auteur* : ${data.data.author.nickname}\n> *Titre* : ${data.data.title}`;

            await client.sendMessage(message.key.remoteJid, { 
                video: { url: videoUrl }, 
                caption: caption 
            }, { quoted: message });

        } catch (error) {
            client.sendMessage(message.key.remoteJid, { text: '> *ERREUR* : Échec du téléchargement.' }, { quoted: message });
        }
    }
};