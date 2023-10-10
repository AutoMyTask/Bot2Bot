import {OpenapiProp} from "openapi";
import {LocalesEnum, PremiumTypesEnum, User} from "../../discord/users/User"; // Mettre discord dans une bibliothéque séparé

interface IDiscordUserResponse extends User {
  //  guilds: Guild[]
}


class DiscordUserResponse implements IDiscordUserResponse {
    @OpenapiProp({type: 'string'})
    id!: string

    @OpenapiProp({type: 'string'})
    username!: string

    @OpenapiProp({type: 'string'}, {required: false})
    avatar: string | null = null

    @OpenapiProp({type: 'string'}, {required: false})
    discriminator!: string

    @OpenapiProp([
        {type: 'integer'},
        {type: 'null'}
    ], {required: false})
    public_flags: number | null = null

    @OpenapiProp([
        {type: 'integer'},
        {type: 'null'}
    ], {required: false})
    flags: number | null = null

    @OpenapiProp([
        {type: 'string'},
        {type: 'null'}
    ], {required: false})
    banner: string | null = null

    @OpenapiProp([
        {type: 'integer'},
        {type: 'null'}
    ], {required: false})
    accent_color: number | null = null

    @OpenapiProp([
        {type: 'string'},
        {type: 'null'}
    ], {required: false})
    global_name: string | null = null

    @OpenapiProp([
        {type: 'string'},
        {type: 'null'}
    ], {required: false})
    avatar_decoration_data: string | null = null

    @OpenapiProp([
        {type: 'string'},
        {type: 'null'}
    ], {required: false})
    banner_color: string | null = null

    @OpenapiProp([
        {type: 'boolean'},
        {type: 'null'}
    ], {required: false})
    mfa_enabled: boolean | null = null

    @OpenapiProp([
        {type: 'object', option: {type: {type: LocalesEnum, name: 'LocalesEnum'}}},
        {type: 'null'}
    ], {required: false})
    locale: LocalesEnum | null = null

    @OpenapiProp([
        {type: 'object', option: {type: {type: PremiumTypesEnum, name: 'PremiumTypesEnum'}}},
        {type: 'null'},
    ], {required: false})
    premium_type: PremiumTypesEnum | null = null

    @OpenapiProp([
        {type: 'string'},
        {type: 'null'},
    ], {required: false})
    email: string | null = null

    @OpenapiProp([
        {type: 'boolean'},
        {type: 'null'}
    ], {required: false})
    verified: boolean | null = null
}


export interface IUserResponse {
    discord: IDiscordUserResponse | null
}


export class UserResponse implements IUserResponse {
    @OpenapiProp([
        { type: 'object', option: { type: DiscordUserResponse } },
        { type: 'null' }
    ])
    discord: DiscordUserResponse | null = null
}
