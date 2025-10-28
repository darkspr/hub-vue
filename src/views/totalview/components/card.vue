<template>
  <div :class="['card-content',{'mask':isMask}]">
    <div ref="canvasBox" class="canvas-outer">
      <a-spin :indicator="indicator" v-if="loading"/>
      <div v-else-if="disconnectFlag" class="disconnect-text"><DisconnectOutlined :style="{ fontSize: '52px' }" /></div>
      <canvas v-else :id="'canvas-' + deviceItem.domain"></canvas>
    </div>
    <div class="device-info">
      <div class="domain dot">{{deviceItem.domain}}</div>
      <div class="brand dot">{{deviceItem.brand}}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, ref, onMounted, onUnmounted, nextTick, h } from 'vue';
import { DisconnectOutlined } from '@ant-design/icons-vue';
import axios from 'axios';
import { tuple } from 'ant-design-vue/es/_util/type';
import { LoadingOutlined } from '@ant-design/icons-vue';

const props = defineProps({
  deviceItem: {
    type: Object,
    default: null
  }
});
const indicator = h(LoadingOutlined, {
    style: {
      fontSize: '32px',
    },
    spin: true,
});
const isMask = ref(props.deviceItem.state != 1);
const canvasBox = ref(null);
let rtsCanvas: RtsCanvas | null = null;
const loading = ref(false);
const disconnectFlag = ref(props.deviceItem.state != 1);

class RtsCanvas {
  private player: any;
  private base: string;
  private quality: number;
  private fps: number;
  private scale: number;
  private decoder: any;
  private live: WebSocket | null;
  private canvas: any;
  private image: any;
  private ctx2d: any;

  constructor(config: any) {
    this.init(config)
  }

  async init(config) {
    // 初始化和 HTTP 请求逻辑...
    let width = 0;
    let height = 0;
    loading.value = true;
    try{
      const { data, status } = await axios({
        url: config.base.replace(/^ws/, 'http') + "ui/stub",
        data: '{"method":"deviceInfo","params":[]}',
        method: 'POST',
        timeout: 15000
      });
      loading.value = false;
      await nextTick();
      if (status === 200) {
        this.image = new Image();
        this.canvas = document.getElementById(config.nodeId) as HTMLCanvasElement;
        this.ctx2d = this.canvas.getContext("2d");

        width = data.result.displayWidth;
        height = data.result.displayHeight;
        if (!data.result.naturalOrientation) {
            width = data.result.displayHeight;
            height = data.result.displayWidth;
        }
        const canvasBoxWidth = canvasBox.value.clientWidth;
        const canvasBoxHeight = canvasBox.value.clientHeight;
        const factor = (canvasBoxWidth / width) < (canvasBoxHeight / height) ? (canvasBoxWidth / width) : (canvasBoxHeight / height);

        this.canvas.width = width;
        this.canvas.height = height;

        const rw = Math.floor(width * factor);
        const rh = Math.floor(height * factor);
        this.canvas.style.width = `${rw}px`;
        this.canvas.style.height = `${rh}px`;

        this.base = config.base;
        this.quality = config.quality || 25;
        this.fps = config.fps || 10;
        this.scale = config.scale || 0.4;
        this.live = new WebSocket(`${this.base}ws/screen/${this.fps}@${this.quality}/live?scale=${this.scale}&type=mjpeg&backend=0`);
        this.live.binaryType = "blob";

        this.live.onopen = this.onopen.bind(this);
        this.live.onmessage = this.onmessage.bind(this);
        this.live.onclose = this.onclose.bind(this);
        this.live.onerror = this.onerror.bind(this);
      } else {
        // 请求失败，处理错误
        isMask.value = true;
      }
    }catch(error){
      // 处理错误
      console.log(error);
      isMask.value = true;
      loading.value = false;
      disconnectFlag.value = true;
    }
  }

  onerror(event: Event) {
    console.log('onerror', event);
    isMask.value = true;
    disconnectFlag.value = true;
  }

  onclose(event: CloseEvent) {
    console.log('onclose', event);
  }

  onmessage(event: MessageEvent) {
    var blob = new Blob([event.data], {type:"image/jpeg"});
    var URL = window.URL || window.webkitURL;
    var that = this;
    this.image.onload = function() {
      that.ctx2d.drawImage(that.image, 0, 0, that.canvas.width, that.canvas.height);
      that.image.onload = null;
    }
    this.image.src = URL.createObjectURL(blob);
  }

  onopen(event: Event) {
    axios.post(this.base.replace(/^ws/, 'http') + "ui/stub", JSON.stringify({"method":"makeToast","params":["FireRPA control connected",0]})).then(res => {}).catch(error => {});
    console.log(`onopen:${props.deviceItem.domain}`, event);
  }
  // 关闭连接
  close() {
    if (this.live) {
      this.live.close();
      this.live = null;
    }
  }
}

const connectOneScreen = async () => {
  rtsCanvas = new RtsCanvas({
    base: `${location.protocol.replace("http", "ws")}//${location.host}/d/${props.deviceItem.domain}/`,
    nodeId: `canvas-${props.deviceItem.domain}`
  });
};

onMounted(() => {
  if(!isMask.value){
    connectOneScreen();
  }
});
onUnmounted(() => {
  console.log(`onUnmounted:${props.deviceItem.domain}`,rtsCanvas)
  if (rtsCanvas) {
    rtsCanvas.close();
  }
});
</script>

<style lang="less" scoped>
.card-content{
  width: 100%;
  height: 290px;
  max-width: 160px;
  cursor: pointer;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
  background: #ffffff;
  position: relative;
  overflow: hidden;
  transition: box-shadow 0.1s ease-in-out; /* 平滑过渡阴影效果 */
  .canvas-outer{
    height: calc(100% - 28px);
    border-bottom: 1px solid #f0f0f0;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .device-info{
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: #999999;
    font-size: .85rem;
    padding: 0 8px;
    .domain{
      margin-right: 10px;
      text-align: left;
      flex: 1;
    }
    .brand{
      text-align: right;
    }
    .dot{
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
  .disconnect-text{
    z-index: 99;
  }
  &:hover{
     box-shadow: 0 0 15px rgba(0, 0, 0, 0.3);
  }
  &.mask{
    cursor:not-allowed!important;
    // background:#d9d9d9;
    color:#00000040;
    &::before{
      position:absolute;
      left:0px;
      top:0px;
      width:100%;
      height:100%;
      background-color:rgba(217,217,217,.7);
      content:'';
      border-radius:8px;
    }
    &:hover{
      box-shadow: unset;
    }
  }
}
</style>
