import 'reflect-metadata'
import {SlashCommandBuilder} from "@discordjs/builders";
export interface CommandOptions {
    data: SlashCommandBuilder;
}

export function Command (options: CommandOptions){
    return (target: any) => {
        Reflect.defineMetadata('command', options, target.prototype, 'run')
    }
}
