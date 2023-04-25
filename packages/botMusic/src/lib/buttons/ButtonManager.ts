import {Collection} from "discord.js";

export class ButtonManager {
    public buttons: Collection<string, any> = new Collection<string, any>()

    public registerButtons(buttons: any[]){
        buttons.forEach(button => {
            this.buttons.set(button.data.data.custom_id, {
                data: button.data,
                execute: button.run
            })
        })
    }
}
