import { EmbedBuilder, SlashCommandBuilder } from "discord.js"
import { SlashCommand } from "../types"

export const command: SlashCommand = {
	name: "ping",
	data: new SlashCommandBuilder()
		.setName("ping")
		.setDescription("Reply with ping of the bot."),
	execute: async (interaction) => {
		await interaction.reply({
			embeds: [
				new EmbedBuilder()
					.setAuthor({ name: "DenZaiyy" })
					.setDescription(`🏓 Pong! 🏓\nPing: ${interaction.client.ws.ping}ms`)
					.setColor("#ff8e4d"),
			],
		})
	},
}
