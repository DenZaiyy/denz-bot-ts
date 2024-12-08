import { Events, GuildMember, Guild } from "discord.js";
import { BotEvent } from "../types";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const event: BotEvent = {
    name: Events.GuildMemberAdd,
    once: false,
    execute: async (guild: Guild, member: GuildMember) => {
        try {
            // Ajouter le member à la base de données par rapport au serveur
            await prisma.member.create({
                data: {
                    userId: member.id,
                    userName: member.user.username,
                    role: member.roles.highest.name,
                    guildId: guild.id,
                    joinedAt: new Date(),
                },
            });
        } catch (error) {
            console.error(`❌ Error adding guild member: ${guild.name}`, error);
        } finally {
            // Toujours déconnecter Prisma
            await prisma.$disconnect();
        }
    },
};

export default event;
