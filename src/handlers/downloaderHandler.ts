import fs from 'fs/promises';
import { downloadAsMp3, downloadAsMp4 } from '../services/downloaderService';

export async function handleDownloader(sock: any, msg: any) {
    const msgInfo = msg.message;
    const chatId = msg.key.remoteJid;
    
    const caption = (msgInfo?.imageMessage?.caption || msgInfo?.documentMessage?.caption || '').trim();
    
    const textBody = (msgInfo?.conversation || msgInfo?.extendedTextMessage?.text || '').trim();
    const command = caption || textBody;
    const url = (caption || textBody).split(' ')[1]; 

    if (command.startsWith('.mp3')) {
        if (!url) {
            await sock.sendMessage(chatId, { text: "Format salah. Gunakan: *.ytmp3 <URL>*" }, { quoted: msg });
            return;
        }
        try {
            await sock.sendMessage(chatId, { text: "🎧 Mengunduh audio, mohon tunggu..." }, { quoted: msg });
            const audioPath = await downloadAsMp3(url);
            await sock.sendMessage(chatId, { audio: { url: audioPath }, mimetype: 'audio/mp4' });
            // Hapus file setelah dikirim
            await fs.unlink(audioPath);
        } catch (error) {
            console.error("Gagal mengunduh audio:", error);
            await sock.sendMessage(chatId, { text: "Gagal mengunduh audio. Pastikan URL valid." }, { quoted: msg });
        }
        return;
    }

    if (command.startsWith('.mp4')) {
        if (!url) {
            await sock.sendMessage(chatId, { text: "Format salah. Gunakan: *.ytmp4 <URL>*" }, { quoted: msg });
            return;
        }
        try {
            await sock.sendMessage(chatId, { text: "🎬 Mengunduh video, mohon tunggu..." }, { quoted: msg });
            const videoPath = await downloadAsMp4(url);
            await sock.sendMessage(chatId, { video: { url: videoPath }, caption: "Ini videonya!" });
            // Hapus file setelah dikirim
            await fs.unlink(videoPath);
        } catch (error) {
            console.error("Gagal mengunduh video:", error);
            await sock.sendMessage(chatId, { text: "Gagal mengunduh video. Pastikan URL valid." }, { quoted: msg });
        }
        return;
    }
}