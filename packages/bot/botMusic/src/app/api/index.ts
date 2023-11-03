import {REST, RESTOptions} from "@discordjs/rest";
import  { Rest } from './youtube/rest'

export interface ApiYoutube {
    rest: Rest
}

interface Api {
    youtube: ApiYoutube
}

export default (config: { discord: Partial<RESTOptions> | undefined; youtube: any; }): Api => ({
    youtube: {
        rest: new Rest(config.youtube),
    },
})

