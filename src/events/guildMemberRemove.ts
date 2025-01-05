import { Events, GuildMember } from "discord.js"
import { BotEvent } from "../types"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const event: BotEvent = {
	name: Events.GuildMemberRemove,
	once: false,
	execute: async (member: GuildMember) => {
		const guild = member.guild

		try {
			const guildData = await prisma.guild.findUnique({
				where: {
					guildId: guild.id,
				},
				select: {
					welcomeChannel: true,
				},
			})

			const memberData = await prisma.member.findFirst({
				where: {
					userId: member.id,
				},
			})

			if (guildData && guildData.welcomeChannel) {
				const welcomeChannelId = guildData.welcomeChannel

				const channel = await guild.channels.fetch(welcomeChannelId)

				if (channel && channel.isTextBased()) {
					await channel.send(
						`**${member.user.username}** a quitté le serveur !`
					)
				} else {
					console.warn(
						`Le canal ${welcomeChannelId} pour le serveur ${guild.name} n'est pas un canal textuel ou n'existe pas.`
					)
				}
			}

			if (memberData) {
				await prisma.member.delete({
					where: {
						id: memberData.id,
					},
				})
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
