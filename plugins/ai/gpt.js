// 🤖 Plugin: GPT
// Chat avec l'IA

const axios = require('axios');

module.exports = {
    name: 'gpt',
    aliases: ['ai', 'bot'],
    category: 'ai',
    description: 'Discute avec l\'IA',
    usage: '.gpt <question>',

    execute: async (client, message, args) => {
        const text = args.join(' ');
        if (!text) return client.sendMessage(message.key.remoteJid, { text: '> *ERREUR* : Posez une question.' }, { quoted: message });

        await client.sendMessage(message.key.remoteJid, { react: { text: "🧠", key: message.key } });

        try {
            // Utilisation d'une API publique (exemple : hercai ou similaire)
            // Note: Remplacer par une API robuste si besoin
            const { data } = await axios.get(`https://hercai.onrender.com/v3/hercai?question=${encodeURIComponent(text)}`);
            
            await client.sendMessage(message.key.remoteJid, { text: data.reply }, { quoted: message });

        } catch (error) {
            client.sendMessage(message.key.remoteJid, { text: '> *ERREUR* : IA indisponible.' }, { quoted: message });
        }
    }
};