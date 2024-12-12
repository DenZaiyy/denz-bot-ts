import {
    ChannelType,
    Guild,
    PermissionFlagsBits,
    SlashCommandBuilder,
} from "discord.js";
import { SlashCommand } from "../types";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const command: SlashCommand = {
    name: "setup",
    data: new SlashCommandBuilder()
        .setName("setup")
        .setDescription("Crée un channel pour les notifications de live.")
        .addStringOption((option) => {
            return option
                .setName("type")
                .setDescription("Type de channel à créer.")
                .setChoices(
                    {
                        name: "annoucement",
                        value: "annoucement",
                    },
                    {
                        name: "welcome",
                        value: "welcome",
                    }
                )
                .setRequired(true);
        })
        .addStringOption((option) => {
            return option
                .setName("name")
                .setDescription("Nom du channel.")
                .setRequired(false);
        })
        .addChannelOption((option) => {
            return option
                .setName("id")
                .setDescription(
                    "ID du channel existant à utiliser pour le type de channel."
                )
                .setRequired(false);
        })
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    execute: async (interaction) => {
        if (!interaction.guild) {
            await interaction.reply({
                content:
                    "Cette commande doit être utilisée dans un serveur Discord.",
                ephemeral: true,
            });
            return;
        }

        const guildId = interaction.guild.id;
        const type = interaction.options.get("type")?.value?.toString();
        const existingChannelId = interaction.options.get("id")?.channel?.id;
        const channelName = interaction.options.get("name")!.value!.toString();

        // Récupère tous les channels de la guilde
        const guildChannels = await interaction.guild.channels.fetch();

        // Recherche la catégorie "denz-bot"
        let denzBotCategory = guildChannels.find(
            (channel) =>
                channel?.type === ChannelType.GuildCategory &&
                channel.name === "denz-bot"
        );

        // Si la catégorie n'existe pas, la créer
        if (!denzBotCategory) {
            denzBotCategory = await interaction.guild.channels.create({
                name: "denz-bot",
                type: ChannelType.GuildCategory,
            });

            await denzBotCategory.permissionOverwrites.create(
                interaction.guild.roles.everyone,
                { ViewChannel: false }
            );
        }

        // Vérifie si un channel enfant du type existe déjà
        const existingChildChannel = guildChannels.find(
            (channel) =>
                channel?.parentId === denzBotCategory.id &&
                channel.name === type
        );

        let finalChannelId = existingChannelId;

        // Si aucun channel existant n'est fourni ou trouvé, le créer
        if (!existingChildChannel && !existingChannelId) {
            const newChannel = await interaction.guild.channels.create({
                name: channelName,
                type: ChannelType.GuildText,
                parent: denzBotCategory.id,
            });

            finalChannelId = newChannel.id;
        } else if (existingChildChannel) {
            finalChannelId = existingChildChannel.id;
        }

        // Met à jour la base de données avec l'ID du channel
        await prisma.guild.upsert({
            where: { guildId },
            update: {
                [`${type}Channel`]: finalChannelId,
            },
            create: {
                guildId,
                name: Guild.name, // Add the name property here
                [`${type}Channel`]: finalChannelId,
            },
        });

        // Répond à l'utilisateur
        await interaction.reply({
            content: `Le channel ${type} a été configuré avec succès : <#${finalChannelId}>`,
            ephemeral: true,
        });
    },
};
