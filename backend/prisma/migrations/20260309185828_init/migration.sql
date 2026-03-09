-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscogsConnection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "discogsUsername" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "accessTokenSecret" TEXT NOT NULL,
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastValidatedAt" TIMESTAMP(3),
    "lastSyncStartedAt" TIMESTAMP(3),
    "lastSyncCompletedAt" TIMESTAMP(3),
    "syncStatus" TEXT NOT NULL DEFAULT 'idle',

    CONSTRAINT "DiscogsConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "discogsReleaseId" INTEGER NOT NULL,
    "discogsInstanceId" INTEGER NOT NULL,
    "folderId" INTEGER NOT NULL DEFAULT 0,
    "folderName" TEXT,
    "artist" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "year" INTEGER,
    "country" TEXT,
    "coverImageUrl" TEXT,
    "thumbImageUrl" TEXT,
    "dateAdded" TIMESTAMP(3),
    "rawJson" JSONB NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CollectionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionItemGenre" (
    "id" TEXT NOT NULL,
    "collectionItemId" TEXT NOT NULL,
    "genre" TEXT NOT NULL,

    CONSTRAINT "CollectionItemGenre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionItemStyle" (
    "id" TEXT NOT NULL,
    "collectionItemId" TEXT NOT NULL,
    "style" TEXT NOT NULL,

    CONSTRAINT "CollectionItemStyle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionItemFormat" (
    "id" TEXT NOT NULL,
    "collectionItemId" TEXT NOT NULL,
    "format" TEXT NOT NULL,

    CONSTRAINT "CollectionItemFormat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionItemLabel" (
    "id" TEXT NOT NULL,
    "collectionItemId" TEXT NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "CollectionItemLabel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReleaseValueSnapshot" (
    "id" TEXT NOT NULL,
    "collectionItemId" TEXT NOT NULL,
    "lowestPrice" DECIMAL(65,30),
    "medianValue" DECIMAL(65,30),
    "numForSale" INTEGER,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReleaseValueSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncJob" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "itemsProcessed" INTEGER NOT NULL DEFAULT 0,
    "pagesProcessed" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SyncJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DiscogsConnection_userId_key" ON "DiscogsConnection"("userId");

-- CreateIndex
CREATE INDEX "CollectionItem_userId_idx" ON "CollectionItem"("userId");

-- CreateIndex
CREATE INDEX "CollectionItem_userId_isDeleted_idx" ON "CollectionItem"("userId", "isDeleted");

-- CreateIndex
CREATE UNIQUE INDEX "CollectionItem_userId_discogsInstanceId_key" ON "CollectionItem"("userId", "discogsInstanceId");

-- CreateIndex
CREATE INDEX "CollectionItemGenre_collectionItemId_idx" ON "CollectionItemGenre"("collectionItemId");

-- CreateIndex
CREATE INDEX "CollectionItemStyle_collectionItemId_idx" ON "CollectionItemStyle"("collectionItemId");

-- CreateIndex
CREATE INDEX "CollectionItemFormat_collectionItemId_idx" ON "CollectionItemFormat"("collectionItemId");

-- CreateIndex
CREATE INDEX "CollectionItemLabel_collectionItemId_idx" ON "CollectionItemLabel"("collectionItemId");

-- CreateIndex
CREATE INDEX "ReleaseValueSnapshot_collectionItemId_idx" ON "ReleaseValueSnapshot"("collectionItemId");

-- CreateIndex
CREATE INDEX "SyncJob_userId_idx" ON "SyncJob"("userId");

-- AddForeignKey
ALTER TABLE "DiscogsConnection" ADD CONSTRAINT "DiscogsConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionItem" ADD CONSTRAINT "CollectionItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionItemGenre" ADD CONSTRAINT "CollectionItemGenre_collectionItemId_fkey" FOREIGN KEY ("collectionItemId") REFERENCES "CollectionItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionItemStyle" ADD CONSTRAINT "CollectionItemStyle_collectionItemId_fkey" FOREIGN KEY ("collectionItemId") REFERENCES "CollectionItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionItemFormat" ADD CONSTRAINT "CollectionItemFormat_collectionItemId_fkey" FOREIGN KEY ("collectionItemId") REFERENCES "CollectionItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionItemLabel" ADD CONSTRAINT "CollectionItemLabel_collectionItemId_fkey" FOREIGN KEY ("collectionItemId") REFERENCES "CollectionItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReleaseValueSnapshot" ADD CONSTRAINT "ReleaseValueSnapshot_collectionItemId_fkey" FOREIGN KEY ("collectionItemId") REFERENCES "CollectionItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncJob" ADD CONSTRAINT "SyncJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
