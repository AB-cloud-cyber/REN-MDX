// 👋 Plugin: WELCOME
// Gère les messages de bienvenue

const { updateGroupSetting, getGroupSettings } = require('../../lib/database');

module.exports = [
    {
        name: 'welcome',
        aliases: [],
        category: 'group',
        description: 'Active/Désactive le message de bienvenue',
        usage: '.welcome <on/off>',
        
        groupOnly: true,
        adminOnly: true,

        execute: async (client, message, args) => {
            const chatId = message.key.remoteJid;
            const setting = args[0]?.toLowerCase();
            const currentConfig = getGroupSettings(chatId);

            if (!setting) {
                return client.sendMessage(chatId, { text: `> *WELCOME* : ${currentConfig.welcome ? 'on' : 'off'}` }, { quoted: message });
            }

            if (setting === 'on') {
                updateGroupSetting(chatId, 'welcome', true);
                return client.sendMessage(chatId, { text: '> *WELCOME* : on' }, { quoted: message });
            }

            if (setting === 'off') {
                updateGroupSetting(chatId, 'welcome', false);
                return client.sendMessage(chatId, { text: '> *WELCOME* : off' }, { quoted: message });
            }
        }
    },
    {
        name: 'setwelcome',
        aliases: [],
        category: 'group',
        description: 'Configure le message de bienvenue',
        usage: '.setwelcome <message> (@user, @group, @desc)',
        
        groupOnly: true,
        adminOnly: true,

        execute: async (client, message, args) => {
            const chatId = message.key.remoteJid;
            const text = args.join(' ');

            if (!text) return client.sendMessage(chatId, { text: '> *ERREUR* : Message manquant' }, { quoted: message });

            updateGroupSetting(chatId, 'welcomeMessage', text);
            client.sendMessage(chatId, { text: `> *WELCOME MSG* : Mis à jour.` }, { quoted: message });
        }
    }
];