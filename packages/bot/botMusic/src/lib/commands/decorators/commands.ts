import {Collection} from "discord.js"

export const commands: Collection<string, any> = new Collection()

// Dire que c'est un tableau de BaseCommand
export const Commands = (commandsClasses: any[]) => {
  commandsClasses.forEach((commandClass) => {
    const commandPropertyNames = Object.getOwnPropertyNames(commandClass.prototype)

    commandPropertyNames.forEach((commandPropertyName) => {

      const commandMethod = commandClass.prototype[commandPropertyName]
      const commandMetadata = Reflect.getMetadata('command', commandClass.prototype, commandPropertyName)

      if (commandMetadata) {
        commands.set(commandMetadata.data.name, {
          data: commandMetadata.data,
          execute: commandMethod
        })
      }
    })
  })
}
