import {
    Events,
    ChannelType,
    TextChannel,
    GuildMember,
    GuildChannel,
} from "discord.js";
import { BotEvent } from "../types";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const event: BotEvent = {
    name: Events.GuildDelete,
    once: true,
    execute: async (guild) => {
        try {
            // Supprimer les channels crée dans la catégorie "denz-bot"
            const denzBotCategory = guild.channels.cache.find(
                (channel: GuildChannel) =>
                    channel?.type === ChannelType.GuildCategory &&
                    channel.name === "denz-bot"
            );

            if (denzBotCategory) {
                const channels = await denzBotCategory.children.fetch();

                for (const channel of channels) {
                    await channel.delete();
                }
                await denzBotCategory.delete();
            }

            // Supprimer le serveur de la base de données et tous ses membres

            await prisma.member.deleteMany({
                where: {
                    guildId: guild.id,
                },
            });

            await prisma.live.deleteMany({
                where: {
                    guildId: guild.id,
                },
            });

            await prisma.guild.delete({
                where: {
                    guildId: guild.id,
                },
            });
        } catch (error) {
            console.error(`❌ Error handling guild: ${guild.name}`, error);
        } finally {
            // Toujours déconnecter Prisma
            await prisma.$disconnect();
        }
    },
};

export default event;
