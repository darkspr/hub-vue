<template>
  <div class="table-area">
    <a-table
      :columns="columns"
      :data-source="data"
      :pagination="pagination"
      :scroll="{ x: tableWidth, y: windowHeightMinusMargins }"
      :loading="loading"
      @change="onChangeTable"
    >
      <template v-slot:bodyCell="{ text, record, index, column }">
          <template v-if="column.key == 'operation'">
            <a-popconfirm
              title="确认要删除该组吗？"
              ok-text="确定"
              cancel-text="取消"
              @confirm="() => onDelete(record.id)"
            >
              <a-button type="link" danger @click.stop>删除</a-button>
            </a-popconfirm>
          </template>
          <template
            v-if="
              [
                'admin',
              ].includes(column.key)
            "
          >
            {{ text ? "是" : "否" }}
          </template>
          <template v-if="['login_time', 'reg_time'].includes(column.key)">
            {{ util.timestampToDate(text) }}
          </template>
        </template>
    </a-table>
  </div>
</template>
<script setup lang="ts">
import { fieldOptions } from "./components/fieldOptions.js";
import { computed, onMounted, ref, onBeforeMount } from "vue";
import { addRecord, deleteRecord, getList } from "@/api/group";
import { useWindowSize } from "@vueuse/core";
import { message } from "ant-design-vue";
import util from "@/utils/util";

const windowHeightMinusMargins = computed(() => height.value - 180);

interface IDataItem {
  name: string;
  contact: string;
  last_login_from: string | null;
  reg_time: number;
  login_time: number;
  admin: boolean;
}

const data = ref<IDataItem[]>([]);
const { width, height } = useWindowSize();
const tableWidth = computed(() => width.value - 200);
const pagination = ref({
  current: 1,
  pageSize: 25,
  total: data.value.length,
  showQuickJumper: true,
  showSizeChanger: true,
  pageSizeOptions: ["25", "50", "100"],
  showTotal: (total: any) => `共 ${total} 条`,
});

const columns = computed(() => {
  const dynamicColumns = fieldOptions
    .map((option) => ({
      title: option.label,
      dataIndex: option.value,
      key: option.value,
      width: 180,
      fixed: undefined,
      sorter: true,
    }));
    dynamicColumns.push({
      title: "操作",
      dataIndex: "operation",
      fixed: "right",
      width: 100,
      key: "operation",
      sorter: false
    });
  return dynamicColumns;
});
const sortParams = ref({
  sort: "",
  order: "",
});

const loading = ref(false);
function onChangeTable(pag: any, _filters: any, sorter: any) {
  pagination.value.current = pag.current;
  pagination.value.pageSize = pag.pageSize;
  sortParams.value.sort = sorter.field;
  sortParams.value.order = !sorter.order
    ? sorter.order
    : sorter.order == "ascend"
    ? "asc"
    : "desc";
  getLists();
}

const onDelete = async (id: number) => {
  const res = await deleteRecord(id);
  if (res?.data?.status == 0) {
    message.success("删除成功");
    getLists();
  } else {
    message.error(`删除失败：${res?.data?.message}`);
  }
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
    };
    if (sortParams.value.order) {
      Object.assign(params, { ...sortParams.value });
    }
    const res: any = await getList(params);
    if (res.data.data && typeof res.data.data === "object") {
      loading.value = false;
      data.value = res.data.data as typeof data.value;
      pagination.value.total = res.data.total;
    } else {
      loading.value = false;
      data.value = [];
    }
  } catch (error) {
    loading.value = false;
  }
};

onBeforeMount(() => {
  getLists();
});

onMounted(() => {});

defineExpose({
  getLists,
});
</script>

<style lang="less" scoped>
.table-area {
  width: 100%;

  .comment-cell {
    display: flex;
    align-items: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .edit-icon {
    margin-right: 8px;
  }

  .comment-text {
    flex-grow: 1;
  }

  .edit-line {
    display: flex;
    align-items: center;
  }

  .ico {
    margin-left: 4px;
  }
}
</style>
