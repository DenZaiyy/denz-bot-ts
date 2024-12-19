import { SlashCommand } from "./types";
import { Client, Collection, GatewayIntentBits } from "discord.js";
import { readdirSync } from "fs";
import { join } from "path";
import { config } from "./config";
import { checkStreamStatus } from "./utils/twitch";

export const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildPresences,
    ],
});

client.slashCommands = new Collection<string, SlashCommand>();

const handlersDirs = join(__dirname, "./handlers");
readdirSync(handlersDirs).forEach((file) => {
    if (!file.endsWith(".js")) return;
    require(join(handlersDirs, file))(client);
});

setInterval(checkStreamStatus, 60000);

client.login(config.DISCORD_TOKEN).catch(console.error);
