// src/services/downloaderService.ts

import YTDlpWrap from 'yt-dlp-wrap';
import path from 'path';

// Inisialisasi yt-dlp-wrap
const ytDlpWrap = new YTDlpWrap();

// Path ke direktori downloads
const downloadsDir = path.join(__dirname, '../../downloads');

/**
 * Mengunduh video dari URL dan mengembalikannya sebagai MP3.
 * @param url URL video (YouTube, TikTok, dll.)
 * @returns Path ke file MP3 yang sudah diunduh.
 */
export async function downloadAsMp3(url: string): Promise<string> {
    console.log(`Memulai unduhan MP3 dari: ${url}`);
    
    // Mendapatkan metadata untuk nama file
    const metadata = await ytDlpWrap.getVideoInfo(url);
    const safeTitle = metadata.title.replace(/[^a-zA-Z0-9\s-]/g, '').substring(0, 50).trim();
    const outputPath = path.join(downloadsDir, `${safeTitle}.mp3`);

    // Menjalankan perintah yt-dlp
    await ytDlpWrap.execPromise([
        url,
        '-x', // Ekstrak audio
        '--audio-format', 'mp3',
        '--audio-quality', '0', // Kualitas terbaik
        '-o', outputPath, // Tentukan path output
    ]);

    console.log(`Unduhan MP3 selesai: ${outputPath}`);
    return outputPath;
}

/**
 * Mengunduh video dari URL sebagai file MP4.
 * @param url URL video (YouTube, TikTok, dll.)
 * @returns Path ke file MP4 yang sudah diunduh.
 */
export async function downloadAsMp4(url:string): Promise<string> {
    console.log(`Memulai unduhan MP4 dari: ${url}`);

    const metadata = await ytDlpWrap.getVideoInfo(url);
    const safeTitle = metadata.title.replace(/[^a-zA-Z0-9\s-]/g, '').substring(0, 50).trim();
    const outputPath = path.join(downloadsDir, `${safeTitle}.mp4`);

    // Menjalankan perintah yt-dlp tanpa flag '-f' agar otomatis memilih kualitas terbaik
    // Ini akan mengunduh video dan audio terbaik lalu menggabungkannya (butuh FFmpeg)
    await ytDlpWrap.execPromise([
        url,
        '--recode-video', 'mp4', // Pastikan outputnya selalu mp4
        '-o', outputPath,
    ]);

    console.log(`Unduhan MP4 selesai: ${outputPath}`);
    return outputPath;
}