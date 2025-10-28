<template>
  <a-modal
    v-model:open="isFormOpen"
    title="创建组"
    ok-text="确定"
    cancel-text="取消"
    :confirm-loading="confirmLoading"
    @ok="onSubmitForm"
    @cancel="cancel"
  >
    <a-form :model="formState" :label-col="labelCol" :wrapper-col="wrapperCol">
      <a-input class="form-input" v-model:value="formState.name" placeholder="请输入组名" />
      <a-input class="form-input" v-model:value="formState.password" placeholder="请输入密码" />
      <a-input class="form-input" v-model:value="formState.contact" placeholder="组联系方式" />
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { addRecord } from "@/api/group";
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
  name: string;
  password: string;
  contact: string;
}
const formState: UnwrapRef<FormState> = reactive({
  name: "",
  password: "",
  contact: null
});

const confirmLoading = ref(false);
const onSubmitForm = async () => {
  confirmLoading.value = true;
  if (!(formState.name && formState.password)) {
    message.error("请输入组名和密码");
    confirmLoading.value = false;
    return;
  }
  const res = await addRecord(formState);
  if (res?.data?.status == 0) {
    confirmLoading.value = false;
    message.success("组创建成功");
    formState.name = "";
    formState.password = "";
    formState.contact = "";
    emits("RefreshList", { type: "add",isShow:false });
  } else {
    confirmLoading.value = false;
    message.error(`组创建失败：${res?.data?.message}`);
  }
};

const cancel = () => {
  formState.name = "";
  formState.password = "";
  formState.contact = "";
  confirmLoading.value=false;
  emits("RefreshList", { type: "cancel", isShow:false});
};
</script>

<style lang="less" scoped>
.form-input {
  margin-bottom: 10px;
}
</style>
