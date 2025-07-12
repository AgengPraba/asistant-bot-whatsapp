// src/services/downloaderService.ts

import YTDlpWrap from 'yt-dlp-wrap';
import path from 'path';

const ytDlpWrap = new YTDlpWrap();

const downloadsDir = path.join(__dirname, '../../downloads');


export async function downloadAsMp3(url: string): Promise<string> {
    console.log(`Memulai unduhan MP3 dari: ${url}`);
    
    const metadata = await ytDlpWrap.getVideoInfo(url);
    const safeTitle = metadata.title.replace(/[^a-zA-Z0-9\s-]/g, '').substring(0, 50).trim();
    const outputPath = path.join(downloadsDir, `${safeTitle}.mp3`);

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

export async function downloadAsMp4(url:string): Promise<string> {
    console.log(`Memulai unduhan MP4 dari: ${url}`);

    const metadata = await ytDlpWrap.getVideoInfo(url);
    const safeTitle = metadata.title.replace(/[^a-zA-Z0-9\s-]/g, '').substring(0, 50).trim();
    const outputPath = path.join(downloadsDir, `${safeTitle}.mp4`);

    await ytDlpWrap.execPromise([
        url,
        '--recode-video', 'mp4',
        '-o', outputPath,
    ]);

    console.log(`Unduhan MP4 selesai: ${outputPath}`);
    return outputPath;
}