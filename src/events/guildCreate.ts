import { Events, GuildMember } from "discord.js"
import { BotEvent } from "../types"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const event: BotEvent = {
	name: Events.GuildCreate,
	once: false,
	execute: async (guild) => {
		try {
			// Vérifier si le serveur existe déjà dans la base de données
			const existingGuild = await prisma.guild.findUnique({
				where: {
					guildId: guild.id,
				},
			})

			if (!existingGuild) {
				// Ajouter le serveur à la base de données
				const newGuild = await prisma.guild.create({
					data: {
						guildId: guild.id,
						name: guild.name,
					},
				})

				// Récupérer les membres du serveur
				const members = await guild.members.fetch()

				// Préparer les données des membres
				const membersData = members
					.filter((member: GuildMember) => !member.user.bot) // Filtrer les bots
					.map((member: GuildMember) => ({
						userId: member.id,
						guildId: guild.id,
						userName: member.user.username,
						role: member.roles.highest.name,
						joinedAt: member.joinedAt || new Date(),
					}))

				// Ajouter les membres à la base de données
				if (membersData.length > 0) {
					await prisma.member.createMany({
						data: membersData,
					})
				}

				console.log(
					`✅ Guild: ${guild.name} added with ${membersData.length} members!`
				)
			} else {
				// Mettre à jour les informations du serveur
				await prisma.guild.update({
					where: {
						guildId: guild.id,
					},
					data: {
						name: guild.name,
					},
				})

				console.log(`✅ Guild: ${guild.name} updated!`)
			}

			// Recharger les commandes après l'ajout de la guild
			/* const commandHandler = require("../handlers/commandHandler");
            await commandHandler(guild.client); */

			console.log(`✅ Commands reloaded for new guild: ${guild.name}`)
		} catch (error) {
			console.error(`❌ Error handling guild: ${guild.name}`, error)
		} finally {
			// Toujours déconnecter Prisma
			await prisma.$disconnect()
		}
	},
}
export default event
