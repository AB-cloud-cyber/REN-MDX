// 🛠️ UTILS - FONCTIONS AVANCÉES (DYNAMIQUE)
// Gestion des ContextInfos, AdReply et Newsletter

const config = require('../config');

function getNewsletterContext(settings = {}) {
    return {
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            // Priorité : DB > Config > Défaut
            newsletterJid: settings.newsletterJid || config.newsletterJid || '120363161513685998@newsletter',
            newsletterName: settings.botName || config.botName,
            serverMessageId: -1
        }
    };
}

function getAdReplyContext(settings = {}) {
    return {
        externalAdReply: {
            title: settings.botName || config.botName,
            body: "ʙʏ ꜱᴛᴇᴘʜᴛᴇᴄʜ",
            thumbnailUrl: config.logoUrl || 'https://i.postimg.cc/8cKZBMZw/lv-0-20251105211949.jpg',
            sourceUrl: 'https://whatsapp.com/channel/0029Vb6DrnUHAdNQtz2GC307',
            mediaType: 1,
            mediaUrl: 'https://whatsapp.com/channel/0029Vb6DrnUHAdNQtz2GC307',
            renderLargerThumbnail: true,
            showAdAttribution: true
        }
    };
}

function buildMessageOptions(command, settings = {}) {
    let contextInfo = {};

    if (command.newsletterShow) {
        Object.assign(contextInfo, getNewsletterContext(settings));
    }

    if (command.contextInfo) {
        Object.assign(contextInfo, getAdReplyContext(settings));
    }

    return Object.keys(contextInfo).length > 0 ? { contextInfo } : {};
}

module.exports = {
    getNewsletterContext,
    getAdReplyContext,
    buildMessageOptions
};