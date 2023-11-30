export interface Guild {
    id: string,
    name: string,
    icon: string | null,
    icon_hash: string | null,
    splash: string | null
    discovery_splash: string | null
    owner: boolean | null
    owner_id: string | null
    permissions: string | null
    region: string | null
    afk_channel_id: string | null
    widget_enabled: boolean | null
    widget_channel_id: string| null
    verification_level: number
    default_message_notifications: number
    explicit_content_filter: number
    roles: object[]  // Array of role object
    emojis: object[] // Array of emoji object
    features: object[] // Array of guildFeatures
    mfa_level: number
    application_id: string | null
    system_channel_id: string | null
    system_channel_flags: number
    rules_channel_id: string | null
    max_presences: number | null
    max_members: number | null
    vanity_url_code: string | null
    description: string | null
    banner: string | null
    premium_tier: number
    premium_subscription_count: number | null
    preferred_locale: string
    public_updates_channel_id: string | null
    max_video_channel_users: number | null
    max_stage_video_channel_users: number | null
    approximate_member_count: number | null
    approximate_presence_count: number | null
    welcome_screen: object // welcome screen object
    nsfw_level: number
    stickers: object[] // Array of sticker objects
    premium_progress_bar_enabled: boolean
    safety_alerts_channel_id: string | null
}
