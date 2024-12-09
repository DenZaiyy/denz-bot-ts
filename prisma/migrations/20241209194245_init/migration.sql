-- CreateTable
CREATE TABLE "Guild" (
    "guildId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "prefix" TEXT NOT NULL DEFAULT '!',
    "welcomeChannel" TEXT,
    "annoucementChannel" TEXT
);

-- CreateTable
CREATE TABLE "Member" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "joinedAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Member_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild" ("guildId") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Live" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "plateforme" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "guildId" TEXT,
    CONSTRAINT "Live_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild" ("guildId") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Guild_guildId_key" ON "Guild"("guildId");
