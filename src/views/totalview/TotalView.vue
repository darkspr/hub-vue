<template>
  <Page>
    <div class="content">
      <div class="loading" v-if="loading">
        <a-spin :indicator="indicator" tip="加载中"> </a-spin>
      </div>
      <template v-if="deviceList.length>0">
      <div class="device-list">
        <a-row v-if="deviceList.length" :gutter="[20,20]">
          <a-col v-for="item in deviceList" :key="item.domain" :xs="12" :sm="8" :md="8" :lg="6" :xl="4" :xxl="3">
            <Card :key="item.domain" :deviceItem="item" @click="handleClick(item)"/>
          </a-col>
        </a-row>
      </div>
      <div class="pagination-box">
        <a-pagination
          :show-size-changer="pagination.showSizeChanger"
          :show-quick-jumper="pagination.showQuickJumper"
          v-model:current="pagination.current"
          :total="pagination.total"
          v-model:pageSize="pagination.pageSize"
          :show-total="pagination.showTotal"
          :pageSizeOptions="pagination.pageSizeOptions"
          @change="onChange"
        />
      </div>
    </template>

      <template v-else>
     
        <a-empty :image="simpleImage" />
      </template>
    </div>
  </Page>
</template>
<script setup lang="ts">
import Page from "@/components/page/Page.vue";
import { onMounted, ref, h } from "vue";
import { getList } from "@/api/list";
import { LoadingOutlined } from '@ant-design/icons-vue';
import Card from "./components/card.vue";
import { Empty, message } from 'ant-design-vue';
const simpleImage = Empty.PRESENTED_IMAGE_SIMPLE;

//分页逻辑
const loading = ref(false);
const deviceList = ref([]);
const pagination = ref({
  current: 1,
  pageSize: 20,
  total: 0,
  showQuickJumper: true,
  showSizeChanger: true,
  pageSizeOptions: ["20", "30", "50", "80"],
  showTotal: (total: any) => `共 ${total} 条`,
});
const indicator = h(LoadingOutlined, {
    style: {
      fontSize: '50px',
    },
    spin: true,
});

const onChange = (pageNumber: number) => {
  pagination.value.current = pageNumber;
  getLists();
};

const getLists = async (current?: number) => {
  if (current) {
    pagination.value.current = current;
  }
  try {
    loading.value = true;
    let params = {
      page: pagination.value.current,
      size: pagination.value.pageSize,
      sort: "state",
      order: "desc"
    };

    const res: any = await getList(params);
    if (res.data.data && typeof res.data.data === "object") {
      loading.value = false;
      deviceList.value = res.data.data as typeof res.data.data.value;
      pagination.value.total = res.data.total;
    } else {
      loading.value = false;
      deviceList.value = [];
    }
  } catch (error) {
    loading.value = false;
  }
};


const handleClick=(item:any)=>{
  if (item.state == 1) {
    window.open(`/d/${item.domain}/`, '_blank');
  } else if (item.stat == 0) {
    message.error("设备不在线");
  } else {
    message.error("没有设备连接该插槽");
  }
}

onMounted(() => {
  getLists();
});
</script>
<style lang="less" scoped>
.content {
  width: 100%;
  height: calc(100vh - 58px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
  background-color: #ffffff;
  .device-list {
    height: calc(100% - 60px);
    // display: grid;
    // grid-template-columns: repeat(7, 1fr);
    // gap: 20px;
    padding-top: 10px;
    padding-left: 10px;
    overflow-y: auto;
    .ant-row{
      width: 100%;
    }
  }
  .pagination-box {
    width: 100%;
    height: 60px;
    background: #ffffff;
    display: flex;
    justify-content: end;
    text-align: center;
    padding-right: 10px;
    align-items: center;
  }
  .loading {
    display: flex;
    justify-content: center;
    align-items: center;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(255, 255, 255, 0.7);
    z-index: 9999;
  }
}
</style>
