<template>
  <Page>
    <div class="content">
        <VueVnc url="/websockify"></VueVnc>
    </div>
  </Page>
</template>

<script setup lang="ts">
import Page from "@/components/page/Page.vue";
</script>

<style lang="less" scoped>
.content {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 58px);
}
</style>
