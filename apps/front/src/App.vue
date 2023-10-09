<template>
  <button @click="login">Login</button>
  <button @click="onLogout">Logout</button>
  <router-view></router-view>
</template>

<script lang="ts">
// eslint-disable-next-line import/no-extraneous-dependencies
import { useAuth0 } from '@auth0/auth0-vue';
import { onMounted } from 'vue';

export default {
  setup() {
    const { loginWithRedirect, logout } = useAuth0();

    return {
      login() {
        loginWithRedirect({
          appState: { target: '/home' },
        });
      },
      onLogout() {
        logout();
      },
    };
  },
};
</script>
