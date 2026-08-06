-- AlterTable
ALTER TABLE "WeddingPhoto" ADD COLUMN "mediaType" VARCHAR(16) NOT NULL DEFAULT 'image';

-- CreateIndex
CREATE INDEX "WeddingPhoto_mediaType_createdAt_idx" ON "WeddingPhoto"("mediaType", "createdAt");
