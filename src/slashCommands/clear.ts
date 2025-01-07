import {
	MessageFlags,
	PermissionFlagsBits,
	SlashCommandBuilder,
	TextChannel,
} from "discord.js"
import { SlashCommand } from "../types"

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
				.setRequired(true)
		})
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
	execute: async (interaction) => {
		if (!interaction.guild) {
			await interaction.reply({
				content: "Cette commande doit être utilisée dans un serveur Discord.",
				flags: MessageFlags.Ephemeral,
			})
			return
		}

		const amount = interaction.options.get("amount")!.value!.toString()

		const channel = interaction.channel as TextChannel

		if (!channel || !channel.bulkDelete) {
			await interaction.reply({
				content:
					"Cette commande ne peut être utilisée que dans un canal de texte.",
				flags: MessageFlags.Ephemeral,
			})
			return
		}

		if (amount === "all") {
			try {
				const messages = await channel.messages.fetch()

				// Filtrer les messages de moins de 14 jours
				const messagesUnder14Days = messages.filter(
					(message) =>
						message.createdAt > new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
				)

				if (messagesUnder14Days.size === 0) {
					await interaction.reply({
						content: "Aucun message à supprimer n'a été trouvé.",
						flags: MessageFlags.Ephemeral,
					})
					return
				}

				await channel.bulkDelete(messagesUnder14Days)
				await interaction.reply({
					content: `${messagesUnder14Days.size} messages ont été supprimés.`,
					flags: MessageFlags.Ephemeral,
				})
			} catch (error) {
				console.error("Erreur lors de la suppression des messages:", error)
				await interaction.reply({
					content:
						"Une erreur est survenue lors de la suppression des messages.",
					flags: MessageFlags.Ephemeral,
				})
			}
		} else {
			await channel.bulkDelete(
				await channel.messages.fetch({ limit: parseInt(amount) })
			)
			await interaction.reply({
				content: `Les ${amount} derniers messages ont été supprimés.`,
				flags: MessageFlags.Ephemeral,
			})
		}
	},
}
