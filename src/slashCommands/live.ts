import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { SlashCommand } from "../types";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const command: SlashCommand = {
    name: "live",
    data: new SlashCommandBuilder()
        .setName("live")
        .setDescription("Système de notification de live par plateforme.")
        .addStringOption((option) => {
            return option
                .setName("plateforme")
                .setDescription("Nom de la plateforme.")
                .setChoices(
                    {
                        name: "twitch",
                        value: "twitch",
                    },
                    {
                        name: "youtube",
                        value: "youtube",
                    }
                )
                .setRequired(true);
        })
        .addStringOption((option) => {
            return option
                .setName("channel")
                .setDescription("Nom de la chaîne de diffusion.")
                .setRequired(true);
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
        const platform = interaction.options
            .get("plateforme")!
            .value!.toString();

        const channel = interaction.options.get("channel")!.value!.toString();

        console.log(`Plateforme: ${platform}, channel: ${channel}`);

        // vérifier si la chaîne est déjà enregistrer pour la plateforme

        const existingLivePlatform = await prisma.live.findFirst({
            where: {
                plateforme: platform,
                channel: channel,
                guildId: guildId,
            },
        });

        if (existingLivePlatform !== null) {
            console.error("Live existant: ", existingLivePlatform);
            await prisma.live.delete({
                where: {
                    id: existingLivePlatform.id,
                },
            });
            await interaction.reply({
                content: `❌ La chaîne ${platform} (${channel}) as été supprimer des notifications ❌`,
            });
            return;
        } else {
            await prisma.live.create({
                data: {
                    plateforme: platform,
                    channel: channel,
                    guildId: guildId,
                },
            });
            await interaction.reply({
                content: `✅ La chaîne ${platform} (${channel}) as été ajouté à la liste de notification ! ✅`,
            });
        }
    },
};
