<template>
  <div class="content">
    <div class="left-half">
    </div>
    <div class="right-half">
      <img src="@/assets/logo.svg" alt="FireRPA" class="logo" />
      <h1 class="group-login-text">组登录</h1>
      <p class="group-login-description">输入您的凭据以访问设备管控中心</p>
      <div id="container">
        <form @submit.prevent="onSubmit" class="form">
          <input
            type="text"
            id="name"
            v-model="formState.name"
            required
            placeholder="请输入组名"
          />
          <input
            type="password"
            id="password"
            v-model="formState.password"
            required
            placeholder="请输入密码"
          />
          <input type="submit" value="登录" />
        </form>
      </div>
    </div>
    <footer class="footer">
      <p>&copy; 2024 - present, <img src="@/assets/logo.svg" alt="FireRPA" class="footer-logo" />.</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { reactive } from "vue";
import { useRouter } from "vue-router";
import { login } from "@/api/login";
import { message } from "ant-design-vue";
import auth from '@/utils/auth'

interface FormState {
  name: string;
  password: string;
}

const formState = reactive<FormState>({
  name: "",
  password: "",
});

const router = useRouter();
const onSubmit = async () => {
  const res = await login(formState.name, formState.password);
  if (res?.data?.status === 0) {
    auth.setToken(res.data.data.token)
    auth.setGroup(res.data.data)
    console.log(res.data.data);
    localStorage.setItem('selectedMenu', 'overview');
    router.push("/home");
  } else {
    message.error("组名或密码错误");
  }
};
</script>

<style scoped>
.content {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  font-family: Helvetica, Arial, sans-serif;
  font-size: 16px;
  padding: 0;
  margin: 0;
  position: relative;
}
.left-half {
  width: 50%;
  height: 100%;
  background: url('@/assets/background.jpg') no-repeat center center;
  background-size: cover;
}
.right-half {
  width: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #fff;
  padding: 6rem;

}
.logo {
  width: 150px;
  height: auto;
  margin-bottom: 2.5rem;
}
h1 {
  color: black;
  background-color: transparent;
  border-bottom: 0px solid #d0d0d0;
  font-size: 20px;
  font-weight: normal;
  margin: 0;
}
form {
  display: flex;
  flex-direction: column;
  padding: 1.2rem;
  position: relative;
  overflow: hidden;
  width: 100%;
}
input {
  text-align: center;
  box-sizing: border-box;
  font-size: 1rem;
  height: 2.25rem;
  line-height: 1.25rem;
  margin-top: 0.25rem;
  padding: 0.25rem 0.5rem;
  width: 100%;
  transition: all 0.05s;
  background: #f1f2f3;
  border: 1px solid #d0d0d0;
  border-radius: 0.15rem;
  font-size: 0.875rem;
  line-height: 1.25rem;
}
input:focus {
  outline: #2c3e50 solid 1px;
}
input[type="submit"] {
  border: none;
  outline: none;
  box-shadow: 0 0.1em 0 #e0e0e0, 0 0.1em 0.1em grey;
  font-size: inherit;
  font-weight: bold;
  margin-top: 1.25rem;
  padding-left: 0;
  text-transform: uppercase;
  border-radius: 0.25rem;
  background: #f8f9f9;
  color: #2c3e50;
}
#container {
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
}
.footer {
  color: #9e9e9e;
  font-family: monospace, "Courier New";
  text-align: center;
  position: absolute;
  font-size: 0.8rem;
  bottom: .8rem;
  right: .8rem;
}
.footer-logo {
  width: 58px;
}
.group-login-description {
    color: grey;
    font-size: 0.95rem;
}
.group-login-text {
    font-weight: bold;
    font-size: 1.35rem;
}
@media (max-width: 1024px) {
  .left-half {
    display: none;
  }
  .right-half {
    width: 100%;
  }
}
</style>
