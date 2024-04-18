import { SlashCommandBuilder } from "discord.js";
import { SlashCommand } from "../types";

export const command: SlashCommand = {
    name: "message",
    data: new SlashCommandBuilder()
        .setName("message")
        .setDescription("Reply with reaction.")
        .addStringOption((option) => {
            return option
                .setName("message")
                .setDescription("The content of the message.")
                .setRequired(true);
        }),
    execute: async (interaction) => {
        const message = interaction.options.get("message").value.toString();

        await interaction.reply({
            content: `Content: ${message}`,
        });
    },
};
