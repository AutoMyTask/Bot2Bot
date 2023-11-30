/**
 * This file was auto-generated by openapi-typescript.
 * Do not make direct changes to the file.
 */


export interface paths {
  "/users/@me/{id}": {
    /** @description une description */
    get: {
      parameters: {
        query?: {
          populate_identity?: string;
        };
        path: {
          id: number;
        };
      };
      responses: {
        200: components["responses"]["UserResponse"];
        400: components["responses"]["BadRequest"];
        401: components["responses"]["Unauthorized"];
      };
    };
  };
  "/healthcheck": {
    /** @description une description */
    get: {
      responses: {
      };
    };
  };
}

export type webhooks = Record<string, never>;

export interface components {
  schemas: {
    UserResponse: {
      discord?: Record<string, never> | null;
    };
    /** @description Ressource provenant de l'api discord: https://discord.com/developers/docs/resources/user */
    DiscordUserResponse: {
      id: string;
      username: string;
      avatar?: string;
      discriminator?: string;
      public_flags?: number | null;
      flags?: number | null;
      banner?: string | null;
      accent_color?: number | null;
      global_name?: string | null;
      avatar_decoration_data?: string | null;
      banner_color?: string | null;
      mfa_enabled?: boolean | null;
      locale?: Record<string, never> | null;
      premium_type?: Record<string, never> | null;
      email?: string | null;
      verified?: boolean | null;
    };
    LocalesEnum: {
      /**
       * @description Indonesian:id
       * Danish:da
       * German:de
       * EnglishUK:en-GB
       * EnglishUS:en-US
       * Spanish:es-ES
       * French:fr
       * Croatian:hr
       * Italian:it
       * Lithuanian:lt
       * Hungarian:hu
       * Dutch:nl
       * Norwegian:no
       * Polish:pl
       * PortugueseBrazilian:pt-BR
       * RomanianRomania:ro
       * Finnish:fi
       * Swedish:sv-SE
       * Vietnamese:vi
       * Turkish:tr
       * Czech:cs
       * Greek:el
       * Bulgarian:bg
       * Russian:ru
       * Ukrainian:uk
       * Hindi:hi
       * Thai:th
       * ChineseChina:zh-CN
       * Japanese:ja
       * ChineseTaiwan:zh-TW
       * Korean:ko
       * @enum {string}
       */
      LocalesEnum?: "id" | "da" | "de" | "en-GB" | "en-US" | "es-ES" | "fr" | "hr" | "it" | "lt" | "hu" | "nl" | "no" | "pl" | "pt-BR" | "ro" | "fi" | "sv-SE" | "vi" | "tr" | "cs" | "el" | "bg" | "ru" | "uk" | "hi" | "th" | "zh-CN" | "ja" | "zh-TW" | "ko";
    };
    PremiumTypesEnum: {
      /**
       * @description None:0
       * NitroClassic:1
       * Nitro:2
       * NitroBasic:3
       * @enum {number}
       */
      PremiumTypesEnum?: 0 | 1 | 2 | 3;
    };
    Unauthorized: {
      message: string;
      errors: null | components["schemas"]["UnauthorizedErrorConnectionError"][];
    };
    UnauthorizedErrorConnectionError: {
      status: number;
      connection: string;
    };
    BadRequest: {
      message?: string;
      errors: components["schemas"]["ObjectValidationError"][] | string[] | components["schemas"]["ParamValidationError"][];
    };
    ObjectValidationError: {
      target?: Record<string, never>;
      property?: string;
      value?: Record<string, never>;
      constraints?: {
        [key: string]: unknown;
      };
      children?: components["schemas"]["ObjectValidationError"][];
      contexts?: {
        [key: string]: unknown;
      };
    };
    ParamValidationError: {
      type: string;
      location: Record<string, never>;
      path: string;
      value: unknown;
      msg: unknown;
    };
    LocationEnum: {
      /**
       * @description Body:body
       * Cookie:cookies
       * Headers:headers
       * Params:params
       * Query:query
       * @enum {string}
       */
      LocationEnum?: "body" | "cookies" | "headers" | "params" | "query";
    };
  };
  responses: {
    UserResponse: {
      content: {
        "application/json": components["schemas"]["UserResponse"];
      };
    };
    Unauthorized: {
      content: {
        "application/json": components["schemas"]["Unauthorized"];
      };
    };
    BadRequest: {
      content: {
        "application/json": components["schemas"]["BadRequest"];
      };
    };
  };
  parameters: {
  };
  requestBodies: {
  };
  headers: {
  };
  pathItems: never;
}

export type $defs = Record<string, never>;

export type external = Record<string, never>;

export type operations = Record<string, never>;