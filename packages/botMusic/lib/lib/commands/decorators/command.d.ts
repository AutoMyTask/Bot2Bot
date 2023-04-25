import 'reflect-metadata';
import { SlashCommandBuilder } from "@discordjs/builders";
export interface CommandOptions {
    data: SlashCommandBuilder;
}
export declare function Command(options: CommandOptions): (target: any) => void;
