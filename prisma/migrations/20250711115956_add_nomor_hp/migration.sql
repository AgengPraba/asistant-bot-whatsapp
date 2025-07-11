/*
  Warnings:

  - You are about to drop the column `bulan` on the `TagihanListrik` table. All the data in the column will be lost.
  - Added the required column `nomorHp` to the `TagihanListrik` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TagihanListrik" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nama" TEXT NOT NULL,
    "nomorHp" TEXT NOT NULL,
    "jumlah" INTEGER NOT NULL,
    "sudahBayar" BOOLEAN NOT NULL DEFAULT false,
    "chatId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_TagihanListrik" ("chatId", "createdAt", "id", "jumlah", "nama", "sudahBayar") SELECT "chatId", "createdAt", "id", "jumlah", "nama", "sudahBayar" FROM "TagihanListrik";
DROP TABLE "TagihanListrik";
ALTER TABLE "new_TagihanListrik" RENAME TO "TagihanListrik";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
