import makeWASocket, { DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys';
import pino from 'pino';
import { Boom } from '@hapi/boom';
import { tambahTagihan, cekTagihan, tandaiLunas, editTagihan, createTagihan, help } from './handlers/paymentHandler';
import { GRUP_ID_LISTRIK } from './config';


async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('baileys_auth_info');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: pino({ level: 'warn' }),
        browser: ['assistant-bot-wa', 'Chrome', '1.0.0']
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
      const { connection, qr } = update;
      if (qr) {
        const qrcode = require('qrcode-terminal');
        qrcode.generate(qr, { small: true });
        console.log('🔐 QR Code untuk login ditampilkan di terminal');
      }
    
      if (connection === 'open') {
        console.log('Bot berhasil login ke WhatsApp');
      } else if (connection === 'close') {
        console.log('Koneksi ditutup, mencoba lagi...');
      }
    });
    

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const chatId = msg.key.remoteJid;
        const body = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
        const isGroupMsg = chatId?.endsWith('@g.us');
        const senderId = isGroupMsg ? msg.key.participant : chatId;

        if (!chatId || !senderId) return;

        // Respon chat pribadi
        if (!isGroupMsg) {
            if (body.trim().toLowerCase() === '.ping') {
                await sock.sendMessage(chatId, { text: 'Pong! 🏓' }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: 'Orangnya lagi tidur, silahkan tinggalkan pesan atau gunakan perintah yang tersedia.' });
            }
            return; 
        }

        // Cek ID grup
        if (body.trim().toLowerCase() === '.info') {
            console.log(`Chat ID Grup: ${chatId}`);
            console.log(`const GRUP_ID_LISTRIK: ${GRUP_ID_LISTRIK}`);
            // await sock.sendMessage(chatId, { text: `ID Grup ini adalah:\n${chatId}` });
        }

        // Fitur tagihan listrik (khusus grup kos)
        if (chatId === GRUP_ID_LISTRIK) {
          console.log(`Pesan diterima di grup listrik: ${chatId}`);
            const command = body.trim().toLowerCase().split(' ')[0];
            switch (command) {
                case '.tambah':
                    await tambahTagihan(sock, chatId, body, senderId, msg);
                    break;
                case '.cek':
                    await cekTagihan(sock, chatId, msg);
                    break;
                case '.don':
                    await tandaiLunas(sock, chatId, body, senderId, msg);
                    break;
                case '.edit':
                    await editTagihan(sock, chatId, body, senderId, msg);
                    break;
                case '.buat-tagihan':
                    await createTagihan(sock, chatId, senderId);
                    break;
                case '.help':
                    await help(sock, chatId);
                    break;
            }
        }
    });
}

connectToWhatsApp();