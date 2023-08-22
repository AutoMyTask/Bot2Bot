<template>
  <button @click="login">Login</button>
  <router-view></router-view>
</template>

<script lang="ts">
// eslint-disable-next-line import/no-extraneous-dependencies
import { useAuth0 } from '@auth0/auth0-vue';
import { onMounted } from 'vue';

export default {
  setup() {
    const { loginWithRedirect } = useAuth0();

    onMounted(() => {
      console.log(process.env);
    });

    return {
      login() {
        loginWithRedirect({
          appState: { target: '/home' },
        });
      },
    };
  },
};

</script>
