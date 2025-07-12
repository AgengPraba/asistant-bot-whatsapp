/*
  Warnings:

  - You are about to drop the column `targetId` on the `Pengingat` table. All the data in the column will be lost.
  - Added the required column `userId` to the `Pengingat` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Pengingat" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL,
    "pesan" TEXT NOT NULL,
    "waktu" DATETIME NOT NULL,
    "sudahDikirim" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Pengingat" ("id", "pesan", "sudahDikirim", "waktu") SELECT "id", "pesan", "sudahDikirim", "waktu" FROM "Pengingat";
DROP TABLE "Pengingat";
ALTER TABLE "new_Pengingat" RENAME TO "Pengingat";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
