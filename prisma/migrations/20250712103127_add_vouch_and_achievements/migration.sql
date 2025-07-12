-- CreateTable
CREATE TABLE "Vouch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "voucherId" TEXT NOT NULL,
    "vouchedId" TEXT NOT NULL,
    "swapId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Vouch_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Vouch_vouchedId_fkey" FOREIGN KEY ("vouchedId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Vouch_swapId_fkey" FOREIGN KEY ("swapId") REFERENCES "SwapRequest" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Vouch_voucherId_vouchedId_swapId_key" ON "Vouch"("voucherId", "vouchedId", "swapId");
