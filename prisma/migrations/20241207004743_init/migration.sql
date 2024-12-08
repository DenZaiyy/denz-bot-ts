-- CreateTable
CREATE TABLE "Guild" (
    "guildId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "prefix" TEXT NOT NULL DEFAULT '!',
    "welcomeChannel" TEXT
);

-- CreateTable
CREATE TABLE "Member" (
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "joinedAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Member_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild" ("guildId") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Guild_guildId_key" ON "Guild"("guildId");

-- CreateIndex
CREATE UNIQUE INDEX "Member_userId_key" ON "Member"("userId");
