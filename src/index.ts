import { SlashCommand } from "./types";
import { Client, Collection, GatewayIntentBits } from "discord.js";
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

const twitchAPI = new TwitchAPI(config.TWITCH_CLIENT_ID, config.TWITCH_CLIENT_SECRET);

client.on("ready", async () => {
    console.log(`🤖 ${client.user?.username} is ready! 🤖`);
    await twitchAPI.createSubscription();
    await twitchAPI.getTwitchIDFromUsername("denzaiyy");
});

// client.on(Events.GuildCreate, async (guild) => {
//     await deployCommands({ guildId: guild.id });
// });

client.login(config.DISCORD_TOKEN);
