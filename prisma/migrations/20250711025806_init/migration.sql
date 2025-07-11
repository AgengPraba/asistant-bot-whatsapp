-- CreateTable
CREATE TABLE "TagihanListrik" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nama" TEXT NOT NULL,
    "bulan" TEXT NOT NULL,
    "jumlah" INTEGER NOT NULL,
    "sudahBayar" BOOLEAN NOT NULL DEFAULT false,
    "chatId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Pengingat" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pesan" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "waktu" DATETIME NOT NULL,
    "sudahDikirim" BOOLEAN NOT NULL DEFAULT false
);
