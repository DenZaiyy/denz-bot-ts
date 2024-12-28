import { Events, GuildMember } from "discord.js";
import { BotEvent } from "../types";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const event: BotEvent = {
    name: Events.GuildMemberAdd,
    once: false,
    execute: async (member: GuildMember) => {
        const guild = member.guild;
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

            const guildData = await prisma.guild.findUnique({
                where: {
                    guildId: guild.id,
                },
                select: {
                    welcomeChannel: true,
                },
            });

            if (guildData && guildData.welcomeChannel) {
                const welcomeChannelId = guildData.welcomeChannel;

                const channel = await guild.channels.fetch(welcomeChannelId);

                if (channel && channel.isTextBased()) {
                    await channel.send(
                        `Bienvenue sur le serveur ${guild.name} ${member.user.username} !`
                    );
                } else {
                    console.warn(
                        `Le canal ${welcomeChannelId} pour le serveur ${guild.name} n'est pas un canal textuel ou n'existe pas.`
                    );
                }
            }
        } catch (error) {
            console.error(`❌ Error adding guild member: ${guild.name}`, error);
        } finally {
            // Toujours déconnecter Prisma
            await prisma.$disconnect();
        }
    },
};

export default event;
