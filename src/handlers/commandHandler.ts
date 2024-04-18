import { Client, REST, Routes } from "discord.js";
import { join } from "path";
import { readdirSync } from "fs";
import { SlashCommand } from "../types";
import { config } from "../config";

module.exports = async (client: Client) => {
    const body = [];
    let slashCommandsDir = join(__dirname, "../slashCommands");

    readdirSync(slashCommandsDir).forEach((file) => {
        if (!file.endsWith(".js")) return;

        const command: SlashCommand =
            require(`${slashCommandsDir}/${file}`).command;

        body.push(command.data.toJSON());
        client.slashCommands.set(command.name, command);

        console.log(`✅ Slash Command: ${command.name} loaded!`);
    });

    const rest = new REST({ version: "10" }).setToken(config.DISCORD_TOKEN);

    try {
        await rest.put(Routes.applicationCommands(config.DISCORD_CLIENT_ID), {
            body: body,
        });
    } catch (error) {
        console.error(error);
    }
};
