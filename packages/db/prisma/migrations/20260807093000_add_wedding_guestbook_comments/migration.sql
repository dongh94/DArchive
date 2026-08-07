-- CreateTable
CREATE TABLE "WeddingGuestbookComment" (
    "id" TEXT NOT NULL,
    "guestbookEntryId" TEXT NOT NULL,
    "parentId" TEXT,
    "name" VARCHAR(40) NOT NULL,
    "message" VARCHAR(500) NOT NULL,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeddingGuestbookComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WeddingGuestbookComment_guestbookEntryId_isVisible_createdAt_idx" ON "WeddingGuestbookComment"("guestbookEntryId", "isVisible", "createdAt");

-- CreateIndex
CREATE INDEX "WeddingGuestbookComment_parentId_createdAt_idx" ON "WeddingGuestbookComment"("parentId", "createdAt");

-- AddForeignKey
ALTER TABLE "WeddingGuestbookComment" ADD CONSTRAINT "WeddingGuestbookComment_guestbookEntryId_fkey" FOREIGN KEY ("guestbookEntryId") REFERENCES "WeddingGuestbookEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeddingGuestbookComment" ADD CONSTRAINT "WeddingGuestbookComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "WeddingGuestbookComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
