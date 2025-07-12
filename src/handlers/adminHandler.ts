/**
 * Memeriksa apakah pengirim pesan adalah admin grup.
 * @param sock - Objek koneksi Baileys
 * @param chatId - ID grup
 * @param senderId - ID pengirim pesan
 * @returns true jika admin, false jika bukan
 */
async function isGroupAdmin(sock: any, chatId: string, senderId: string): Promise<boolean> {
    try {
        const metadata = await sock.groupMetadata(chatId);
        const participant = metadata.participants.find((p: any) => p.id === senderId);
        return participant?.admin === 'admin' || participant?.admin === 'superadmin';
    } catch (error) {
        console.error("Gagal memeriksa status admin:", error);
        return false;
    }
}

export async function addMember(sock: any, msg: any) {
    const chatId = msg.key.remoteJid;
    const senderId = msg.key.participant;
    const body = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
    const parts = body.split(' ');

    if (!(await isGroupAdmin(sock, chatId, senderId))) {
        return sock.sendMessage(chatId, { text: "Maaf, hanya admin yang bisa menggunakan perintah ini." }, { quoted: msg });
    }

    if (parts.length !== 2) {
        return sock.sendMessage(chatId, { text: "Format salah. Gunakan: *.add <nomorhp>*\nContoh: *.add 081234567890*" }, { quoted: msg });
    }

    let targetNumber = parts[1];

    targetNumber = targetNumber.replace(/[^0-9]/g, '').trim(); // Hapus karakter selain angka
    if (targetNumber.startsWith('0')) {
        targetNumber = '62' + targetNumber.substring(1);
    }

    //Buat JID dari nomor yang sudah diformat
    const targetJid = `${targetNumber}@s.whatsapp.net`;

    try {
        await sock.groupParticipantsUpdate(chatId, [targetJid], "add");
        console.log(`Berhasil mengirim undangan ke ${targetJid} untuk bergabung ke grup ${chatId}`);
        await sock.sendMessage(chatId, { text: `Undangan bergabung telah dikirim ke ${targetNumber}.` }, { quoted: msg });

    } catch (error) {
        console.error("Gagal menambahkan anggota:", error);
        await sock.sendMessage(chatId, { text: "Gagal menambahkan anggota. Pastikan nomor valid dan bot adalah admin." }, { quoted: msg });
    }
}

export async function removeMember(sock: any, msg: any) {
    const chatId = msg.key.remoteJid;
    const senderId = msg.key.participant;
    const mentionedJids = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

    if (!(await isGroupAdmin(sock, chatId, senderId))) {
        return sock.sendMessage(chatId, { text: "Maaf, hanya admin yang bisa menggunakan perintah ini." }, { quoted: msg });
    }

    if (mentionedJids.length === 0) {
        return sock.sendMessage(chatId, { text: "Format salah. Gunakan: *.kick @user*" }, { quoted: msg });
    }
    
    try {
        const targetUser = mentionedJids[0];
        await sock.groupParticipantsUpdate(chatId, [targetUser], "remove");
        console.log(`Berhasil mengeluarkan ${targetUser} dari grup ${chatId}`);
    } catch (error) {
        console.error("Gagal mengeluarkan anggota:", error);
        await sock.sendMessage(chatId, { text: "Gagal mengeluarkan anggota. Pastikan bot adalah admin." }, { quoted: msg });
    }
}