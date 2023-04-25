import { RESTOptions } from "@discordjs/rest";
import { Rest } from './youtube/rest';
export interface ApiYoutube {
    rest: Rest;
}
interface Api {
    youtube: ApiYoutube;
}
declare const _default: (config: {
    discord: Partial<RESTOptions> | undefined;
    youtube: any;
}) => Api;
export default _default;
