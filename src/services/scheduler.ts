import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export function startSchedulers(sock: any) {
    console.log('⏰ Pengingat diaktifkan.');

    // Jalankan tugas setiap menit
    cron.schedule('* * * * *', async () => {
        const now = new Date();

        const reminders = await prisma.pengingat.findMany({
            where: {
                waktu: {
                    lte: now, // lte = Less Than or Equal to (lebih kecil atau sama dengan)
                },
                sudahDikirim: false,
            },
        });

        for (const reminder of reminders) {
            try {
                await sock.sendMessage(reminder.userId, {
                    text: `🔔 *PENGINGAT UNTUK ANDA* 🔔\n\n"${reminder.pesan}"`
                });

                await prisma.pengingat.update({
                    where: { id: reminder.id },
                    data: { sudahDikirim: true },
                });
                console.log(`Pengingat ID ${reminder.id} terkirim ke ${reminder.userId}`);

            } catch (error) {
                console.error(`Gagal mengirim pengingat ID ${reminder.id}:`, error);
            }
        }
    }, {
        // schedule: true,
        timezone: "Asia/Jakarta"
    });
}