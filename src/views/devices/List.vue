<template>
  <div class="table-area">
    <a-table
      :columns="columns"
      :data-source="data"
      :pagination="pagination"
      :scroll="{ x: tableWidth, y: windowHeightMinusMargins }"
      :loading="loading"
      @change="onChangeTable"
      :customRow="rowClick"
    >
      <template v-slot:bodyCell="{ text, record, index, column }">
        <template
          v-if="
            (text === undefined || text === null || text === '') &&
            column.key != 'comment' &&
            column.key != 'operation'
          "
        >
        </template>

        <template v-else>
          <template v-if="column.dataIndex === 'comment'">
            <div v-if="!isEditing || editingRowIndex !== index" class="comment-cell">
              <a-tooltip placement="right">
                <template #title>{{ text || "" }}</template>
                <HighlightOutlined v-if="isAdmin" class="edit-icon"
                  @click.stop="startEdit(index, record.comment)"
                />
              <span class="comment-text">{{ text || "" }}</span>
              </a-tooltip>
            </div>
            <div v-else class="edit-line">
              <a-input
                :value="editingCommentText"
                @click.stop
                @input.stop="($event: any) => editingCommentText = $event.target.value"
              />
              <CheckOutlined
                class="ico"
                @click.stop="onChangeComment('save')"
              />
              <CloseOutlined
                class="ico"
                @click.stop="onChangeComment('cancel')"
              />
            </div>
          </template>
          <template v-if="column.key == 'state'">
            <span style="color: #2ECC71" v-if="text == 1">在线</span>
            <span style="color: #E74C3C" v-if="text == 0">离线</span>
            <span style="color: #3498DB" v-if="text == -1">待接入</span>
          </template>

          <template v-if="column.key == 'operation'">
            <a-popconfirm
              title="确认要删除该设备槽位吗？"
              ok-text="确定"
              cancel-text="取消"
              @confirm="() => onDelete(record.domain)"
            >
              <a-button type="link" danger @click.stop>删除</a-button>
            </a-popconfirm>
          </template>
          <template
            v-if="
              [
                'batt_charging',
                'api_available',
                'locked',
                'controlling',
              ].includes(column.key)
            "
          >
            {{ text ? "是" : "否" }}
          </template>
          <template v-if="['boot_time', 'reg_time'].includes(column.key)">
            {{ util.timestampToDate(text) }}
          </template>
          <template v-if="['boot_time', 'reg_time'].includes(column.key)">
            {{ util.timestampToDate(text) }}
          </template>
          <template v-if="['sdk'].includes(column.key)">
            {{ util.sdkToVersion(text) }}
          </template>
          <template v-if="['disk_total', 'mem_total'].includes(column.key)">
            {{ util.bytesTokmgbString(text) }}
          </template>
        </template>
      </template>
    </a-table>
  </div>
</template>
<script setup lang="ts">
import {
  HighlightOutlined,
  CheckOutlined,
  CloseOutlined,
} from "@ant-design/icons-vue";
import { fieldOptions } from "./components/fieldOptions.js";
import { computed, onMounted, reactive, ref, watch, onBeforeMount } from "vue";
import { addRecord, changeComment, deleteRecord, getList } from "@/api/list";
import { useWindowSize } from "@vueuse/core";
import { systemStoreHook } from "@/store/modules/devices";
import { message } from "ant-design-vue";
import util from "@/utils/util";
import auth from "@/utils/auth";

const windowHeightMinusMargins = computed(() => height.value - 180);
const isAdmin = auth.getGroup()?.admin;

interface IDataItem {
  domain: string;
  token_id: string;
  comment: string | null;
  boot_time: number;
  disk_total: number;
  mem_total: number;
  cpu_count: number;
  batt_charging: boolean;
  api_available: boolean;
  locked: boolean;
  controlling: boolean;
  brand: string;
  device: string;
  model: string;
  abi: string;
  version: string;
  sdk: string;
  hardware: string;
  board: string;
  reg_time: number;
  state: number;
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
    .filter((option) =>
      systemStoreHook().defaultCheckedList.includes(option.value)
    )
    .map((option) => ({
      title: option.label,
      dataIndex: option.value,
      key: option.value,
      width: 180,
      fixed: undefined,
      sorter: true,
    }));
  isAdmin &&
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

const rowClick = (record) => {
  return {
    onClick: (event) => {
      if (record.state == -1) {
        message.error("没有设备连接该插槽");
        return;
      }
      systemStoreHook().changeactiveKey("2");
      systemStoreHook().setDeviceDomain(record.domain);
    },
  };
};

const onDelete = async (domain: string) => {
  const res = await deleteRecord(domain);
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

const isEditing = ref(false);
const editingRowIndex = ref(-1);
const editingCommentText = ref("");
const startEdit = (rowIndex: number, comment: string) => {
  editingRowIndex.value = rowIndex;
  editingCommentText.value = comment;
  isEditing.value = true;
};

const onChangeComment = async (action: string) => {
  if (action === "save" && editingRowIndex.value !== -1) {
    try {
      const res = await changeComment(data.value[editingRowIndex.value].domain, editingCommentText.value);
      if (res?.data?.status == 0) {
        data.value[editingRowIndex.value].comment = editingCommentText.value;
        message.success("修改成功");
      } else {
        message.error(`修改失败：${res?.data?.message}`);
      }
    } finally {
      resetEdit();
    }
  } else if (action === "cancel") {
    resetEdit();
  }
};

const resetEdit = () => {
  editingRowIndex.value = -1;
  editingCommentText.value = "";
  isEditing.value = false;
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
