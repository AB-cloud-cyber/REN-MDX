// 🛡️ NEXUS - MONITOR (PROTECTIONS COMPLÈTES)
const { getGroupSettings } = require('../lib/database');
const { isAdmin, normalizeJid } = require('../lib/authHelper');

const LINK_REGEX = /(https?:\/\/)?(chat\.whatsapp\.com\/[0-9A-Za-z]{20,24}|wa\.me\/\d+)/i;

// Emojis pour AutoReact
const REACT_EMOJIS = ['👍', '❤️', '😂', '😮', '🙏', '🔥', '✨', '💯', '👀', '🤔'];

// --- 1. SURVEILLANCE DES MESSAGES ---
async function monitorMessage(sock, m) {
    try {
        const message = m.messages[0];
        // NOTE: On ne return PAS si fromMe, car l'owner/bot peut vouloir tester (sauf s'il est immunisé plus bas)
        if (!message) return;

        const chatId = message.key.remoteJid;
        if (!chatId.endsWith('@g.us')) return;

        const sender = message.key.participant || message.participant;
        // Si fromMe, l'expéditeur est le bot lui-même
        if (message.key.fromMe) return; // Le bot ne se censure pas lui-même

        const body = message.message?.conversation || message.message?.extendedTextMessage?.text || message.message?.imageMessage?.caption || "";
        
        // Charger la config du groupe
        const settings = getGroupSettings(chatId);
        
        // DEBUG LOG (À supprimer en prod si trop bavard)
        // console.log(`[MONITOR] ${sender} in ${chatId}: ${body.substring(0, 20)}...`);

        // Les admins sont immunisés contre TOUTES les protections textuelles
        const userIsAdmin = await isAdmin(sock, chatId, sender);
        
        // --- AUTOREACT ---
        if (settings.autoreact && !message.key.fromMe) {
            // Réagit aléatoirement
            const randomEmoji = REACT_EMOJIS[Math.floor(Math.random() * REACT_EMOJIS.length)];
            await sock.sendMessage(chatId, { react: { text: randomEmoji, key: message.key } });
        }

        if (userIsAdmin) {
            // console.log(`[MONITOR] Ignored (Admin): ${sender}`);
            return;
        }

        // --- A. ANTILINK ---
        if (settings.antilink && LINK_REGEX.test(body)) {
            console.log(`[ANTILINK] DETECTED from ${sender}`);
            await sock.sendMessage(chatId, { delete: message.key });
            if (settings.antilinkAction === 'kick') {
                await sock.groupParticipantsUpdate(chatId, [sender], 'remove');
                await sock.sendMessage(chatId, { text: `> *ANTILINK* : @${sender.split('@')[0]} retiré.` }, { mentions: [sender] });
            } else {
                await sock.sendMessage(chatId, { text: `> *ANTILINK* : Lien interdit supprimé.` });
            }
            return; // Stop processing
        }

        // --- B. ANTI-BADWORD ---
        if (settings.antibadword && settings.badwords.length > 0) {
            const isBad = settings.badwords.some(word => body.toLowerCase().includes(word.toLowerCase()));
            if (isBad) {
                await sock.sendMessage(chatId, { delete: message.key });
                await sock.sendMessage(chatId, { text: `> *ANTI-BADWORD* : Langage inapproprié.` });
                return;
            }
        }

        // --- C. ANTI-TAG ---
        // Vérifie si le message contient beaucoup de mentions (ex: > 5)
        const mentions = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        if (settings.antitag && mentions.length > 5) {
            await sock.sendMessage(chatId, { delete: message.key });
            await sock.groupParticipantsUpdate(chatId, [sender], 'remove');
            await sock.sendMessage(chatId, { text: `> *ANTITAG* : Stop tag.` });
            return;
        }

        // --- D. ANTI-MEDIA (Images/Vidéos/Stickers) ---
        // Vérifie le type de message
        if (settings.antimedia && message.message) {
            const msgType = Object.keys(message.message)[0];
            const mediaTypes = ['imageMessage', 'videoMessage', 'stickerMessage', 'audioMessage', 'documentMessage'];
            if (mediaTypes.includes(msgType)) {
                await sock.sendMessage(chatId, { delete: message.key });
                // Pas de message de notif pour éviter le spam si bombardement d'images
                return;
            }
        }

        // --- E. ANTI-TRANSFERT ---
        // Vérifie si le message est transféré
        const contextInfo = message.message?.extendedTextMessage?.contextInfo || message.message?.imageMessage?.contextInfo || message.message?.videoMessage?.contextInfo;
        if (settings.antitransfert && contextInfo?.isForwarded) {
             await sock.sendMessage(chatId, { delete: message.key });
             await sock.sendMessage(chatId, { text: `> *ANTI-TRANSFERT* : Interdit.` });
             return;
        }

        // --- F. ANTI-SPAM (Basique) ---
        // Pour une vraie logique antispam, il faudrait un cache en mémoire des derniers messages par user
        // Ici, on bloque juste les messages trop longs (> 3000 caractères) qui font laguer
        if (settings.antispam && body.length > 3000) {
            await sock.sendMessage(chatId, { delete: message.key });
            await sock.groupParticipantsUpdate(chatId, [sender], 'remove');
            return;
        }

    } catch (e) {
        console.error("Erreur Monitor Message:", e);
    }
}

