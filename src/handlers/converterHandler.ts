// src/handlers/assistantHandler.ts

import { downloadMediaMessage } from '@whiskeysockets/baileys';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { convertWordToPdf, convertImageToPdf, mergePdfs } from '../services/converterService';


interface MergeSession {
    isActive: boolean;
    files: string[];
}
const pdfMergeStore = new Map<string, MergeSession>();


export async function handleConverter(sock: any, msg: any) {
    const msgInfo = msg.message;
    const chatId = msg.key.remoteJid;
    const caption = (msgInfo?.imageMessage?.caption || msgInfo?.documentMessage?.caption || '').trim().toLowerCase();
    const textBody = (msgInfo?.conversation || msgInfo?.extendedTextMessage?.text || '').trim().toLowerCase();
    const command = caption || textBody;

    const isDocument = msgInfo?.documentMessage;
    const isImage = msgInfo?.imageMessage;
    const isPdf = isDocument && msgInfo.documentMessage.mimetype === 'application/pdf';


    if (command === '.mulai-gabung') {
        pdfMergeStore.set(chatId, { isActive: true, files: [] });
        await sock.sendMessage(chatId, { text: "✅ Mode penggabungan PDF dimulai.\n\nSilakan kirim file PDF Anda satu per satu. Ketik *.gabungpdf* jika sudah selesai atau *.batal-gabung* untuk membatalkan." }, { quoted: msg });
        return;
    }
    if (command === '.batal-gabung') {
        const session = pdfMergeStore.get(chatId);
        if (session) {
            // Hapus semua file yang sudah diunggah di sesi ini
            for (const filePath of session.files) {
                await fs.unlink(filePath).catch(e => console.error("Gagal hapus file saat batal:", e));
            }
            pdfMergeStore.delete(chatId);
            await sock.sendMessage(chatId, { text: "❌ Sesi penggabungan dibatalkan. Semua file telah dihapus." }, { quoted: msg });
        } else {
            await sock.sendMessage(chatId, { text: "Tidak ada sesi penggabungan yang aktif." }, { quoted: msg });
        }
        return;
    }

    // Mengeksekusi penggabungan
    if (command === '.gabungpdf') {
        const session = pdfMergeStore.get(chatId);
        if (!session || !session.isActive) {
            await sock.sendMessage(chatId, { text: "Anda belum memulai sesi. Ketik *.mulai-gabung* terlebih dahulu." }, { quoted: msg });
            return;
        }
        if (session.files.length < 2) {
            await sock.sendMessage(chatId, { text: "Anda perlu mengirim minimal 2 file PDF untuk digabungkan." }, { quoted: msg });
            return;
        }

        try {
            await sock.sendMessage(chatId, { text: `⚙️ Menggabungkan ${session.files.length} file PDF...` }, { quoted: msg });
            const outputPath = await mergePdfs(session.files);
            await sock.sendMessage(chatId, { document: { url: outputPath }, fileName: 'hasil-gabungan.pdf', mimetype: 'application/pdf' });
            
            // Hapus file sementara setelah berhasil
            session.files.forEach(filePath => fs.unlink(filePath).catch(e => console.error("Gagal hapus file input:", e)));
            fs.unlink(outputPath).catch(e => console.error("Gagal hapus file output:", e));

        } catch (error) {
            console.error("Gagal menggabungkan PDF:", error);
            await sock.sendMessage(chatId, { text: "Terjadi kesalahan saat menggabungkan PDF." }, { quoted: msg });
        } finally {
            pdfMergeStore.delete(chatId); // Selalu bersihkan sesi setelah selesai
        }
        return;
    }
    
    // Menerima file PDF HANYA jika sesi aktif
    if (isPdf) {
        const session = pdfMergeStore.get(chatId);
        if (session && session.isActive) {
            try {
                const buffer = await downloadMediaMessage(msg, 'buffer', {});
                const inputPath = path.join(__dirname, `../../uploads/${uuidv4()}.pdf`);
                await fs.writeFile(inputPath, buffer as Buffer);
                
                session.files.push(inputPath); // Tambahkan file ke sesi
                await sock.sendMessage(chatId, { text: `📄 PDF diterima. Total file: ${session.files.length}` }, { quoted: msg });
            } catch (error) {
                console.error("Gagal menyimpan PDF:", error);
            }
        }
        return; 
    }

    if ((isDocument || isImage) && caption) {
        let outputPath: string | null = null;
        let inputPath: string | null = null;
        let outputFileName = 'hasil.pdf';
        
        try {
            const buffer = await downloadMediaMessage(msg, 'buffer', {});
            const extension = isImage ? '.jpg' : path.extname(msgInfo.documentMessage.fileName);
            inputPath = path.join(__dirname, `../../uploads/${uuidv4()}${extension}`);
            await fs.writeFile(inputPath, buffer as Buffer);

            await sock.sendMessage(chatId, { text: "File diterima, sedang diproses..." }, { quoted: msg });

            if (caption === '.word2pdf') {
                outputPath = await convertWordToPdf(inputPath);
                outputFileName = path.basename(msgInfo.documentMessage.fileName, path.extname(msgInfo.documentMessage.fileName)) + '.pdf';
            } else if (caption === '.img2pdf') {
                outputPath = await convertImageToPdf(inputPath);
                outputFileName = `IMG-${new Date().toISOString()}.pdf`;
            }

            if (outputPath) {
                await sock.sendMessage(chatId, { document: { url: outputPath }, fileName: outputFileName, mimetype: 'application/pdf' });
            }

        } catch (error) {
            console.error("Gagal melakukan konversi:", error);
            await sock.sendMessage(chatId, { text: "Gagal memproses file Anda. Pastikan format dan perintah sudah benar." }, { quoted: msg });
        } finally {
            if (inputPath) await fs.unlink(inputPath).catch(e => console.error("Gagal hapus input file:", e));
            if (outputPath) await fs.unlink(outputPath).catch(e => console.error("Gagal hapus output file:", e));
        }
    }
}