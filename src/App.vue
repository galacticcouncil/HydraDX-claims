<template>
  <IndexPage />
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import IndexPage from './views/index.vue';

export default defineComponent({
  name: 'App',
  components: {
    IndexPage,
  },
});
</script>
