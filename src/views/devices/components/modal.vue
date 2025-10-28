<template>
  <a-modal
    v-model:open="open"
    title="表头选项"
    ok-text="确定"
    cancel-text="取消"
    @ok="hideModal"
     @cancel="cancel"
  >
    <a-checkbox-group
      v-model:value="state.checkedList"
      @change="handleFieldsChange"
    >
      <a-row>
        <a-col :span="8" v-for="option in fieldOptions" :key="option.value">
          <a-checkbox :value="option.value">{{ option.label }}</a-checkbox>
        </a-col>
      </a-row>
    </a-checkbox-group>
    <a-divider />
    <a-checkbox
      v-model:checked="state.checkAll"
      :indeterminate="state.indeterminate"
      @change="handleCheckAllChange"
    >
      全选
    </a-checkbox>
  </a-modal>
</template>
<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { message } from "ant-design-vue";
import { fieldOptions } from "./fieldOptions.js";
import { systemStoreHook } from "@/store/modules/devices";
const props = defineProps({
  open: {
    type: Boolean,
    default:false
  },
});
const open=ref(false)
watch(
  () =>props.open,
  (val) => {
    open.value=val
  }
);
const emits = defineEmits(["RefreshList"]);

const hideModal = () => {
  systemStoreHook().changeCheckedList(state.checkedList)
  emits("RefreshList",{isShow:false });
};

// 默认自定义字段选项
const defaultCheckedList = ref([
  "state",
  "token_id",
  "model",
  "brand",
  "abi",
  "sdk",
  "comment",
]);
const state = reactive({
  indeterminate: true,
  checkAll: false,
  checkedList:systemStoreHook().defaultCheckedList
});


/**
 * 选择自定义字段
 * @param event 选中的字段
 */
 const handleFieldsChange = (event: any) => {
  if (event.length === 0) {
    message.error("至少需要保留一个选项！");
    // 直接恢复默认的选中状态
    state.checkedList = [...defaultCheckedList.value];
  }
};
watch(
  () => state.checkedList,
  (val) => {
    state.indeterminate = !!val.length && val.length < fieldOptions.length;
    state.checkAll = val.length === fieldOptions.length;
  }
);

/**
 * 全选/反选自定义字段
 * @param event 选中的字段
 */
 const handleCheckAllChange = (event: any) => {
  if (fieldOptions.length === 0) return; // 避免在fieldOptions为空时操作
  Object.assign(state, {
    checkedList: event.target.checked
      ? fieldOptions.map((option) => option.value)
      : defaultCheckedList.value, // 这里也可以直接使用prop，取决于你的实际需求
    indeterminate: false,
  });
};

//取消
const cancel = () => {
  emits("RefreshList", { type: "cancel",isShow:false });
};
</script>
