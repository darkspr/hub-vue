<template>
    <div class="main">
        <Head></Head>
        <div class="body">
            <slot></slot>
        </div>
    </div>
</template>

<script setup lang="ts">
import Head from '../head/Head.vue';

</script>

<style lang="less" scoped>
.main{
    width: 100%;
    height: 100vh;
    overflow: hidden;
    .body{
        height: calc(100% - 46px);
        overflow: auto;
        padding: 5px 15px;
        background-color: #eee;
    }
}
</style>