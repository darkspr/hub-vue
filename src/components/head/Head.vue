<template>
  <div class="header">
    <img src="@/assets/logo.svg" class="logo" />
    <a-menu
      class="menu"
      v-model:selectedKeys="current"
      mode="horizontal"
      :items="items"
      @click="onChangeMenu"
    />
    <a-dropdown>
      <template #default>
        <div class="user-menu">
          <FontAwesomeIcon :icon="faUser" class="user-icon" />
          <span class="username">{{ username }}</span>
        </div>
      </template>
      <template #overlay>
        <a-menu>
          <a-menu-item key="changePasswd" @click="handleChangePasswd({ isShow: true })">
            修改密码
          </a-menu-item>
          <a-menu-item key="logout" @click="logout">
            退出登录
          </a-menu-item>
        </a-menu>
      </template>
    </a-dropdown>
  </div>
  <ChangePasswd :isFormOpen="isFormOpen" @RefreshList="handleChangePasswd" />
</template>

<script lang="ts" setup>
import { h, ref, onMounted } from "vue";
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faSitemap, faDashboard, faObjectGroup, faUsers, faUser, faDesktop } from '@fortawesome/free-solid-svg-icons';
import { MenuProps, message } from "ant-design-vue";
import { useRoute, useRouter } from "vue-router";
import ChangePasswd from "./components/ChangePasswd.vue";
import axios from "../../api/axios";
import auth from "@/utils/auth";

const isFormOpen = ref<boolean>(false);
const handleChangePasswd = ({ isShow }) => {
  isFormOpen.value = isShow;
};

const current = ref<string[]>(["overview"]);
const items = ref<MenuProps["items"]>([
  {
    key: "overview",
    icon: () => h(FontAwesomeIcon, { icon: faDashboard, style: { fontSize: "24px", margin: "8px 5px 0 0"}}),
    label: h('span', { style: { display: 'inline-block', lineHeight: '38px', height: '45px', verticalAlign: 'middle' } }, '概览'),
    title: "概览",
  },
  {
    key: "device",
    icon: () => h(FontAwesomeIcon, { icon: faSitemap, style: { fontSize: "24px", margin: "8px 5px 0 0"}}),
    label: h('span', { style: { display: 'inline-block', lineHeight: '38px', height: '45px', verticalAlign: 'middle' } }, '设备'),
    title: "设备",
  },
  {
    key: "totalview",
    icon: () => h(FontAwesomeIcon, { icon: faObjectGroup, style: { fontSize: "24px", margin: "8px 5px 0 0"}}),
    label: h('span', { style: { display: 'inline-block', lineHeight: '38px', height: '45px', verticalAlign: 'middle' } }, '总览'),
    title: "总览",
  }
]);

const router = useRouter();
const username = auth.getGroup()?.name;
const isAdmin = auth.getGroup()?.admin;

const onChangeMenu = (item: any) => {
  const key = item.key;
  localStorage.setItem('selectedMenu', key);
  switch (key) {
    case "device":
      router.push("/list");
      break;
    case "overview":
      router.push("/home");
      break;
    case "totalview":
      router.push("/totalview");
      break;
    case "vnc":
      router.push("/vnc");
      break;
    case "group":
      router.push("/group");
      break;
    case "automation":
      message.info("开发中");
      break;
    case "tasks":
      message.info("开发中");
      break;
    default:
      break;
  }
};

const logout = async () => {
    const res = await axios.delete('/v1/group/login');
    if (res?.data?.status == 0) {
      router.push('/login');
    } else {
      message.error("退出登录失败");
      console.log(res);
    }
};

onMounted(() => {
  isAdmin && items.value.push(
    {
      key: "vnc",
      icon: () => h(FontAwesomeIcon, { icon: faDesktop, style: { fontSize: "24px", margin: "8px 5px 0 0"}}),
      label: h('span', { style: { display: 'inline-block', lineHeight: '38px', height: '45px', verticalAlign: 'middle' } }, '控制台'),
      title: "控制台",
    }
  )

  isAdmin && items.value.push(
    {
      key: "group",
      icon: () => h(FontAwesomeIcon, { icon: faUsers, style: { fontSize: "24px", margin: "8px 5px 0 0"}}),
      label: h('span', { style: { display: 'inline-block', lineHeight: '38px', height: '45px', verticalAlign: 'middle' } }, '组管理'),
      title: "组管理",
    }
  )
  const savedKey = localStorage.getItem('selectedMenu');
  if (savedKey) {
    current.value = [savedKey];
  }
});
</script>

<style lang="less" scoped>
.header {
  display: flex;
  align-items: center;
  padding: 0 20px;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.25);
  z-index: 500;
  height: 45px;
  max-height: 45px;
  background-color: #ffffff;
  position: relative;
  .logo {
    width: auto;
    height: 32px;
    cursor: pointer;
  }
  .menu {
    flex: 1;
    margin: 0 20px;
    height: 45px;
  }
  .user-menu {
    display: flex;
    align-items: center;
    cursor: pointer;
  }
  .user-icon {
    font-size: 16px;
    margin-right: 10px;
    color: grey;
  }
  .username {
    color: #000;
  }
}
</style>
