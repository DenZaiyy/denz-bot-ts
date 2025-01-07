import {
	MessageFlags,
	PermissionFlagsBits,
	SlashCommandBuilder,
} from "discord.js"
import { SlashCommand } from "../types"
import { prisma, twitchAPI } from "../utils/variables"

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
					}
					/* {
                        name: "youtube",
                        value: "youtube",
                    } */
				)
				.setRequired(true)
		})
		.addStringOption((option) => {
			return option
				.setName("channel")
				.setDescription("Nom de la chaîne de diffusion.")
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

		const guildId = interaction.guild.id
		const platform = interaction.options.get("plateforme")!.value!.toString()

		const channel = interaction.options.get("channel")!.value!.toString()

		// check if the channel is valid on plateforme
		if (platform === "twitch") {
			// check if channelname is valid for twitch before creating subscription
			const twitchId = await twitchAPI.checkIfChannelExist(channel)

			if (twitchId.data.lenght === 0) {
				await interaction.reply({
					content: `❌ La chaîne ${channel} n'existe pas sur Twitch ❌`,
					flags: MessageFlags.Ephemeral,
				})
				return
			}
		}

		// vérifier si la chaîne est déjà enregistrer pour la plateforme

		const existingLivePlatform = await prisma.live.findFirst({
			where: {
				plateforme: platform,
				channel: channel,
				guildId: guildId,
			},
		})

		if (existingLivePlatform !== null) {
			// console.error("Live existant: ", existingLivePlatform);
			await prisma.live.delete({
				where: {
					id: existingLivePlatform.id,
				},
			})

			const broadcasterID = twitchAPI
				.getTwitchIDFromUsername(channel)
				.toString()

			await twitchAPI.deleteSubscriptionByBroascaster(broadcasterID)

			await interaction.reply({
				content: `❌ La chaîne ${platform} (${channel}) a été supprimée des notifications ❌`,
				flags: MessageFlags.Ephemeral,
			})
			return
		} else {
			try {
				await prisma.live.create({
					data: {
						plateforme: platform,
						channel: channel,
						guildId: guildId,
					},
				})
				await twitchAPI.createSubscription(channel)
				await interaction.reply({
					content: `✅ La chaîne ${platform} (${channel}) a été ajoutée à la liste de notification ! ✅`,
					flags: MessageFlags.Ephemeral,
				})
			} catch (error) {
				await interaction.reply({
					content: `❌ Erreur lors de la création de l'abonnement ❌`,
					flags: MessageFlags.Ephemeral,
				})
				console.log("Error creating subscriptions : ", error)
				return
			}
		}
	},
}
