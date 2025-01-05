import { EmbedBuilder, Events, GuildMember, Colors } from "discord.js"
import { BotEvent } from "../types"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const event: BotEvent = {
	name: Events.GuildMemberAdd,
	once: false,
	execute: async (member: GuildMember) => {
		const guild = member.guild

		const colors = [
			Colors.Red,
			Colors.Green,
			Colors.Blue,
			Colors.Yellow,
			Colors.Purple,
		]

		const embed = new EmbedBuilder()
			.setColor(colors[Math.floor(Math.random() * colors.length)])
			.setDescription(
				`${member.user.username} nous a rejoint !\n\nBienvenue sur le serveur !`
			)
			.setThumbnail(guild.iconURL())
			.setAuthor({
				name: member.user.username,
				iconURL: member.user.avatarURL() || undefined,
			})
			.setTimestamp()

		try {
			// Ajouter le member à la base de données par rapport au serveur
			await prisma.member.create({
				data: {
					userId: member.id,
					userName: member.user.username,
					role: member.roles.highest.name,
					guildId: guild.id,
					joinedAt: new Date(),
				},
			})

			const guildData = await prisma.guild.findUnique({
				where: {
					guildId: guild.id,
				},
				select: {
					welcomeChannel: true,
				},
			})

			if (guildData && guildData.welcomeChannel) {
				const welcomeChannelId = guildData.welcomeChannel

				const channel = await guild.channels.fetch(welcomeChannelId)

				if (channel && channel.isTextBased()) {
					await channel.send({ embeds: [embed] })
				} else {
					console.warn(
						`Le canal ${welcomeChannelId} pour le serveur ${guild.name} n'est pas un canal textuel ou n'existe pas.`
					)
				}
			}
		} catch (error) {
			console.error(`❌ Error adding guild member: ${guild.name}`, error)
		} finally {
			// Toujours déconnecter Prisma
			await prisma.$disconnect()
		}
	},
}

export default event
