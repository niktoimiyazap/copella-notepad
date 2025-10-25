-- CreateTable
CREATE TABLE "YjsUpdate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "docName" TEXT NOT NULL,
    "update" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "YjsUpdate_docName_idx" ON "YjsUpdate"("docName");

-- CreateIndex
CREATE INDEX "YjsUpdate_createdAt_idx" ON "YjsUpdate"("createdAt");
