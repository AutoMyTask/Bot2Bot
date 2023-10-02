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
    locale: string | null,
    premium_type: number | null,
    email: string | null,
    verified: boolean | null
}
