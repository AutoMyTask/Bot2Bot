<template>
  <button @click="login">Login</button>
  <router-view></router-view>
</template>

<script lang="ts">
// eslint-disable-next-line import/no-extraneous-dependencies
import { useAuth0 } from '@auth0/auth0-vue';

export default {
  setup() {
    const { loginWithRedirect } = useAuth0();

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
