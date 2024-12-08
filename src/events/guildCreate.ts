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
    name: Events.GuildCreate,
    once: false,
    execute: async (guild) => {
        try {
            // Trouver le canal de bienvenue
            const welcomeChannel = guild.channels.cache.find(
                (channel: GuildChannel) => {
                    return (
                        channel.type === ChannelType.GuildText &&
                        (channel.name.toLowerCase().includes("welcome") ||
                            channel.name.toLowerCase().includes("bienvenue"))
                    );
                }
            ) as TextChannel | undefined;

            // Vérifier si le serveur existe déjà dans la base de données
            const existingGuild = await prisma.guild.findUnique({
                where: {
                    guildId: guild.id,
                },
            });

            if (!existingGuild) {
                // Ajouter le serveur à la base de données
                const newGuild = await prisma.guild.create({
                    data: {
                        guildId: guild.id,
                        name: guild.name,
                        welcomeChannel: welcomeChannel
                            ? welcomeChannel.id
                            : null,
                    },
                });
                console.log(newGuild);

                prisma.$disconnect();

                // Récupérer les membres du serveur
                const members = await guild.members.fetch();

                // Préparer les données des membres
                const membersData = members
                    .filter((member: GuildMember) => !member.user.bot) // Filtrer les bots
                    .map((member: GuildMember) => ({
                        userId: member.id,
                        guildId: guild.id,
                        userName: member.user.username,
                        role: member.roles.highest.name,
                        joinedAt: member.joinedAt || new Date(),
                    }));

                // Ajouter les membres à la base de données
                if (membersData.length > 0) {
                    await prisma.member.createMany({
                        data: membersData,
                    });
                }

                console.log(
                    `✅ Guild: ${guild.name} added with ${membersData.length} members!`
                );
            } else {
                // Mettre à jour les informations du serveur
                await prisma.guild.update({
                    where: {
                        guildId: guild.id,
                    },
                    data: {
                        name: guild.name,
                        welcomeChannel: welcomeChannel
                            ? welcomeChannel.id
                            : null,
                    },
                });

                console.log(`✅ Guild: ${guild.name} updated!`);
            }
        } catch (error) {
            console.error(`❌ Error handling guild: ${guild.name}`, error);
        } finally {
            // Toujours déconnecter Prisma
            await prisma.$disconnect();
        }
    },
};

export default event;
