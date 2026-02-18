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

    // 📩 GESTION DES MESSAGES (Handler)
    sock.ev.on('messages.upsert', async (m) => {
        if (m.type === 'notify') {
           await messageHandler(sock, m);
        }
    });

    return sock;
}

module.exports = { connectToWhatsApp };