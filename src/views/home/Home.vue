<template>
  <Page>
    <div class="content homeContent">
      <a-row :gutter="[16, 16]" class="full-height-row">
        <a-col :span="18" class="full-height-col left-panel">
          <div class="top panel">
            <p class="title">系统概述</p>
            <a-row>
              <a-col :span="6">
                <a-statistic title="全部设备">
                  <template #formatter="{ value }">
                    <span :style="{ fontWeight: 'bold', color: '#3498DB' }">{{ data.total }}</span>
                  </template>
                </a-statistic>
              </a-col>
              <a-col :span="6">
                <a-statistic title="可用设备">
                  <template #formatter="{ value }">
                    <span :style="{ fontWeight: 'bold', color: '#2ECC71' }">{{ data.usable }}</span>
                  </template>
                </a-statistic>
              </a-col>
              <a-col :span="6">
                <a-statistic title="繁忙设备">
                  <template #formatter="{ value }">
                    <span :style="{ fontWeight: 'bold', color: '#F1C40F' }">{{ data.working }}</span>
                  </template>
                </a-statistic>
              </a-col>
              <a-col :span="6">
                <a-statistic title="离线设备">
                  <template #formatter="{ value }">
                    <span :style="{ fontWeight: 'bold', color: '#E74C3C' }">{{ data.offline }}</span>
                  </template>
                </a-statistic>
              </a-col>

            </a-row>
          </div>
          <div class="bottom panel">
            <p class="title">地理分布</p>
            <div ref="worldMap" class="world-map"></div>
          </div>
        </a-col>
        <a-col :span="6" class="full-height-col right-panel">
          <div class="right panel">
            <p class="title">系统信息</p>
            <ul>
              <li><span class="name">主机名称</span><span class="pull-right">{{ data.node }}</span></li>
              <li><span class="name">系统版本</span><span class="pull-right">{{ data.version }}</span></li>
              <li>
                <span class="name">启动时间</span><span class="pull-right">{{ util.timestampToDate(data.uptime) }}</span>
              </li>
              <li>
                <span class="name">授权到期</span><span class="pull-right">{{ util.timestampToDate(data.expire) }}</span>
              </li>
              <li><span class="name">授权数量</span><span class="pull-right">{{ data.limit }}</span></li>
              <li><span class="name">授权类型</span><span class="pull-right">{{ data.lic_type }}</span></li>
            </ul>
          </div>
        </a-col>
      </a-row>
    </div>
  </Page>
</template>

<script setup lang="ts">
import Page from "@/components/page/Page.vue";
import { onMounted, ref } from "vue";
import * as echarts from "echarts";
import worldJson from "@/assets/world.json";
import { getInfo } from "@/api/home";
import { getWorldData } from "@/api/home";
import util from "@/utils/util";

// 概述&系统信息数据
const data = ref({
  total: "",
  usable: "",
  working: "",
  offline: "",
  node: "",
  version: "",
  uptime: "",
  expire: "",
  limit: "",
  lic_type: "",
});
// 世界地图数据
interface MapItem {
  name: string;
  value: number;
}

const mapData = ref<MapItem[]>([]);

const worldMap = ref(null);

onMounted(() => {
  getInfos();
  getWorldDatas();
});

