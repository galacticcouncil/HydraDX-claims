<template>
  <div
    v-show="
      wizardState.loading ||
      wizardState.claiming.inProgress ||
      !hdxAccountData.isPolkadotExtAvailable ||
      wizardState.globalNotice.open
    "
    class="loading-cover-message"
  >
    <div
      class="global-notice-message"
      v-show="
        !wizardState.loading &&
        !wizardState.isReconnectBtn &&
        !wizardState.claiming.inProgress &&
        wizardState.globalNotice.open
      "
    >
      {{ wizardState.globalNotice.message }}
    </div>
    <div
      v-show="
        wizardState.loading &&
        !wizardState.isReconnectBtn &&
        !wizardState.claiming.inProgress
      "
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
    <!--    <a-->
    <!--      v-show="-->
    <!--        !wizardState.isReconnectBtn &&-->
    <!--        !wizardState.loading &&-->
    <!--        !wizardState.claiming.inProgress &&-->
    <!--        !hdxAccountData.isPolkadotExtAvailable-->
    <!--      "-->
    <!--      href="#"-->
    <!--      @click.prevent="onReconnectClick"-->
    <!--      class="hdx-btn loading-cover-btn reconnect-btn"-->
    <!--      >Connect Polkadot.js</a-->
    <!--    >-->

    <a
      v-if="
        !wizardState.isReconnectBtn &&
        !wizardState.loading &&
        !wizardState.claiming.inProgress &&
        !hdxAccountData.isPolkadotExtAvailable &&
        loadingCoverState.isInjectedWeb3
      "
      class="hdx-btn loading-cover-btn"
      href="#"
      @click.prevent="onConnectPolkadotExt"
      >Connect Polkadot.js</a
    >
    <a
      v-if="
        !wizardState.isReconnectBtn &&
        !wizardState.loading &&
        !wizardState.claiming.inProgress &&
        !hdxAccountData.isPolkadotExtAvailable &&
        !loadingCoverState.isInjectedWeb3
      "
      class="hdx-btn loading-cover-btn"
      target="_blank"
      href="https://polkadot.js.org/extension/"
      >Install Polkadot.js</a
    >
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, reactive, watch } from 'vue';

type LoadingCoverState = {
  isInjectedWeb3: boolean;
};

export default defineComponent({
  name: 'LoadingCover',
  props: {
    wizardState: {
      type: Object,
      default: () => {
        return {};
      },
    },
    hdxAccountData: {
      type: Object,
      default: () => {
        return {};
      },
    },
    onReconnectClick: {
      type: Function,
      default: () => {},
    },
    onConnectPolkadotExt: {
      type: Function,
      default: () => {},
    },
  },
  setup(props) {
    const loadingCoverState = reactive({
      isInjectedWeb3: false,
    } as LoadingCoverState);

    watch(
      () => loadingCoverState.isInjectedWeb3,
      (newVal, oldVal) => {
        if (newVal && newVal !== oldVal) {
          setTimeout(async () => {
            await props.onConnectPolkadotExt();
          }, 500);
        }
      }
    );

    onMounted(() => {
      const checkPolkadotExt = setInterval(() => {
        const isInjectedWeb3 =
          //@ts-ignore
          !!(window.injectedWeb3 && window.injectedWeb3['polkadot-js']);

        console.log('isInjectedWeb3 - ', isInjectedWeb3);
        if (isInjectedWeb3) {
          console.log(1);
          loadingCoverState.isInjectedWeb3 = isInjectedWeb3;
          clearInterval(checkPolkadotExt);
        }
      }, 100);
    });

    return {
      loadingCoverState,
    };
  },
});
</script>
