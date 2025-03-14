-- CreateTable
CREATE TABLE "FolderShare" (
    "id" TEXT NOT NULL,
    "expiredAt" TIMESTAMP(3) NOT NULL,
    "folderId" TEXT NOT NULL,

    CONSTRAINT "FolderShare_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FolderShare_folderId_key" ON "FolderShare"("folderId");

-- AddForeignKey
ALTER TABLE "FolderShare" ADD CONSTRAINT "FolderShare_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "Folder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