// --- 2. SURVEILLANCE DES ÉVÉNEMENTS GROUPE ---
async function monitorGroupUpdate(sock, update) {
    try {
        const { id, participants, action } = update;
        const settings = getGroupSettings(id);
        
        // --- G. ANTI-PROMOTE ---
        if (settings.antipromote && action === 'promote') {
            // On cherche QUI a fait l'action (l'auteur)
            // Malheureusement, l'événement group-participants.update ne donne pas toujours l'auteur (author)
            // Sauf si on écoute 'notify' sur certains cas, mais Baileys le donne souvent dans 'author' si dispo
            const author = update.author || update.actor; 
            if (!author) return;

            // Si l'auteur est le bot lui-même, on ignore
            const botId = normalizeJid(sock.user.id);
            if (normalizeJid(author) === botId) return;

            // Si l'auteur est Owner, on ignore
            // (Nécessite d'importer config pour vérifier owner)
            const config = require('../config');
            if (config.ownerNumber.some(n => author.includes(n))) return;

            // Sinon, on sanctionne : On rétrograde le nouveau promu + On rétrograde l'auteur (si possible)
            for (const participant of participants) {
                await sock.groupParticipantsUpdate(id, [participant], 'demote');
            }
            await sock.groupParticipantsUpdate(id, [author], 'demote');
            await sock.sendMessage(id, { text: `> *ANTI-PROMOTE* : Action non autorisée.` });
        }

        // --- H. ANTI-DEMOTE ---
        if (settings.antidemote && action === 'demote') {
            const author = update.author || update.actor;
            if (!author) return;

            const botId = normalizeJid(sock.user.id);
            if (normalizeJid(author) === botId) return;

            const config = require('../config');
            if (config.ownerNumber.some(n => author.includes(n))) return;

            // On repromote la victime + On rétrograde l'auteur
            for (const participant of participants) {
                await sock.groupParticipantsUpdate(id, [participant], 'promote');
            }
            await sock.groupParticipantsUpdate(id, [author], 'demote');
            await sock.sendMessage(id, { text: `> *ANTI-DEMOTE* : Action non autorisée.` });
        }

        // --- I. WELCOME ---
        if (settings.welcome && action === 'add') {
            for (const participant of participants) {
                const ppUrl = await sock.profilePictureUrl(participant, 'image').catch(() => 'https://i.postimg.cc/8cKZBMZw/lv-0-20251105211949.jpg');
                const metadata = await sock.groupMetadata(id);
                
                let text = settings.welcomeMessage || "Bienvenue @user dans @group !";
                text = text.replace('@user', `@${participant.split('@')[0]}`);
                text = text.replace('@group', metadata.subject);
                text = text.replace('@desc', metadata.desc || 'Pas de description');

                await sock.sendMessage(id, { 
                    image: { url: ppUrl }, 
                    caption: text,
                    mentions: [participant]
                });
            }
        }

    } catch (e) {
        console.error("Erreur Monitor Group:", e);
    }
}

module.exports = { monitorMessage, monitorGroupUpdate };