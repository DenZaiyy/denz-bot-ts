import { Message, SlashCommandBuilder } from "discord.js";
import { SlashCommand } from "../types";

export const command: SlashCommand = {
    name: "react",
    data: new SlashCommandBuilder()
        .setName("react")
        .setDescription("Reply with reaction."),
    execute: async (interaction) => {
        const message: Message = await interaction.reply({
            content: "React to this message!",
            fetchReply: true,
        });

        await message.react("👍");
    },
};
