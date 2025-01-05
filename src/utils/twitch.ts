import { config } from "../config"
import {
	DMChannel,
	EmbedBuilder,
	NewsChannel,
	TextChannel,
	Colors,
} from "discord.js"
import { client } from "../bot"
import { prisma, twitchAPI } from "./variables"

let notifiedChannels: { [key: string]: { [guildId: string]: boolean } } = {}
let userName = ""
let category = ""
let streamTitle = ""
let viewerCount = ""
let gameLink = ""
let width = 1920
let height = 1080

const colors = [
	Colors.Red,
	Colors.Blue,
	Colors.Gold,
	Colors.White,
	Colors.Yellow,
	Colors.Purple,
	Colors.Orange,
	Colors.Green,
]

export async function isStreamLive(
	oauthToken: string,
	channel: string
): Promise<boolean> {
	const url = `https://api.twitch.tv/helix/streams?user_login=${channel}`
	try {
		const response = await fetch(url, {
			headers: {
				"Client-Id": config.TWITCH_CLIENT_ID,
				Authorization: `Bearer ${oauthToken}`,
			},
		})

		const data = await response.json()

		if (data.data.length > 0) {
			userName = data.data[0]?.user_name
			category = data.data[0]?.game_name
			streamTitle = data.data[0]?.title
			viewerCount = data.data[0]?.viewer_count
			gameLink = await getGameLink(data.data[0]?.game_id)
		}

		return data.data.length > 0
	} catch (error) {
		console.error(`Error checking stream status for ${channel}:`, error)
		return false
	}
}

async function getGameLink(gameId: string): Promise<string> {
	const url = `https://api.twitch.tv/helix/games?id=${gameId}`
	try {
		const response = await fetch(url, {
			headers: {
				"Client-Id": config.TWITCH_CLIENT_ID,
				Authorization: `Bearer ${await twitchAPI.getTwitchOAuthToken()}`,
			},
		})
		const data = await response.json()

		const gameName = data.data[0]?.name
		const formattedGameName = gameName.replace(/ /g, "-")

		if (data.data.length === 0) {
			return ""
		}

		return `https://www.twitch.tv/directory/game/${formattedGameName.toLowerCase()}`
	} catch (error) {
		console.error(`Error getting game link for game id ${gameId}:`, error)
		return ""
	}
}

async function getTwitchAvatar(twitchChannel: string) {
	const url = `https://api.twitch.tv/helix/users?login=${twitchChannel}`

	try {
		const response = await fetch(url, {
			headers: {
				"Client-Id": config.TWITCH_CLIENT_ID,
				Authorization: `Bearer ${await twitchAPI.getTwitchOAuthToken()}`,
			},
		})

		const data = await response.json()

		const profilePicture = data.data[0].profile_image_url

		return profilePicture
	} catch (error) {
		console.error(`Error getting infos for ${twitchChannel} : `, error)
		return ""
	}
}

export async function sendStreamNotification(
	streamerName: string,
	guildId: string
) {
	const randomColor = colors[Math.floor(Math.random() * colors.length)]
	const embed = new EmbedBuilder()
		.setColor(randomColor)
		.setTitle("Twitch Live - ON")
		.setURL(`https://twitch.tv/${streamerName}`)
		.setDescription(
			`🚨 Hey les amies ! 🚨\n\nLe streamer **${userName}** a lancé son live sur twitch !\n\nN'hésite pas à lui rendre visite ici : https://twitch.tv/${streamerName}`
		)
		.setAuthor({
			name: client.user ? client.user.username : userName,
			iconURL: client.user ? client.user.displayAvatarURL() : "",
		})
		.setTimestamp()
		.addFields(
			{ name: "Titre:", value: streamTitle, inline: false },
			{ name: "Catégorie:", value: category, inline: true },
			{ name: "Viewers:", value: viewerCount.toString(), inline: true }
		)
		.setImage(
			`https://static-cdn.jtvnw.net/previews-ttv/live_user_${streamerName}-${width}x${height}.jpg`
		)
		.setThumbnail(await getTwitchAvatar(streamerName))
	try {
		const liveChannel = await prisma.guild.findUnique({
			select: {
				annoucementChannel: true,
				name: true,
			},
			where: {
				guildId: guildId,
			},
		})

		if (!liveChannel) {
			console.log(`Guild not found: ${guildId}`)
			return
		}

		if (!liveChannel.annoucementChannel) {
			console.log(
				`[${liveChannel.name}] No annoucement channel found for guild.`
			)
			return
		}

		const channel = await client.channels.fetch(liveChannel.annoucementChannel)

		if (
			channel instanceof TextChannel ||
			channel instanceof NewsChannel ||
			channel instanceof DMChannel
		) {
			await channel.send({ content: "@everyone", embeds: [embed] })
		} else {
			console.log(
				"Could not find the Discord channel or it is not a text channel."
			)
		}
	} catch (error) {
		console.error("Error sending notification to Discord channel:", error)
	}
}

export async function checkStreamStatus() {
	const oauthToken = await twitchAPI.getTwitchOAuthToken()
	if (!oauthToken) {
		console.log("Twitch OAuth token not found.")
		return
	}

	const channels = await prisma.live.findMany({
		select: {
			channel: true,
			guildId: true,
		},
		where: {
			plateforme: "twitch",
		},
	})

	for (const channel of channels) {
		const isLive = await isStreamLive(oauthToken, channel.channel)

		if (!notifiedChannels[channel.channel]) {
			notifiedChannels[channel.channel] = {}
		}

		const hasNotified = notifiedChannels[channel.channel][channel.guildId!]

		if (isLive && !hasNotified) {
			await sendStreamNotification(channel.channel, channel.guildId!)
			notifiedChannels[channel.channel][channel.guildId!] = true
		} else if (!isLive && hasNotified) {
			notifiedChannels[channel.channel][channel.guildId!] = false
			// console.log(
			//     `${channel.channel} is offline`
			// );
		}
	}
}
