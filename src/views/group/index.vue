<template>
  <Page>
    <div class="content">
      <div style="height: 100%">
        <a-tabs

          type="card"
          size="small"
        >
          <a-tab-pane key="1">
            <template #tab>
              <span><BarsOutlined />组列表</span>
            </template>
            <List ref="listRef" />
          </a-tab-pane>
        </a-tabs>
        <div class="right-button">
          <a-button v-if="isAdmin" type="link" @click="handleCreateGroup({ isShow: true })">
            <FontAwesomeIcon :icon="faPlus" class="icon-margin" />创建组
          </a-button>
        </div>
      </div>
    </div>
  </Page>
  <CreateGroup :isFormOpen="isFormOpen" @RefreshList="handleCreateGroup" />
</template>
<script setup lang="ts">
import { ref } from "vue";
import Page from "@/components/page/Page.vue";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import List from "./List.vue";
import CreateGroup from "./components/createGroup.vue";

import { BarsOutlined } from "@ant-design/icons-vue";
import auth from "@/utils/auth";

const isAdmin = auth.getGroup()?.admin;

//创建新用户（仅限管理员）
const listRef = ref();
const isFormOpen = ref<boolean>(false);
const handleCreateGroup = ({ isShow }) => {
  isFormOpen.value = isShow;
  listRef.value.getLists(1);
};
</script>
<style lang="less" scoped>
.icon-margin {
  margin-right: 5px;
  font-size: 12px;
}
.content {
  height: calc(100vh - 58px);
  overflow-y: hidden;
  overflow-x: hidden;
  background-color: #fff;
  position: relative;
  padding-left: 10px;
  padding-right: 10px;
}
.right-button {
  position: absolute;
  right: 20px;
  top: 5px;
}
::deep {
  .ant-tabs {
    height: 100%;
    line-height:1.58rem;
    .ant-tabs-content {
      height: 100%;
    }
  }
}
</style>
