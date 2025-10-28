<template>
  <a-modal
    v-model:open="isFormOpen"
    title="添加设备"
    ok-text="确定"
    cancel-text="取消"
    :confirm-loading="confirmLoading"
    @ok="onSubmitForm"
    @cancel="cancel"
  >
    <a-form :model="formState" :label-col="labelCol" :wrapper-col="wrapperCol">
      <a-input v-model:value="formState.ip" placeholder="请输入设备 IP" />
    </a-form>
  </a-modal>
</template>
<script setup lang="ts">
import { addRecord } from "@/api/list";
import { message } from "ant-design-vue";
import { ref, reactive ,watch, UnwrapRef} from "vue";
const emits = defineEmits(["RefreshList"]);
const props = defineProps({
  isFormOpen: {
    type: Boolean,
    default:false
  },
});
const isFormOpen=ref(false)
watch(
  () =>props.isFormOpen,
  (val) => {
    isFormOpen.value=val
  }
);
const labelCol = { style: { width: "150px" } };
const wrapperCol = { span: 14 };
interface FormState {
  ip: string;
}
const formState: UnwrapRef<FormState> = reactive({
  ip: "",
});

// 创建新设备插槽（仅限管理员）
const confirmLoading = ref(false);
const onSubmitForm = async () => {
  confirmLoading.value = true;
  if (!formState.ip) {
    confirmLoading.value = false;
    message.error(`请输入设备地址`);
    return;
  }
  const res = await addRecord(formState.ip);
  if (res?.data?.status == 0) {
    confirmLoading.value = false;
    message.success("插槽创建成功");
    emits("RefreshList", { type: "add",isShow:false });
  } else {
    confirmLoading.value = false;
    message.error(`插槽创建失败：${res?.data?.message}`);
  }
};

const cancel = () => {
  formState.ip = "";
  confirmLoading.value=false;
  emits("RefreshList", { type: "cancel", isShow:false});
};
</script>
