<template>
  <div class="home">
    <img alt="Vue logo" src="../assets/logo.png">
    <HelloWorld msg="Welcome to Your Vue.js + TypeScript App"/>
  </div>
</template>

<script lang="ts">
import {defineComponent, onMounted} from 'vue';
import HelloWorld from '@/components/HelloWorld.vue';
import {useAuth0} from "@auth0/auth0-vue"; // @ is an alias to /src

export default defineComponent({
  name: 'HomeView',
  components: {
    HelloWorld,
  },
  setup() {
    onMounted(async () => {
      const {getAccessTokenSilently} = useAuth0();
      const token = await getAccessTokenSilently()
      console.log(token)
      const response = await fetch(import.meta.env.VITE_APP_APP_DOMAIN, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      console.log(data);
    });
  },
});
</script>
