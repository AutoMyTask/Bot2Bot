import axios from "axios";

// Utilisation de Axios create
// Déplacer cette logique dans le module musique

export class Rest {
    baseUrl
    version

    constructor(config: any) {
        this.baseUrl = config.baseUrl
        this.version = config.version

        Object.setPrototypeOf(this, Rest.prototype)
    }

    async call({method, data, route} : any = {}) {
        const url = `${this.baseUrl}/${this.version}/${route}`
        // @ts-ignore
        return axios.request(url, {method, data, withCredentials: false})
    }

    get = (route: string) => {
        return this.call({ method: 'get', route })
    }
}
