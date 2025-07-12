import { PrismaClient } from '@prisma/client';
import * as chrono from 'chrono-node';

const prisma = new PrismaClient();

export async function handleReminder(sock: any, msg: any) {
    const chatId = msg.key.remoteJid;
    const body = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';

    // Pola: .ingatin "pesan" waktu
    const match = body.match(/^\.ingetin(?: saya)? "([^"]+)" (.+)/i);

    if (!match) {
        await sock.sendMessage(chatId, { text: 'Format salah. Gunakan:\n*.ingetin "Pesan Anda" <waktu>*\n\nContoh:\n.ingetin "jogging" 05:00' }, { quoted: msg });
        return;
    }

    const [, pesan, waktuText] = match;
    
    // Gunakan chrono-node untuk mengubah teks waktu menjadi objek Date
    const waktu = chrono.parseDate(waktuText, new Date(), { forwardDate: true });

    if (!waktu) {
        await sock.sendMessage(chatId, { text: `Maaf, saya tidak mengerti waktu "${waktuText}". Coba gunakan format seperti "besok 15:00" atau "13 Juli 2025 15:00".` }, { quoted: msg });
        return;
    }

    try {
        await prisma.pengingat.create({
            data: {
                userId: chatId,
                pesan,
                waktu,
            }
        });

        const formattedDate = waktu.toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' });
        await sock.sendMessage(chatId, { text: `✅ Pengingat diatur!\n\nSaya akan mengingatkan Anda untuk "*${pesan}*" pada *${formattedDate}*.` }, { quoted: msg });

    } catch (error) {
        console.error("Gagal menyimpan pengingat:", error);
        await sock.sendMessage(chatId, { text: "Gagal menyimpan pengingat ke database." }, { quoted: msg });
    }
}