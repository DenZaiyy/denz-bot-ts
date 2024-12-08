import { SlashCommand } from "./types";
import {
    Client,
    Collection,
    GatewayIntentBits,
    TextChannel,
    Channel,
    NewsChannel,
    DMChannel,
} from "discord.js";
import { readdirSync } from "fs";
import { join } from "path";
import { config } from "./config";
import TwitchAPI from "./twitchAPI";

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.MessageContent,
    ],
});

client.slashCommands = new Collection<string, SlashCommand>();

const handlersDirs = join(__dirname, "./handlers");
readdirSync(handlersDirs).forEach((file) => {
    if (!file.endsWith(".js")) return;
    require(join(handlersDirs, file))(client);
});

const twitchAPI = new TwitchAPI(
    config.TWITCH_CLIENT_ID,
    config.TWITCH_CLIENT_SECRET
);

let notifiedChannels: { [key: string]: boolean } = {};
let userName = "";
let category = "";
let streamTitle = "";

async function isStreamLive(
    oauthToken: string,
    channel: string
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
        }

        return data.data.length > 0;
    } catch (error) {
        console.error(`Error checking stream status for ${channel}:`, error);
        return false;
    }
}

async function sendStreamNotification(streamerName: string) {
    try {
        const channel: Channel | null = await client.channels.fetch(
            config.DISCORD_STREAM_CHANNEL_ID
        );
        if (
            channel instanceof TextChannel ||
            channel instanceof NewsChannel ||
            channel instanceof DMChannel
        ) {
            await channel.send(
                `🚨 @everyone **${userName}** viens de lancer son live sur Twitch!\n**Titre:** ${streamTitle}\n**Catégorie:** ${category}\nRejoint le ici: https://www.twitch.tv/${streamerName} 🚨`
            );
        } else {
            console.log(
                "Could not find the Discord channel or it is not a text channel."
            );
        }
    } catch (error) {
        console.error("Error sending notification to Discord channel:", error);
    }
}

async function checkStreamStatus() {
    const oauthToken = await twitchAPI.getTwitchOAuthToken();
    if (oauthToken) {
        const channels = config.TWITCH_CHANNELS.split(",");

        for (const channel of channels) {
            const channelName = channel.trim();
            const isLive = await isStreamLive(oauthToken, channelName);

            if (isLive && !notifiedChannels[channelName]) {
                await sendStreamNotification(channelName);
                notifiedChannels[channelName] = true;
            } else if (!isLive && notifiedChannels[channelName]) {
                notifiedChannels[channelName] = false;
                console.log(`${channelName} is offline.`);
            }
        }
    } else {
        console.log("Twitch OAuth token not found.");
    }
}

setInterval(checkStreamStatus, 60000);

client.login(config.DISCORD_TOKEN).catch(console.error);
