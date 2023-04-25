import { Collection } from "discord.js";
export declare class ButtonManager {
    buttons: Collection<string, any>;
    registerButtons(buttons: any[]): void;
}
