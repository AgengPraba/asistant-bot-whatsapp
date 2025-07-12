import makeWASocket, { DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys';
import pino from 'pino';
import { Boom } from '@hapi/boom';
import { tambahTagihan, cekTagihan, tandaiLunas, editTagihan, createTagihan, help } from './handlers/paymentHandler';
import { GRUP_ID_LISTRIK, FORBIDDEN_WORDS } from './config';
import { handleConverter } from './handlers/converterHandler';
import { handleDownloader } from './handlers/downloaderHandler';
import { handleReminder } from './handlers/reminderHandler';
import { startSchedulers } from './services/scheduler';
import { addMember, removeMember } from './handlers/adminHandler';


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
          startSchedulers(sock);
      } else if (connection === 'close') {
        console.log('Koneksi ditutup, mencoba lagi...');
      }
    });
    

    sock.ev.on('messages.upsert', async (m) => {
        if (m.type !== 'notify') return;
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const chatId:any = msg.key.remoteJid;
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

        const groupAdminCommands = ['.add', '.kick'];

        
        if (isGroupMsg && body) {
            const hasForbiddenWord = FORBIDDEN_WORDS.some(word => body.includes(word));
            if (hasForbiddenWord) {
                // Tambahan: Periksa apakah pengirim adalah admin, agar tidak menghapus pesan admin lain
                const senderIsAdmin = await sock.groupMetadata(chatId)
                    .then((md: any) => md.participants.find((p: any) => p.id === senderId)?.admin?.startsWith('admin'))
                    .catch(() => false);

                if (!senderIsAdmin) {
                    await sock.sendMessage(chatId, { delete: msg.key });
                    await sock.sendMessage(chatId, { text: `Maaf @${senderId?.split('@')[0]}, gaboleh kasar 😊.`, mentions: [senderId!] });
                    return; // Hentikan proses setelah menghapus pesan
                }
            }
        }

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
        } else if (command === '.ingetin') {
            await handleReminder(sock, msg);
        } else  if (groupAdminCommands.includes(command)) {
            if (command === '.add') await addMember(sock, msg);
            if (command === '.kick') await removeMember(sock, msg);
        }
        else {
            if (body === '.info' && chatId?.endsWith('@g.us')) {
                await sock.sendMessage(chatId, { text: `ID Grup ini adalah:\n${chatId}` });
            } else if (body === '.ping' && chatId && !isGroupMsg) {
                await sock.sendMessage(chatId, { text: 'Pong! 🏓' });
            } else if (body === '.menu' && chatId) {
                const menuText = `*Menu Bot WhatsApp*\n\n` +
                    `*[Tagihan Listrik]*\n` +
                    `*.tambah <nama> <jumlah>* : Tambah tagihan baru\n` +
                    `*.cek* : Cek tagihan yang belum dibayar\n` +
                    `*.don <id_tagihan>* : Tandai tagihan sebagai sudah dibayar\n` +
                    `*.edit <id_tagihan> <nama> <jumlah>* : Edit tagihan\n` +
                    `*.buat-tagihan* : Buat tagihan baru\n` +
                    `*.help* : Tampilkan bantuan\n\n` +
                    `*[Converter]*\n` +
                    `*.mulai-gabung* : Mulai proses penggabungan file\n` +
                    `*.batal-gabung* : Batalkan proses penggabungan file\n` +
                    `*.gabungpdf* : Gabungkan file PDF\n` +
                    `*.word2pdf* : Konversi Word ke PDF\n` +
                    `*.image2pdf* : Konversi gambar ke PDF\n\n` +
                    `*[Downloader]*\n` +
                    `*.mp3 <URL>* : Unduh audio dari YouTube sebagai MP3\n` +
                    `*.mp4 <URL>* : Unduh video dari YouTube sebagai MP4\n\n` +
                    `*[Pengingat]*\n` +
                    `*.ingetin "pesan" waktu* : .ingetin "sarapan" besok 07.00\n\n` +
                    `*[Admin]*\n` +
                    `*.add @user* : Tambah anggota grup\n` +
                    `*.kick @user* : Keluarkan anggota grup\n\n` +
                    `*[Lainnya]*\n` +
                    `*.info* : Tampilkan ID grup ini\n` +
                    `*.ping* : Cek koneksi bot\n`;
                    
                await sock.sendMessage(chatId, { text: menuText });
            }
        }
    });
}

connectToWhatsApp();