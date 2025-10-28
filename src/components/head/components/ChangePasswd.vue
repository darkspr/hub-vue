<template>
  <a-modal
    v-model:open="isFormOpen"
    title="修改密码"
    ok-text="确定"
    cancel-text="取消"
    :confirm-loading="confirmLoading"
    @ok="onSubmitForm"
    @cancel="cancel"
  >
    <a-form :model="formState" :label-col="labelCol" :wrapper-col="wrapperCol">
      <a-input class="form-input" v-model:value="formState.password1" placeholder="请输入密码" />
      <a-input class="form-input" v-model:value="formState.password2" placeholder="请确认密码" />
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { changePsw } from "@/api/group";
import { message } from "ant-design-vue";
import { ref, reactive ,watch, UnwrapRef} from "vue";
import auth from "@/utils/auth";

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
  password1: string;
  password2: string;
}
const uid = auth.getGroup()?.id;
const formState: UnwrapRef<FormState> = reactive({
  password1: "",
  password2: "",
});

const confirmLoading = ref(false);
const onSubmitForm = async () => {
  confirmLoading.value = true;
  if (formState.password1 !== formState.password2) {
    message.error("输入的密码不匹配");
    confirmLoading.value = false;
    return;
  }
  const res = await changePsw(uid, formState.password1);
  if (res?.data?.status == 0) {
    confirmLoading.value = false;
    message.success("密码修改成功");
    formState.password1 = "";
    formState.password2 = "";
    emits("RefreshList", { type: "add",isShow:false });
  } else {
    confirmLoading.value = false;
    message.error(`密码修改失败`);
  }
};

const cancel = () => {
  formState.password1 = "";
  formState.password2 = "";
  confirmLoading.value=false;
  emits("RefreshList", { type: "cancel", isShow:false});
};
</script>

<style lang="less" scoped>
.form-input {
  margin-bottom: 10px;
}
</style>
