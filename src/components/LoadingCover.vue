<template>
  <div
    v-show="wizardState.loading || wizardState.claiming.inProgress"
    class="loading-cover-message"
  >
    <div
      v-show="!wizardState.isReconnectBtn && !wizardState.claiming.inProgress"
    >
      Loading ...
    </div>
    <div
      v-show="!wizardState.isReconnectBtn && wizardState.claiming.inProgress"
    >
      Claiming ...
    </div>
    <div
      v-show="
        !wizardState.isReconnectBtn &&
        wizardState.claiming.inProgress &&
        wizardState.claiming.resultMessage.length > 0
      "
    >
      {{ wizardState.claiming.resultMessage }}
    </div>
    <a
      v-show="wizardState.isReconnectBtn"
      href="#"
      @click.prevent="onReconnectClick"
      class="hdx-btn loading-cover-btn reconnect-btn"
      >Reconnect</a
    >
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'LoadingCover',
  props: {
    wizardState: {
      type: Object,
      default: () => {
        return {};
      },
    },
    onReconnectClick: {
      type: Function,
      default: () => {},
    },
  },
});
</script>
