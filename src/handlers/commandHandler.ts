import { Client, REST, Routes } from "discord.js";
import { join } from "path";
import { readdirSync } from "fs";
import { SlashCommand } from "../types";
import { config } from "../config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

module.exports = async (client: Client) => {
    const body: Array<SlashCommand> = [];

    const rest = new REST({ version: "10" }).setToken(config.DISCORD_TOKEN);

    try {
        let slashCommandsDir = join(__dirname, "../slashCommands");

        readdirSync(slashCommandsDir).forEach((file) => {
            if (!file.endsWith(".js")) return;

            const command: SlashCommand =
                require(`${slashCommandsDir}/${file}`).command;

            body.push(command.data.toJSON());
            client.slashCommands.set(command.name, command);

            console.log(`✅ Slash Command: ${command.name} loaded!`);
        });

        const guilds = await prisma.guild.findMany();

        if (guilds.length === 0) {
            console.warn(
                "⚠️ No guilds found in the database. Falling back to default guild."
            );
            console.log("⏳ Suppression et réactualisation des commandes...");
            // Suppression des commandes existantes (serveur spécifique)
            await rest.put(
                Routes.applicationGuildCommands(
                    config.DISCORD_CLIENT_ID,
                    config.DISCORD_GUILD_ID
                ),
                {
                    body: [],
                }
            );
            console.log("✅ Commandes existantes supprimées.");

            await rest.put(
                Routes.applicationGuildCommands(
                    config.DISCORD_CLIENT_ID,
                    config.DISCORD_GUILD_ID
                ),
                { body }
            );
        } else {
            guilds.map((guild) => {
                console.log(
                    `⏳ [${guild.name}] Suppression et réactualisation des commandes...`
                );

                rest.put(
                    Routes.applicationGuildCommands(
                        config.DISCORD_CLIENT_ID,
                        guild.guildId
                    ),
                    {
                        body: [],
                    }
                );

                console.log(
                    `✅ [${guild.name}] Commandes existantes supprimées.`
                );

                rest.put(
                    Routes.applicationGuildCommands(
                        config.DISCORD_CLIENT_ID,
                        guild.guildId
                    ),
                    {
                        body: body,
                    }
                );
                console.log(`✅ [${guild.name}] Commands loaded !`);
            });
        }
    } catch (error) {
        console.error("❌ Erreur lors de la mise à jour des commandes:", error);
    }
};
