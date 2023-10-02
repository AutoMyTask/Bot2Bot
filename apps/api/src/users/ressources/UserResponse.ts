import {User} from "../../discord";
import {OpenapiProp} from "openapi";

enum PremiumTypesEnum {
    None ,
    NitroClassic,
    Nitro,
    NitroBasic
}

export class UserResponse implements User {
    @OpenapiProp(['string'])
    id!: string

    @OpenapiProp(['string'])
    username!: string

    @OpenapiProp(['string'], { required: false })
    avatar!: string | null

    @OpenapiProp(['string'])
    discriminator!: string

    @OpenapiProp(['integer', 'null'])
    public_flags!: number | null

    @OpenapiProp(['integer', 'null'])
    flags!: number | null

    @OpenapiProp(['string', 'null'])
    banner!: string | null

    @OpenapiProp(['integer', 'null'])
    accent_color!: number | null

    @OpenapiProp(['string', 'null'])
    global_name!: string | null

    @OpenapiProp(['string', 'null'])
    avatar_decoration_data!: string | null

    @OpenapiProp(['string', 'null'])
    banner_color!: string | null

    @OpenapiProp(['boolean', 'null'] )
    mfa_enabled!:  boolean | null

    @OpenapiProp(['string', 'null'])
    locale!: string | null

    @OpenapiProp([PremiumTypesEnum, 'null'], {type: "object", enum: 'PremiumTypesEnum' })
    premium_type!: PremiumTypesEnum | null

    @OpenapiProp(['string', 'null'], {  })
    email!: string | null

    @OpenapiProp(['boolean', 'null'], {  })
    verified!: boolean | null
}
