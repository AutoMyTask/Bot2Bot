import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { createAuth0 } from '@auth0/auth0-vue'

// Modifier complétement l'organisation des dossiers.
// La structure à la angular reste pour moi la meilleure et la plus simple à comprendre
// avec un dossier shared pour tous les composants partagés

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(
  createAuth0({
    domain: import.meta.env.VITE_APP_AUTH0_DOMAIN,
    clientId: import.meta.env.VITE_APP_AUTH0_CLIENID,
    authorizationParams: {
      redirect_uri: `${import.meta.env.VITE_APP_APP_DOMAIN}/home`,
      audience: import.meta.env.VITE_APP_AUDIENCE,
      connection: 'discord'
    }
  })
)

app.mount('#app')
