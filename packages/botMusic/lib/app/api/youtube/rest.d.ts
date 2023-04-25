export declare class Rest {
    baseUrl: any;
    version: any;
    constructor(config: any);
    call({ method, data, route }?: any): Promise<import("axios").AxiosResponse<any, any>>;
    get: (route: string) => Promise<import("axios").AxiosResponse<any, any>>;
}
