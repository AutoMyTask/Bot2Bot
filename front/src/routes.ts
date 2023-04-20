import HomeView from '@/views/HomeView.vue';

export type AutoMyTaskRoutes = string

const routes: Record<AutoMyTaskRoutes, string> = {
  Home: 'Home',
};

export default [
  {
    name: routes.Home,
    path: '/home',
    component: HomeView,
  },
];
