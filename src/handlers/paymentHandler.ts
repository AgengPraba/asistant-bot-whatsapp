import { PrismaClient } from '@prisma/client';
import { ADMIN_NUMBER } from '../config';

const prisma = new PrismaClient();

const adminNumber = ADMIN_NUMBER;

const penghuniKos = [
    { nama: 'Ageng', nomorHp: '6285221217374@s.whatsapp.net', jumlah: 50000 },
    { nama: 'Kanjar', nomorHp: '6281214956028@s.whatsapp.net', jumlah: 50000 },
];

export async function tambahTagihan(sock: any, chatId: string, body: string, senderId: any, msg: any) {
    if (!adminNumber.includes(senderId)) return;

    const parts = body.split(' ');
    if (parts.length !== 3) {
        await sock.sendMessage(chatId, { text: 'Format salah. Gunakan: *.tambah <nama> <jumlah>*' }, { quoted: msg });
        return;
    }
    
    const nama = parts[1];
    const jumlah = parseInt(parts[2]);

    if (isNaN(jumlah)) {
        await sock.sendMessage(chatId, { text: 'Jumlah harus berupa angka.' }, { quoted: msg });
        return;
    }

    try {
        const tagihan = await prisma.tagihanListrik.create({
            data: { nama, jumlah, chatId, nomorHp: '' },
        });
        await sock.sendMessage(chatId, { text: `✅ Tagihan untuk *${nama}* sejumlah *Rp${jumlah.toLocaleString('id-ID')}* berhasil ditambahkan dengan ID: *${tagihan.id}*` }, { quoted: msg });
    } catch (error) {
        console.error(error);
        await sock.sendMessage(chatId, { text: 'Gagal menambahkan tagihan' }, { quoted: msg });
    }
}

export async function cekTagihan(sock: any, chatId: string, msg: any) {
    try {
        const semuaTagihan = await prisma.tagihanListrik.findMany({
            where: { sudahBayar: false, chatId: chatId },
        });

        if (semuaTagihan.length === 0) {
            await sock.sendMessage(chatId, { text: '🎉 Semua sudah bayar listrik yeayyy' });
            return;
        }

        let replyText = '*YANG BELUM BAYAR LISTRIK*\n\n';
        const mentions: string[] = [];
        semuaTagihan.forEach(t => {
            const userJid = t.nomorHp;
            if (userJid) {
                replyText += `*[${t.id}]*\t${t.nama}\t@${userJid.split('@')[0]}\tRp${t.jumlah.toLocaleString('id-ID')}\n`;
                mentions.push(userJid);
            } else {
                replyText += `*ID: ${t.id}* | Nama: ${t.nama} | Rp${t.jumlah.toLocaleString('id-ID')}\n`;
            }
        });

        await sock.sendMessage(chatId, { text: replyText, mentions: mentions });
    } catch (error) {
        console.error(error);
        await sock.sendMessage(chatId, { text: 'Gagal mengambil data tagihan.' }, { quoted: msg });
    }
}


export async function tandaiLunas(sock: any, chatId: string, body: string, senderId: any, msg: any) {
    if (!adminNumber.includes(senderId)) return;

    const parts = body.split(' ');
    if (parts.length !== 2) {
        await sock.sendMessage(chatId, { text: 'Format salah. Gunakan: *.don <id_tagihan>*' }, { quoted: msg });
        return;
    }

    const id = parseInt(parts[1]);
    if (isNaN(id)) {
        await sock.sendMessage(chatId, { text: 'ID Tagihan harus berupa angka.' }, { quoted: msg });
        return;
    }

    try {
        const updatedTagihan = await prisma.tagihanListrik.update({
            where: { id },
            data: { sudahBayar: true },
        });
        await sock.sendMessage(chatId, { text: `*${updatedTagihan.nama}* sudah bayar ✅` });
    } catch (error) {
        console.error(error);
        await sock.sendMessage(chatId, { text: `Gagal update. Pastikan ID Tagihan *${id}* benar dan belum lunas.` }, { quoted: msg });
    }
}


export async function editTagihan(sock: any, chatId: string, body: string, senderId: any, msg: any) {
    if (!adminNumber.includes(senderId)) return;

    const parts = body.split(' ');
    if (parts.length !== 4) {
        await sock.sendMessage(chatId, { text: 'Format salah. Gunakan: *.edit <id_tagihan> <nama> <jumlah>*' }, { quoted: msg });
        return;
    }

    const id = parseInt(parts[1]);
    if (isNaN(id)) {
        await sock.sendMessage(chatId, { text: 'ID Tagihan harus berupa angka.' }, { quoted: msg });
        return;
    }
    const nama = parts[2];
    const jumlah = parseInt(parts[3]);
    if (isNaN(jumlah)) {
        await sock.sendMessage(chatId, { text: 'Jumlah harus berupa angka.' }, { quoted: msg });
        return;
    }

    try {
        const updatedTagihan = await prisma.tagihanListrik.update({
            where: { id },
            data: { nama, jumlah },
        });
        await sock.sendMessage(chatId, { text: `✅ Tagihan dengan ID *${id}* berhasil diupdate:\nNama: *${updatedTagihan.nama}*\nJumlah: *Rp${updatedTagihan.jumlah.toLocaleString('id-ID')}*` });
    } catch (error) {
        console.error(error);
        await sock.sendMessage(chatId, { text: `Gagal update tagihan. Pastikan ID Tagihan *${id}* benar.` }, { quoted: msg });
    }
}


export async function createTagihan(sock: any, chatId: string, senderId: any) {
    if (!adminNumber.includes(senderId)) return;

    try {
        for (const penghuni of penghuniKos) {
            await prisma.tagihanListrik.create({
                data: {
                    nama: penghuni.nama,
                    jumlah: penghuni.jumlah,
                    chatId: chatId,
                    nomorHp: penghuni.nomorHp,
                },
            });
        }
        await sock.sendMessage(chatId, { text: '📌 Tagihan listrik berhasil dibuat untuk semua penghuni!' });
    } catch (error) {
        console.error('❌ Gagal membuat tagihan:', error);
        await sock.sendMessage(chatId, { text: '❌ Terjadi kesalahan saat membuat tagihan.' });
    }
}

export async function help(sock: any, chatId: string) {
    const helpText = `*Perintah yang tersedia:*\n
[Tambah tagihan baru]
*.tambah <nama> <jumlah>*

[Cek yang belum bayar]
*.cek*

[Tandai yang udah bayar]
*.don <id>*

[Edit tagihan]
*.edit <id> <nama> <jumlah>*

[Buat tagihan untuk semua penghuni]
*.buat-tagihan*

[Menampilkan daftar perintah]
*.help*: Tampilkan daftar perinth`;
    
    await sock.sendMessage(chatId, { text: helpText });
}