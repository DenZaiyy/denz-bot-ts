import { Events, ChannelType, GuildChannel } from "discord.js"
import { BotEvent } from "../types"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const event: BotEvent = {
	name: Events.GuildUpdate,
	once: false,
	execute: async (oldGuild, newGuild) => {
		try {
			// check if oldGuild exists in database
			const old = await prisma.guild.findUnique({
				where: {
					guildId: oldGuild.id,
				},
			})

			if (old) {
				const oldName = old.name

				await prisma.guild.update({
					where: {
						guildId: newGuild.id,
					},
					data: {
						name: newGuild.name,
					},
				})

				console.log(`✅ Guild updated: ${oldName} | ${newGuild.name}`)
			} else {
				await prisma.guild.create({
					data: {
						guildId: newGuild.id,
						name: newGuild.name,
					},
				})
			}
		} catch (error) {
			console.error(`❌ Error updating guild: ${oldGuild.name}`, error)
		} finally {
			// Toujours déconnecter Prisma
			await prisma.$disconnect()
		}
	},
}

export default event
