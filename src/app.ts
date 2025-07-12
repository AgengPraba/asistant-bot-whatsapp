import makeWASocket, { DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys';
import pino from 'pino';
import { Boom } from '@hapi/boom';
import { tambahTagihan, cekTagihan, tandaiLunas, editTagihan, createTagihan, help } from './handlers/paymentHandler';
import { GRUP_ID_LISTRIK } from './config';
import { handleConverter } from './handlers/converterHandler';
import { handleDownloader } from './handlers/downloaderHandler';


async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('baileys_auth_info');

    const sock = makeWASocket({
        auth: state,
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
        const body = (msg.message.conversation || msg.message.extendedTextMessage?.text || '').trim().toLowerCase();
        const hasMedia = !!(msg.message.documentMessage || msg.message.imageMessage);
        const command = body.split(' ')[0];
        const isGroupMsg = chatId?.endsWith('@g.us');
        const senderId = isGroupMsg ? msg.key.participant : chatId;

        const converterTextCommands = ['.mulai-gabung', '.batal-gabung', '.gabungpdf', '.word2pdf', '.image2pdf'];
        const isConverterTask = hasMedia || converterTextCommands.includes(command);

        const paymentCommands = ['.tambah', '.cek', '.don', '.edit', '.buat-tagihan', '.help'];
        const isPaymentTask = chatId === GRUP_ID_LISTRIK && paymentCommands.includes(command);

        const downloaderTextCommands = ['.mp3', '.mp4'];
        const isDownloaderTask = downloaderTextCommands.some(cmd => body.startsWith(cmd));


        // --- ROUTING ---
        if (isConverterTask && !isGroupMsg) {
            await handleConverter(sock, msg);
        } else if (isDownloaderTask && !isGroupMsg) {
            await handleDownloader(sock, msg);
        }
        else if (isPaymentTask) {
            switch (command) {
                case '.tambah': await tambahTagihan(sock, chatId, body, senderId, msg); break;
                case '.cek': await cekTagihan(sock,chatId, msg); break;
                case '.don': await tandaiLunas(sock, chatId, body, senderId, msg); break;
                case '.edit': await editTagihan(sock, chatId, body, senderId, msg); break;
                case '.buat-tagihan': await createTagihan(sock, chatId, senderId); break;
                case '.help': await help(sock, chatId); break;
            }
        } else {
            if (body === '.info' && chatId?.endsWith('@g.us')) {
                await sock.sendMessage(chatId, { text: `ID Grup ini adalah:\n${chatId}` });
            } else if (body === '.ping' && chatId && !isGroupMsg) {
                await sock.sendMessage(chatId, { text: 'Pong! 🏓' });
            } else if (body === '.menu' && chatId) {
                const menuText = `*Menu Bot WhatsApp*\n\n` +
                    `*Tagihan Listrik*\n` +
                    `   .tambah <nama> <jumlah> : Tambah tagihan baru\n` +
                    `   .cek : Cek tagihan yang belum dibayar\n` +
                    `   .don <id_tagihan> : Tandai tagihan sebagai sudah dibayar\n` +
                    `   .edit <id_tagihan> <nama> <jumlah> : Edit tagihan\n` +
                    `   .buat-tagihan : Buat tagihan baru\n` +
                    `   .help : Tampilkan bantuan\n\n` +
                    `*Converter*\n` +
                    `   .mulai-gabung : Mulai proses penggabungan file\n` +
                    `   .batal-gabung : Batalkan proses penggabungan file\n` +
                    `   .gabungpdf : Gabungkan file PDF\n` +
                    `   .word2pdf : Konversi Word ke PDF\n` +
                    `   .image2pdf : Konversi gambar ke PDF\n\n`;
                    
                await sock.sendMessage(chatId, { text: menuText });
            }
        }
    });
}

connectToWhatsApp();