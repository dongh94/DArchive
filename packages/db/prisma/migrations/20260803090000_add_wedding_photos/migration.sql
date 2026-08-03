CREATE TABLE "WeddingPhoto" (
    "id" TEXT NOT NULL,
    "uploaderName" VARCHAR(40) NOT NULL,
    "storagePath" VARCHAR(255) NOT NULL,
    "publicUrl" VARCHAR(500) NOT NULL,
    "mimeType" VARCHAR(64) NOT NULL,
    "byteSize" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeddingPhoto_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WeddingPhoto_storagePath_key" ON "WeddingPhoto"("storagePath");
CREATE INDEX "WeddingPhoto_isVisible_createdAt_idx" ON "WeddingPhoto"("isVisible", "createdAt");
CREATE INDEX "WeddingPhoto_createdAt_idx" ON "WeddingPhoto"("createdAt");
