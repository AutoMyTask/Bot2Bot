import {createApp} from 'vue'
import {createPinia} from 'pinia'

import App from './App.vue'
import router from './router'
import {createAuth0} from "@auth0/auth0-vue";


const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(createAuth0({
    domain: import.meta.env.VITE_APP_AUTH0_DOMAIN,
    clientId: import.meta.env.VITE_APP_AUTH0_CLIENID,
    authorizationParams: {
        redirect_uri: `${import.meta.env.VITE_APP_APP_DOMAIN}/home`,
        audience: import.meta.env.VITE_APP_AUDIENCE,
        connection: 'discord',
    },
}))

app.mount('#app')
