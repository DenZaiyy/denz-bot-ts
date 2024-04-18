import { SlashCommand } from "./types.d";
import { Client, Collection, GatewayIntentBits } from "discord.js";
import { readdirSync } from "fs";
import { join } from "path";
import { config } from "./config";

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

// client.on(Events.GuildCreate, async (guild) => {
//     await deployCommands({ guildId: guild.id });
// });

client.login(config.DISCORD_TOKEN);
