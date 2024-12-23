import {
    Collection,
    CommandInteraction,
    SlashCommandBuilder,
} from "discord.js";

declare module "discord.js" {
    interface Client {
        slashCommands: Collection<string, SlashCommand>;
    }
}

export interface BotEvent {
    name: string;
    once?: boolean | false;
    execute: (...args) => void;
}

export interface SlashCommand {
    name: string;
    data: SlashCommandBuilder | any;
    execute: (interaction: CommandInteraction) => Promise<void>;
}

export {};
