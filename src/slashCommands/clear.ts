import {
    PermissionFlagsBits,
    SlashCommandBuilder,
    TextBasedChannel,
    TextChannel,
} from "discord.js";
import { SlashCommand } from "../types";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const command: SlashCommand = {
    name: "clear",
    data: new SlashCommandBuilder()
        .setName("clear")
        .setDescription("Supprimer des messages dans un canal.")
        .addStringOption((option) => {
            return option
                .setName("amount")
                .setDescription("Nombre de messages à supprimer.")
                .addChoices(
                    {
                        name: "10",
                        value: "10",
                    },
                    {
                        name: "20",
                        value: "20",
                    },
                    {
                        name: "50",
                        value: "50",
                    },
                    {
                        name: "all",
                        value: "all",
                    }
                )
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
        const amount = interaction.options.get("amount")!.value!.toString();

        const channel = interaction.channel as TextChannel;

        if (!channel || !channel.bulkDelete) {
            await interaction.reply({
                content:
                    "Cette commande ne peut être utilisée que dans un canal de texte.",
                ephemeral: true,
            });
            return;
        }

        if (amount === "all") {
            const messages = await channel.messages.fetch();

            // check if messages are older than 14 days
            const messagesUnder14Days = messages.filter(
                (message) =>
                    message.createdAt <
                    new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
            );

            await channel.bulkDelete(messagesUnder14Days);
            await interaction.reply({
                content:
                    "Tous les messages inférieurs à 14 jours ont été supprimés.",
                ephemeral: true,
            });
        } else {
            await channel.bulkDelete(
                await channel.messages.fetch({ limit: parseInt(amount) })
            );
            await interaction.reply({
                content: `Les ${amount} derniers messages ont été supprimés.`,
                ephemeral: true,
            });
        }
    },
};
