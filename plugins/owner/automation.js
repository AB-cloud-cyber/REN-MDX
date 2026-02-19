// 🤖 Plugin: AUTOMATION (Owner)
// Gère les automatisations globales (Status, Présence)

const { updateSetting, getSettings } = require('../../lib/database');

const AUTOMATIONS = [
    { cmd: 'autostatusview', name: 'AUTO-STATUS-VIEW', desc: 'Vue auto des statuts' },
    { cmd: 'autostatusreact', name: 'AUTO-STATUS-REACT', desc: 'Réaction auto des statuts' },
    { cmd: 'autotyping', name: 'AUTO-TYPING', desc: 'Simule l\'écriture' },
    { cmd: 'autorecord', name: 'AUTO-RECORD', desc: 'Simule l\'enregistrement vocal' }
];

const commands = AUTOMATIONS.map(auto => ({
    name: auto.cmd,
    aliases: [],
    category: 'owner',
    description: auto.desc,
    usage: `.${auto.cmd} <on/off>`,
    
    ownerOnly: true,

    execute: async (client, message, args) => {
        const setting = args[0]?.toLowerCase();
        const currentConfig = getSettings();

        // Gestion conflit Typing/Record (un seul actif à la fois)
        if (setting === 'on') {
            if (auto.cmd === 'autotyping') updateSetting('autorecord', false);
            if (auto.cmd === 'autorecord') updateSetting('autotyping', false);
        }

        if (!setting) {
            return client.sendMessage(message.key.remoteJid, { 
                text: `> *${auto.name}* : ${currentConfig[auto.cmd] ? 'on' : 'off'}` 
            }, { quoted: message });
        }

        if (setting === 'on') {
            updateSetting(auto.cmd, true);
            return client.sendMessage(message.key.remoteJid, { text: `> *${auto.name}* : on` }, { quoted: message });
        }

        if (setting === 'off') {
            updateSetting(auto.cmd, false);
            return client.sendMessage(message.key.remoteJid, { text: `> *${auto.name}* : off` }, { quoted: message });
        }

        client.sendMessage(message.key.remoteJid, { text: `> *USAGE* : .${auto.cmd} <on/off>` }, { quoted: message });
    }
}));

module.exports = commands;