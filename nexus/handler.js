// 🚀 NEXUS - HANDLER (OPTIMISÉ v2)
const path = require('path');
const fs = require('fs');
const config = require('../config');
const { t } = require('../lib/language');
const chalk = require('chalk');

// Chargement des plugins
const plugins = {};
const aliases = {};

function loadPlugins() {
    console.log(chalk.cyan('📥 Chargement des plugins...'));
    const pluginDir = path.join(__dirname, '../plugins');
    
    fs.readdirSync(pluginDir).forEach(category => {
        const catPath = path.join(pluginDir, category);
        if (fs.lstatSync(catPath).isDirectory()) {
            fs.readdirSync(catPath).forEach(file => {
                if (file.endsWith('.js')) {
                    const plugin = require(path.join(catPath, file));
                    plugins[plugin.name] = plugin;
                    if (plugin.aliases) {
                        plugin.aliases.forEach(alias => aliases[alias] = plugin.name);
                    }
                }
            });
        }
    });
    console.log(chalk.cyan(`✅ ${Object.keys(plugins).length} plugins chargés.\n`));
}

// Handler de message
async function messageHandler(sock, m) {
    try {
        const message = m.messages[0];
        if (!message) return;

        // ⚠️ IMPORTANT : On ne return PAS si fromMe, sinon le propriétaire ne peut pas utiliser son bot !
        // Mais on ignore les messages qui ne sont pas du texte pour éviter les boucles
        if (message.key.fromMe && !message.message?.conversation && !message.message?.extendedTextMessage) return;

        const chatId = message.key.remoteJid;
        const isGroup = chatId.endsWith('@g.us');
        
        // Détermination propre de l'expéditeur
        let sender = isGroup ? (message.key.participant || message.participant) : chatId;
        if (message.key.fromMe) {
            sender = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        }

        const body = message.message?.conversation || message.message?.extendedTextMessage?.text || "";
        const prefix = config.prefix;

        // Si ce n'est pas une commande, on s'arrête là (sauf si on ajoute de l'IA plus tard)
        if (!body.startsWith(prefix)) return;

        // Analyse de la commande
        const args = body.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        const pluginName = plugins[commandName] ? commandName : aliases[commandName];
        
        if (pluginName) {
            const plugin = plugins[pluginName];
            const senderNum = sender.split('@')[0].split(':')[0]; // Numéro propre sans suffixe

            // --- VÉRIFICATIONS ---

            // 1. Owner Only
            // Le propriétaire est soit dans la config, soit c'est le bot lui-même (fromMe)
            const isOwner = config.ownerNumber.includes(senderNum) || message.key.fromMe;
            if (plugin.ownerOnly && !isOwner) {
                return sock.sendMessage(chatId, { text: t('owner_only') }, { quoted: message });
            }

            // 2. Group Only
            if (plugin.groupOnly && !isGroup) {
                return sock.sendMessage(chatId, { text: t('group_only') }, { quoted: message });
            }

            // 3. Admin Only (Optimisé : requête faite UNIQUEMENT si nécessaire)
            if (plugin.adminOnly && isGroup) {
                // On ne fetch les métadonnées que maintenant !
                const groupMetadata = await sock.groupMetadata(chatId);
                const participants = groupMetadata.participants;
                // On cherche si l'expéditeur est admin ou superadmin
                const isAdmin = participants.some(p => p.id.includes(senderNum) && (p.admin === 'admin' || p.admin === 'superadmin'));
                
                if (!isAdmin && !isOwner) {
                    return sock.sendMessage(chatId, { text: t('admin_only') }, { quoted: message });
                }
            }

            // 🚀 EXÉCUTION
            console.log(chalk.yellow(`[EXEC] ${pluginName} par ${senderNum}`));
            await plugin.execute(sock, message, args);
        }

    } catch (e) {
        console.error(chalk.red("Erreur Handler:"), e);
    }
}

module.exports = { loadPlugins, messageHandler };