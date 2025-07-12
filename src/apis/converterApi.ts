import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';


const gotenbergUrl = 'http://localhost:3000';

export async function convertWithGotenberg(inputPath: string): Promise<Buffer> {
    console.log(`Mengirim file ke rute LibreOffice Gotenberg...`);

    const form = new FormData();
    form.append('files', fs.createReadStream(inputPath));

    try {
        const response = await axios.post(
            `${gotenbergUrl}/forms/libreoffice/convert`, 
            form, 
            {
                headers: {
                    ...form.getHeaders(),
                },
                responseType: 'arraybuffer',
            }
        );
        
        console.log('Konversi via rute LibreOffice Gotenberg berhasil.');
        return response.data;

    } catch (error: any) {
        console.error("Gagal berkomunikasi dengan Gotenberg:", error.response?.data?.toString() || error.message);
        throw new Error("Gagal mengonversi file dengan Gotenberg.");
    }
}