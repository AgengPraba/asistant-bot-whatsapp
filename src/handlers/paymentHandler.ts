import { PrismaClient } from '@prisma/client';
import type { Whatsapp, Message } from 'venom-bot';
import { ADMIN_NUMBER } from '../config';

const prisma = new PrismaClient();


const adminNumber = ADMIN_NUMBER;

const penghuniKos = [
  { nama: 'Ageng', nomorHp: '085221217374', jumlah: 50000 },
  { nama: 'Kanjar', nomorHp: '081214956028', jumlah: 50000 },
];

// perintah : .tambah <nama> <jumlah>
// Contoh: .tambah budi 50000
export async function tambahTagihan(client: Whatsapp, message: Message) {
  const pengirim = message.sender.id; 

  if (!adminNumber.includes(pengirim)) {
    return;
  }
  const parts = message.body.split(' ');
  if (parts.length !== 3) {
    await client.reply(message.from, 'Format salah. Gunakan: *.tambah <nama> <jumlah>*', message.id);
    return;
  }
  
  const nama = parts[1];
  const jumlah = parseInt(parts[2]);

  if (isNaN(jumlah)) {
    await client.reply(message.from, 'Jumlah harus berupa angka.', message.id);
    return;
  }

  try {
    const tagihan = await prisma.tagihanListrik.create({
      data: {
        nama,
        jumlah,
        chatId: message.from,
        nomorHp: '',
      },
    });
    await client.reply(message.from, `✅ Tagihan untuk *${nama}* sejumlah *Rp${jumlah.toLocaleString('id-ID')}* berhasil ditambahkan dengan ID: *${tagihan.id}*`, message.id);
  } catch (error) {
    console.error(error);
    await client.reply(message.from, 'Gagal menambahkan tagihan', message.id);
  }
}

// perintah: .cek <nama> <tagihan>
export async function cekTagihan(client: Whatsapp, message: Message) {
  try {
    const semuaTagihan = await prisma.tagihanListrik.findMany({
      where: { sudahBayar: false, chatId: message.from },
    });

    if (semuaTagihan.length === 0) {
      await client.sendText(message.from, '🎉 Semua sudah bayar listrik yeayyy');
      return;
    }

    let replyText = '*YANG BELUM BAYAR LISTRIK*\n\n';
    semuaTagihan.forEach(t => {
      replyText += `*ID_tagihan: ${t.id}*\tNama: ${t.nama} @${t.nomorHp}\tJumlah: Rp${t.jumlah.toLocaleString('id-ID')}\n`;
    });

    await client.sendText(message.from, replyText);
  } catch (error) {
    console.error(error);
    await client.reply(message.from, 'Gagal mengambil data tagihan.', message.id);
  }
}

// Perintah: .lunas <id_tagihan>
export async function tandaiLunas(client: Whatsapp, message: Message) {
  const pengirim = message.sender.id; 
  if (!adminNumber.includes(pengirim)) {
    return;
  }

  const parts = message.body.split(' ');
  if (parts.length !== 2) {
    await client.reply(message.from, 'Format salah. Gunakan: *.don <id_tagihan>*', message.id);
    return;
  }

  const id = parseInt(parts[1]);
  if (isNaN(id)) {
    await client.reply(message.from, 'ID Tagihan harus berupa angka.', message.id);
    return;
  }

  try {
    const updatedTagihan = await prisma.tagihanListrik.update({
      where: { id },
      data: { sudahBayar: true },
    });
    await client.sendText(message.from, `*${updatedTagihan.nama}* sudah bayar ✅`);
  } catch (error) {
    console.error(error);
    await client.reply(message.from, `Gagal update. Pastikan ID Tagihan *${id}* benar dan belum lunas.`, message.id);
  }
}

// Perintah: .edit <id_tagihan> <nama> <jumlah>
export async function editTagihan(client: Whatsapp, message: Message) {
  const pengirim = message.sender.id; 

  if (!adminNumber.includes(pengirim)) {
    return;
  }

  const parts = message.body.split(' ');
  if (parts.length !== 4) {
    await client.reply(message.from, 'Format salah. Gunakan: *.edit <id_tagihan> <nama>*', message.id);
    return;
  }

  const isBayar = await prisma.tagihanListrik.findUnique({
    where: { id: parseInt(parts[1]) },
  });

  const id = parseInt(parts[1]);
  const nama = parts[2];

  if (!isBayar) {
    await client.reply(message.from, `❌ Tagihan dengan ID ${id} tidak ditemukan.`, message.id);
    return;
  }

  const sudahBayar = !isBayar['sudahBayar'];

  if (isNaN(id)) {
    await client.reply(message.from, 'ID Tagihan harus berupa angka.', message.id);
    return;
  }

  try {
    const updatedTagihan = await prisma.tagihanListrik.update({
      where: { id },
      data: { nama, sudahBayar },
    });
    await client.sendText(message.from, `✅ Tagihan dengan ID *${id}* berhasil diupdate:\nNama: *${updatedTagihan.nama}*\nJumlah: *Rp${updatedTagihan.jumlah.toLocaleString('id-ID')}*`);
  } catch (error) {
    console.error(error);
    await client.reply(message.from, `Gagal update tagihan. Pastikan ID Tagihan *${id}* benar.`, message.id);
  }
}


// Perintah: .buat-tagihan
export async function createTagihan(client: Whatsapp, message: Message) {
  const pengirim = message.sender.id;

  if (!adminNumber.includes(pengirim)) {
    return;
  }

  const groupId = message.from;

  try {
    for (const penghuni of penghuniKos) {
      await prisma.tagihanListrik.create({
        data: {
          nama: penghuni.nama,
          jumlah: penghuni.jumlah,
          chatId: groupId,
          nomorHp: penghuni.nomorHp,
        },
      });
    }

    await client.sendText(groupId, '📌 Tagihan listrik berhasil dibuat!');
  } catch (error) {
    console.error('❌ Gagal membuat tagihan:', error);
    await client.sendText(groupId, '❌ Terjadi kesalahan saat membuat tagihan.');
  }
}


// perintah : .help
export async function help(client: Whatsapp, message: Message) {
  const helpText = `*Perintah yang tersedia:*\n
- *.tambah <nama> <jumlah>*: Tambah tagihan baru\n
- *.cek*: Cek semua tagihan yang belum lunas\n
- *.don <id>*: Tandai tagihan sebagai lunas\n
- *.edit <id> <nama> <jumlah>*: Edit tagihan\n
- *.buat-tagihan*: Buat tagihan untuk penghuni kos\n
- *.help*: Tampilkan daftar perintah\n\n
*Contoh penggunaan:*\n
- *.tambah Bahlil 50000*\n
- *.cek*\n
- *.don 1*\n
- *.edit 1 Bahlil 60000*\n
- *.buat-tagihan*\n
- *.help*`;

  await client.sendText(message.from, helpText);
} 