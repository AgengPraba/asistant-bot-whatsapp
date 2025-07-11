import * as venom from 'venom-bot';
import {tambahTagihan, cekTagihan, tandaiLunas, editTagihan, createTagihan, help } from './handlers/paymentHandler';
import { GRUP_ID_LISTRIK } from './config';

// Fungsi utama untuk menjalankan bot
function startBot() {
   venom.create({
      session: 'my-bot',
      headless: true,
      browserArgs: ['--headless=new', '--no-sandbox', '--disable-setuid-sandbox'],
    }).then((client) => {
        start(client);
    }).catch((error) => {
        console.error('Error saat membuat client:', error);
    });
}

function start(client: venom.Whatsapp) {
  console.log('✅ Client siap digunakan!');

  client.onMessage(async(message) => {
    //  console.log('--- Pesan Baru Diterima ---');
    //  console.log(`Dari: ${message.from}`);
    //  console.log(`Isi Pesan: ${message.body}`);
    //  console.log(`Apakah Grup: ${message.isGroupMsg}`);
    //  console.log(`Chat ID: ${message.chatId}`);
    //  console.log('---------------------------');

    // Respon chat pribadi
    if (!message.isGroupMsg) {
      if (message.body.trim().toLowerCase() === '.ping') {
        await client.sendText(message.from, 'Pong! 🏓');
      } else {
        await client.sendText(
          message.from,
          'orangnya lagi tidur, silahkan tinggalkan pesan atau gunakan perintah yang tersedia.',
        );
      }
    }

    //cek id grup
    if (message.isGroupMsg && message.body.trim().toLowerCase() === '.info') {
      console.log(`Chat ID: ${message.chatId}`);
    }

    // Fitur tagihan listrik (khusus grup kos)
    if (message.chatId === GRUP_ID_LISTRIK) {
      if (message.body.startsWith('.tambah')) {
        await tambahTagihan(client, message);
      } else if (message.body.startsWith('.cek')) {
        await cekTagihan(client, message);
      } else if (message.body.startsWith('.don')) {
        await tandaiLunas(client, message);
      } else if (message.body.startsWith('.edit')) {
        await editTagihan(client, message);
      } else if (message.body.startsWith('.buat-tagihan')) {
        await createTagihan(client, message);
      } else if (message.body.startsWith('.help')) {
        await help(client, message);
      }
    }
  });
}


startBot();