// 🌐 NEXUS - CLIENT DE CONNEXION OPTIMISÉ
// Code inspiré par SEN (connexion directe + pairing)

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore
} = require('gifted-baileys');
const pino = require('pino');
const chalk = require('chalk');
const config = require('../config');

// Gestionnaire d'événements (Handler)
const { messageHandler } = require('./handler');
const { monitorMessage, monitorGroupUpdate } = require('./monitor'); 
const { getSettings } = require('../lib/database'); // Import settings

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState(config.sessionName);
    const { version } = await fetchLatestBaileysVersion();
    
    console.log(chalk.cyan(`🚀 Lancement de ${config.botName}...`));

    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }), // Log silencieux (optimisation)
        printQRInTerminal: !config.pairingCode, // Désactivé si pairing code activé
        browser: ["Ubuntu", "Chrome", "20.0.04"], // Browser spoofing pour éviter les bugs
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" })),
        },
        markOnlineOnConnect: true,
        generateHighQualityLinkPreview: true,
        syncFullHistory: false, // ⚡️ OPTIMISATION MAJEURE (Comme SEN)
        keepAliveIntervalMs: 30000,
        defaultQueryTimeoutMs: 60000,
        retryRequestDelayMs: 250,
        getMessage: async (key) => { return undefined }
    });

    // 🔗 GESTION DU PAIRING CODE
    if (!sock.authState.creds.registered && (process.argv.includes('--pairing') || process.argv.includes('--pairing-code'))) {
        setTimeout(async () => {
            let phoneNumber = config.phoneNumber.replace(/[^0-9]/g, '');
            if (!phoneNumber) {
                console.log(chalk.red("❌ Aucun numéro trouvé dans config.js !"));
                process.exit(1);
            }
            try {
                let code = await sock.requestPairingCode(phoneNumber);
                code = code?.match(/.{1,4}/g)?.join("-") || code;
                console.log(chalk.green(`\n✅ Code de jumelage : ${code}\n`));
            } catch (e) {
                console.log(chalk.red("Erreur pairing:", e));
            }
        }, 3000);
    }

    // 🔄 GESTION DE LA CONNEXION
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log(chalk.yellow('Connexion fermée, tentative de reconnexion...'));
            if (shouldReconnect) connectToWhatsApp();
        } else if (connection === 'open') {
            console.log(chalk.green('✅ Connecté à WhatsApp !'));
        }
    });

    sock.ev.on('creds.update', saveCreds);

    // 📩 GESTION DES MESSAGES (Handler + Monitor)
    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg) return;

        // --- GESTION DES STATUTS ---
        if (msg.key.remoteJid === 'status@broadcast' && !msg.key.fromMe) {
            const settings = getSettings();
            
            // Auto View
            if (settings.autostatusview) {
                await sock.readMessages([msg.key]);
                console.log(chalk.green(`[STATUS] Vu : ${msg.key.participant}`));
            }

            // Auto React (💚)
            if (settings.autostatusreact) {
                setTimeout(async () => {
                    await sock.sendMessage('status@broadcast', { 
                        react: { text: '💚', key: msg.key } 
                    }, { statusJidList: [msg.key.participant] });
                }, 2000); // Petit délai pour éviter les erreurs de sync
            }
            return; // Stop pour les statuts
        }

        if (m.type === 'notify') {
           // --- GESTION PRÉSENCE (FAKE) ---
           const settings = getSettings();
           const chatId = msg.key.remoteJid;

           if (settings.autotyping) {
               await sock.sendPresenceUpdate('composing', chatId);
               setTimeout(() => sock.sendPresenceUpdate('paused', chatId), 5000);
           } else if (settings.autorecord) {
               await sock.sendPresenceUpdate('recording', chatId);
               setTimeout(() => sock.sendPresenceUpdate('paused', chatId), 5000);
           }

           await monitorMessage(sock, m);
           await messageHandler(sock, m);
        }
    });

    // 👥 GESTION DES GROUPES (Promote/Demote/Welcome)
    sock.ev.on('group-participants.update', async (update) => {
        await monitorGroupUpdate(sock, update);
    });

    return sock;
}

module.exports = { connectToWhatsApp };