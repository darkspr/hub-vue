<template>
  <Page>
    <div class="content">
      <div style="height: 100%">
        <a-tabs
          v-model:activeKey="systemStoreHook().activeKey"
          type="card"
          size="small"
        >
          <a-tab-pane key="1">
            <template #tab>
              <span>
                <BarsOutlined />设备列表
              </span>
            </template>
            <List ref="listRef" />
          </a-tab-pane>
          <a-tab-pane key="2" disabled>
            <template #tab>
              <span>
                <AndroidFilled />设备详情
              </span>
            </template>
            <Detail ref="DetailRef" :key="systemStoreHook().activeKey" />
          </a-tab-pane>
        </a-tabs>
        <div class="right-button" v-if="systemStoreHook().activeKey === '1'">
          <a-button type="link" @click="showModal({ isShow: true })">
            <FontAwesomeIcon :icon="faList" class="icon-margin" /> 自定义
          </a-button>

          <a-button v-if="isAdmin" type="link" @click="handleCreateSlot({ isShow: true })">
            <FontAwesomeIcon :icon="faPlus" class="icon-margin" /> 添加设备
          </a-button>
        </div>
      </div>
    </div>
  </Page>
  <Modal :open="open" @RefreshList="showModal" />
  <CreateSlot :isFormOpen="isFormOpen" @RefreshList="handleCreateSlot" />
</template>
<script setup lang="ts">
import { ref } from "vue";
import Page from "@/components/page/Page.vue";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { faList, faPlus } from "@fortawesome/free-solid-svg-icons";
import List from "./List.vue";
import Detail from "./detail.vue";
import Modal from "./components/modal.vue";
import CreateSlot from "./components/createSlot.vue";
import { systemStoreHook } from "@/store/modules/devices";
import { BarsOutlined, AndroidFilled } from "@ant-design/icons-vue";
import auth from "@/utils/auth";

// 自定义字段弹窗
const open = ref<boolean>(false);
const isAdmin = auth.getGroup()?.admin;
const showModal = ({ isShow }) => {
  open.value = isShow;
};

//创建新设备插槽（仅限管理员）
const listRef = ref();
const isFormOpen = ref<boolean>(false);
const handleCreateSlot = ({ isShow }) => {
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
