import { config } from "../config";
import { DMChannel, NewsChannel, TextChannel } from "discord.js";
import { client } from "../bot";
import { prisma, twitchAPI } from "./variables";

let notifiedChannels: { [key: string]: { [guildId: string]: boolean } } = {};
let userName = "";
let category = "";
let streamTitle = "";
let gameLink = "";

export async function isStreamLive(
  oauthToken: string,
  channel: string,
): Promise<boolean> {
  const url = `https://api.twitch.tv/helix/streams?user_login=${channel}`;
  try {
    const response = await fetch(url, {
      headers: {
        "Client-Id": config.TWITCH_CLIENT_ID,
        Authorization: `Bearer ${oauthToken}`,
      },
    });

    const data = await response.json();

    if (data.data.length > 0) {
      userName = data.data[0]?.user_name;
      category = data.data[0]?.game_name;
      streamTitle = data.data[0]?.title;
      gameLink = await getGameLink(data.data[0]?.game_id);
    }

    return data.data.length > 0;
  } catch (error) {
    console.error(`Error checking stream status for ${channel}:`, error);
    return false;
  }
}

async function getGameLink(gameId: string): Promise<string> {
  const url = `https://api.twitch.tv/helix/games?id=${gameId}`;
  try {
    const response = await fetch(url, {
      headers: {
        "Client-Id": config.TWITCH_CLIENT_ID,
        Authorization: `Bearer ${await twitchAPI.getTwitchOAuthToken()}`,
      },
    });
    const data = await response.json();

    const gameName = data.data[0]?.name;
    const formattedGameName = gameName.replace(/ /g, "-");

    if (data.data.length === 0) {
      return "";
    }

    return `https://www.twitch.tv/directory/game/${formattedGameName.toLowerCase()}`;
  } catch (error) {
    console.error(`Error getting game link for game id ${gameId}:`, error);
    return "";
  }
}

export async function sendStreamNotification(
  streamerName: string,
  guildId: string,
) {
  try {
    const liveChannel = await prisma.guild.findUnique({
      select: {
        annoucementChannel: true,
        name: true,
      },
      where: {
        guildId: guildId,
      },
    });

    if (!liveChannel) {
      console.log(`Guild not found: ${guildId}`);
      return;
    }

    if (!liveChannel.annoucementChannel) {
      console.log(
        `[${liveChannel.name}] No annoucement channel found for guild.`,
      );
      return;
    }

    const channel = await client.channels.fetch(liveChannel.annoucementChannel);

    if (
      channel instanceof TextChannel ||
      channel instanceof NewsChannel ||
      channel instanceof DMChannel
    ) {
      await channel.send(
        `🚨 @everyone **${userName}** viens de lancer son live sur Twitch!\n**Titre:** ${streamTitle}\n**Catégorie:** ${category}\nRejoint le ici: https://www.twitch.tv/${streamerName} 🚨`,
      );
    } else {
      console.log(
        "Could not find the Discord channel or it is not a text channel.",
      );
    }
  } catch (error) {
    console.error("Error sending notification to Discord channel:", error);
  }
}

export async function checkStreamStatus() {
  const oauthToken = await twitchAPI.getTwitchOAuthToken();
  if (!oauthToken) {
    console.log("Twitch OAuth token not found.");
    return;
  }

  const channels = await prisma.live.findMany({
    select: {
      channel: true,
      guildId: true,
    },
    where: {
      plateforme: "twitch",
    },
  });

  for (const channel of channels) {
    const isLive = await isStreamLive(oauthToken, channel.channel);

    if (!notifiedChannels[channel.channel]) {
      notifiedChannels[channel.channel] = {};
    }

    const hasNotified = notifiedChannels[channel.channel][channel.guildId!];

    if (isLive && !hasNotified) {
      await sendStreamNotification(channel.channel, channel.guildId!);
      notifiedChannels[channel.channel][channel.guildId!] = true;
    } else if (!isLive && hasNotified) {
      notifiedChannels[channel.channel][channel.guildId!] = false;
      // console.log(
      //     `${channel.channel} is offline`
      // );
    }
  }
}
