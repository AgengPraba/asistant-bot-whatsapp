import path from 'path';
import fs from 'fs/promises';
import { convertWithGotenberg } from '../apis/converterApi';
import { PDFDocument } from 'pdf-lib';
import { v4 as uuidv4 } from 'uuid';

const uploadsDir = path.join(__dirname, '../../uploads');
const downloadsDir = path.join(__dirname, '../../downloads');

// Memastikan direktori ada
const ensureDirs = async () => {
    await fs.mkdir(uploadsDir, { recursive: true });
    await fs.mkdir(downloadsDir, { recursive: true });
};
ensureDirs();

// 1. Fungsi Word ke PDF
export async function convertWordToPdf(inputPath: string): Promise<string> {
    // Panggil fungsi dari file API yang baru
    const pdfBuffer = await convertWithGotenberg(inputPath);
    
    // Simpan buffer hasil konversi ke file lokal
    const outputPath = path.join(downloadsDir, `${uuidv4()}.pdf`);
    await fs.writeFile(outputPath, pdfBuffer);
    
    return outputPath;
}

// 2. Fungsi Image ke PDF
export async function convertImageToPdf(inputPath: string): Promise<string> {
    const imageBytes = await fs.readFile(inputPath);
    const pdfDoc = await PDFDocument.create();
    
    // Mendukung JPG dan PNG
    const image = inputPath.endsWith('.png') 
        ? await pdfDoc.embedPng(imageBytes) 
        : await pdfDoc.embedJpg(imageBytes);

    const page = pdfDoc.addPage([image.width, image.height]);
    page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });

    const pdfBytes = await pdfDoc.save();
    const outputPath = path.join(downloadsDir, `${uuidv4()}.pdf`);
    await fs.writeFile(outputPath, pdfBytes);
    return outputPath;
}

// 3. Fungsi Merge PDF
export async function mergePdfs(pdfPaths: string[]): Promise<string> {
    const mergedPdf = await PDFDocument.create();
    for (const pdfPath of pdfPaths) {
        const pdfBytes = await fs.readFile(pdfPath);
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    const pdfBytes = await mergedPdf.save();
    const outputPath = path.join(downloadsDir, `merged-${uuidv4()}.pdf`);
    await fs.writeFile(outputPath, pdfBytes);
    return outputPath;
}