const drawMapChart = () => {
  const chart = echarts.init(worldMap.value);

  chart.showLoading(); // 显示加载动画

  // 使用 world.json 中的地图数据
  echarts.registerMap("world", worldJson as any);
  chart.hideLoading(); // 隐藏加载动画

  // 绘制地图
  chart.setOption({
    legend: {
      show: false,
    },
    tooltip: {
      trigger: "item",
      borderColor: "#666", //区域边框颜色
      formatter: function (params: any) {
        if (params.name) {
          return (
            params.name +
            " : " +
            (isNaN(params.value) ? 0 : parseInt(params.value))
          );
        }
      },
    },
    visualMap: {
      min: 0, //最小值
      max: 1000, //最大值
      orient: "vertical", //图例模式
      left: 10,
      bottom: 10,
      showLabel: false, //显示图例文本
      precision: 0, //数据展示无小数点
      itemWidth: 12, //图例宽度
      itemHeight: 12, //图例高度
      textGap: 10, //图例间距
      inverse: false, //数据反向展示
      hoverLink: true, //鼠标悬浮
      inRange: {
        //选中图例后背景半透明
        color: ["rgba(3,4,5,0.4)"],
        symbol: "rect", //更改图元样式
      },
      pieces: [
        {
          gte: 1000,
          lte: 9999,
          label: "千位",
          color: "#BB8FCE",
        },
        {
          gte: 100,
          lte: 999,
          label: "百位",
          color: "#F1948A",
        },
        {
          gte: 10,
          lte: 99,
          label: "十位",
          color: "#F8C471",
        },
        {
          gte: 1,
          lte: 9,
          label: "个位",
          color: "#82E0AA",
        },
        {
          lte: 0,
          label: "无设备",
          color: "#eaeded",
        },
      ],
      textStyle: {
        color: "#000",
        fontSize: 14, //图元字体大小
        fontWeight: 500,
      },
    },
    series: [
      {
        name: "World Population (2010)",
        type: "map",
        mapType: "world",
        zoom: 1.2, //地图大小
        roam: false, //禁止拖拽
        itemStyle: {
          normal: {
            areaColor: "#eaeded", //地图默认颜色
            borderWidth: 0.5, //边框宽度
            textStyle: {
              color: "#fff", //默认文字颜色
            },
            borderColor: "#000", //地图边框颜色
          },
          emphasis: {
            areaColor: "#85C1E9", //动态背景颜色
          },
        },
        select: {
          //地图选中颜色
          itemStyle: {
            areaColor: "#85C1E9",
          },
        },
        label: {
          normal: {
            //静态的时候展示样式
            show: false, //是否显示地图名称
            textStyle: {
              color: "#000", //颜色
              fontSize: 14, //文字大小
              fontFamily: "Arial",
            },
          },
          emphasis: {
            //动态展示的样式
            color: "#fff",
          },
        },
        data: mapData.value,
      },
    ],
  });

  window.addEventListener("resize", function () {
    chart.resize();
  });
};

const getInfos = async () => {
  const res = await getInfo(); // 假设getInfo返回一个Promise，包含你想要的数据
  // 直接更新data的.value属性
  // 确保你从响应中提取"data"部分
  if (res?.data?.status == 0) {
    data.value = res.data.data as typeof data.value;
  }
};

const getWorldDatas = async () => {
  const res: any = await getWorldData();
  if (res?.data?.status == 0) {
    mapData.value = res.data.data;
  } else {
    mapData.value = [];
  }
  drawMapChart();
};
</script>

<style lang="less" scoped>
.content {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 58px);

  .full-height-row {
    height: 100%;
  }

  .full-height-col {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .panel {
    margin: 5px 0;
    padding: 20px;
    background-color: #fff;
    box-shadow: 0px 0px 4px rgba(0, 94, 235, 0.1) !important;
    font-family: "Lato","Helvetica Neue",Helvetica,sans-serif;
    border-radius: 4px;
    overflow: hidden;
    flex: 1;
    ul {
      margin: 0;
      padding: 0;
      list-style: none;

      li {
        margin: 10px 0;
        color: #646a73;
      }
    }
    .pull-right {
      float: right;
    }
    .name {
      font-weight: 400 !important;
      color: #333;
      margin-right: 16px;
    }
  }

  .top {
    height: 150px;
    max-height: 150px;
  }

  .bottom {
    flex: 1;
    .world-map {
      width: 100%;
      height: 90%;
    }
  }

  .right {
    flex: 1;
  }

  .right-bottom {
    position: absolute;
    bottom: 5px;
    right: 10px;
    padding: 10px;
    display: inline-block;
  }

  .right-panel {
    position: relative;
  }

  .right-bottom-text {
    display: inline-block;
    vertical-align: bottom;
    margin-right: 10px;
    font-weight: 200;
    font-size: 0.75rem;
  }

  .title {
    position: relative;
    padding-left: 10px;
    font-weight: bold;
    font-size: 14px;
    &::before {
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      content: "";
      width: 4px;
      height: 14px;
      background: #005eeb;
      border-radius: 10px;
    }
  }
}

@media (max-width: 1024px) {
  .right-panel {
    display: none;
  }
  .left-panel {
    flex: 0 0 100% !important;
    max-width: 100% !important;
  }
}

:deep(.homeContent) {
  .ant-statistic {
    text-align: center;

    .ant-statistic-content {
      color: #005eeb;
    }
  }
}
</style>
