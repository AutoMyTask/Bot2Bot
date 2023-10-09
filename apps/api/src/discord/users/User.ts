export enum PremiumTypesEnum {
    None,
    NitroClassic,
    Nitro,
    NitroBasic
}

export enum LocalesEnum {
    Indonesian = 'id',
    Danish = 'da',
    German = 'de',
    EnglishUK = 'en-GB',
    EnglishUS = 'en-US',
    Spanish = 'es-ES',
    French = 'fr',
    Croatian = 'hr',
    Italian = 'it',
    Lithuanian = 'lt',
    Hungarian = 'hu',
    Dutch = 'nl',
    Norwegian = 'no',
    Polish = 'pl',
    PortugueseBrazilian = 'pt-BR',
    RomanianRomania = 'ro',
    Finnish = 'fi',
    Swedish = 'sv-SE',
    Vietnamese = 'vi',
    Turkish = 'tr',
    Czech = 'cs',
    Greek = 'el',
    Bulgarian = 'bg',
    Russian = 'ru',
    Ukrainian = 'uk',
    Hindi = 'hi',
    Thai = 'th',
    ChineseChina = 'zh-CN',
    Japanese = 'ja',
    ChineseTaiwan = 'zh-TW',
    Korean = 'ko'
}

export interface User {
    id: string,
    username: string,
    avatar: null | string,
    discriminator: string,
    public_flags: number | null,
    flags: number | null,
    global_name: string | null,
    banner: null | string,
    accent_color: null | number,
    avatar_decoration_data: null | string,
    banner_color: null | string,
    mfa_enabled: boolean | null,
    locale: LocalesEnum | null,
    premium_type: PremiumTypesEnum | null,
    email: string | null,
    verified: boolean | null
}
