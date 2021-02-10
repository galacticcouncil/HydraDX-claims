<template>
  <div class="hdx-claim-main-container">
    <div class="hdx-claim-inner-container">
      <header class="main-header">
        <a href="/">
          <img src="@/assets/images/blue-logo.svg" alt="claim.hydra.dx" />
          <h1>claim.hydra.dx</h1>
        </a>
      </header>
      <div class="content-container">
        <div class="wizard-steps-container">
          <div class="wizard-progress-status">
            <span>Step 1</span>
          </div>
          <div class="wizard-step-container step-1">
            <a class="hdx-btn connect-metamask" href="#">Connect Metamask</a>

            <div class='text-label'>Or Enter your ETH address</div>

            <input type="text" class="hdx-input" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue';

export default defineComponent({});
</script>
