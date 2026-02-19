// 🛠️ Plugin: STICKER
// Convertit images/vidéos en stickers

const { downloadContentFromMessage } = require('gifted-baileys');
const { Sticker, StickerTypes } = require('wa-sticker-formatter');
const config = require('../../config');

module.exports = {
    name: 'sticker',
    aliases: ['s', 'stick'],
    category: 'tools',
    description: 'Convertit une image/vidéo en sticker',
    usage: '.sticker (en réponse à une image/vidéo)',

    groupOnly: false,
    ownerOnly: false,
    adminOnly: false,

    execute: async (client, message, args) => {
        try {
            const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const targetMessage = quoted || message.message;
            
            // Détection du type de média
            const mime = (targetMessage.imageMessage || targetMessage.videoMessage || targetMessage.stickerMessage)?.mimetype;
            
            if (!mime) return client.sendMessage(message.key.remoteJid, { text: '> *ERREUR* : Répondez à une image ou une vidéo.' }, { quoted: message });

            // Téléchargement
            const msgType = Object.keys(targetMessage)[0].replace('Message', '');
            const stream = await downloadContentFromMessage(targetMessage[Object.keys(targetMessage)[0]], msgType);
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            // Création du Sticker
            const sticker = new Sticker(buffer, {
                pack: config.botName,
                author: config.ownerName,
                type: StickerTypes.FULL,
                categories: ['🤩', '🎉'],
                id: '12345',
                quality: 50,
                background: 'transparent'
            });

            const generated = await sticker.toBuffer();
            
            await client.sendMessage(message.key.remoteJid, { sticker: generated }, { quoted: message });

        } catch (error) {
            console.error(error);
            client.sendMessage(message.key.remoteJid, { text: '> *ERREUR* : Conversion échouée.' }, { quoted: message });
        }
    }
};