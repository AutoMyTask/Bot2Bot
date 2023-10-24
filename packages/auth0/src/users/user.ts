import {Identity} from "../index";

export class User {
    public created_at!: string
    public email!: string
    public email_verified!: boolean
    public identities!: Identity[]
    public name!: string
    public nickname!: string
    public picture!: string

    getIdentityByConnection(connection: 'discord'): Identity | undefined {
        return this.identities.find(identity => identity.connection === connection)
    }
}
