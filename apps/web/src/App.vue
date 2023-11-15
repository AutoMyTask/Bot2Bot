<template>
  <button @click="login">Login</button>
  <button @click="onLogout">Logout</button>
  <h1>You did it!</h1>

  <router-view></router-view>
</template>

<script lang="ts">
import {useAuth0} from '@auth0/auth0-vue';

export default {
  setup() {
    const {loginWithRedirect, logout} = useAuth0();

    return {
      login() {
        loginWithRedirect({
          appState: {target: '/home'},
        });
      },
      onLogout() {
        logout();
      },
    };
  },
};
</script>
