<template>
    <div class="detail-content">
      <div class="device-info">
        <div class="info">
          <div class="title">设备信息
            <div class="detail-buttons">
              <a-tooltip v-if="isCharging" placement="right">
                <template #title>正在充电</template>
                <a class="detail-buttons-item" target="_blank">
                  <ThunderboltOutlined :style="{ fontSize: '16px', color: 'rgb(241 196 15)' }" />
                </a>
              </a-tooltip>
              <a-tooltip v-if="isApiAvailable" placement="right">
                <template #title>接口可用</template>
                <a class="detail-buttons-item" target="_blank">
                  <ApiOutlined :style="{ fontSize: '16px', color: 'rgb(40 180 99)' }" />
                </a>
              </a-tooltip>
              <a-tooltip placement="right">
                <template #title>下载接口证书</template>
                <a @click="downloadApiCert" class="detail-buttons-item" target="_blank">
                  <VerifiedOutlined :style="{ fontSize: '16px', color: 'rgb(52 152 219)' }" />
                </a>
              </a-tooltip>
              <a-tooltip v-if="isOnline" placement="right">
                <template #title>转到远程桌面</template>
                <a :href="getRemoteDeskLink()" class="detail-buttons-item" target="_blank">
                  <ExportOutlined :style="{ fontSize: '16px', color: 'rgb(107 114 128)' }" />
                </a>
              </a-tooltip>
            </div>
          </div>
          <div v-for="(item, index) in deviceInfo" :key="index" class="info-item">
            <div class="name">{{ item.name }}</div>
            <div class="value">{{ item.value }}</div>
          </div>
        </div>
        <div class="title">所属组别
          <div v-if="isAdmin" class="add-btn" @click="toAddDeviceGroup">
            <PlusOutlined :style="{ fontSize: '16px', color: 'rgb(107 114 128)' }" />
          </div>
        </div>
        <div class="owner-list">
          <div v-for="(groupItem, groupIndex) in deviceGroupList" :key="groupIndex" class="owner-item">
            <div class="owner-info">
              <div class="avatar">
                <RobotOutlined :style="{ fontSize: '22px', color: 'rgb(107 114 128)' }" />
              </div>
              <div class="name-outer">
                <div class="name">{{ groupItem.name }}</div>
                <div class="contact">{{ groupItem.contact }}</div>
              </div>
            </div>
            <div v-if="isAdmin" class="remove-btn">
              <a-popconfirm title="确认要移除该组别吗？" ok-text="确定" cancel-text="取消"
                @confirm="() => handleDeviceGroupRemove(groupItem)">
                <DeleteOutlined :style="{ fontSize: '22px', color: 'rgb(239 68 68)' }" />
              </a-popconfirm>
            </div>
          </div>
        </div>
      </div>
      <div class="device-charts">
        <div class="chart-container">
          <div class="chart-title">实时状态</div>
          <div class="chart status-chart">
            <div class="chart-top">
              <canvas id="cpuMonitor" style="width:100%;height:15vh" ref="cpuMonitorRef"></canvas>
              <canvas id="memMonitor" style="width:100%;height:15vh"></canvas>
            </div>
            <div class="chart-bottom">
              <canvas id="netMonitor" style="width:100%;height:15vh"></canvas>
            </div>
          </div>
        </div>
        <div class="chart-container">
          <div ref="cpuChart" class="chart"></div>
        </div>
        <div class="chart-container">
          <div ref="resourceChart" class="chart"></div>
        </div>
        <div class="chart-container">
          <div ref="memoryChart" class="chart"></div>
        </div>
      </div>
      <a-modal
        v-if="isAdmin"
        v-model:open="deviceUserAddOpen"
        title="添加组"
        ok-text="确认"
        cancel-text="取消"
        @ok="handleDeviceUserAdd"
        :style="{ top: '50px' }"
      >
        <div class="radio-group-container">
          <a-radio-group v-model:value="addUserId" class="radio-group">
            <a-radio
              v-for="(item, index) in allUserList"
              :key="index"
              :value="item.id"
              class="radio-item"
            >
              <span class="radio-content">
                <span class="group-left">
                  <RobotOutlined class="group-icon" />
                  <span class="group-name">{{ item.name }}</span>
                </span>
                <span class="group-contact">{{ item.contact }}</span>
              </span>
            </a-radio>
          </a-radio-group>
        </div>
      </a-modal>
    </div>
  </template>
  <script setup lang="ts">
  import { defineProps, ref, onMounted, onUnmounted } from 'vue';
  import { RobotOutlined, DeleteOutlined, PlusOutlined, ExportOutlined, VerifiedOutlined, ThunderboltOutlined, ApiOutlined } from '@ant-design/icons-vue';
  import * as echarts from 'echarts';
  import { SmoothieChart, TimeSeries } from 'smoothie';
  import { systemStoreHook } from '@/store/modules/devices';
  import { deviceInfoApi, allGroupListApi, deviceGroupListApi, deviceGroupAddApi, deviceGroupRemoveApi, deviceStatusApi } from '@/api/detail';
  import { message } from 'ant-design-vue';
  import { formatDistance, subDays } from 'date-fns'
  import { zhCN } from 'date-fns/locale'
  import util from "@/utils/util";
  import auth from "@/utils/auth";

  const props = defineProps({
    activeKey: {
      type: String,
      default: ''
    }
  });

  const isAdmin = auth.getGroup()?.admin;
  const deviceCert = ref(null);
  const isOnline = ref(null);
  const isCharging = ref(null);
  const isApiAvailable = ref(null);
  const deviceInfo = ref([]);
  const deviceGroupList = ref([]);
  const allUserList = ref([]);
  const addUserId = ref('');
  const deviceUserAddOpen = ref(false);
  const ws = ref<WebSocket | null>(null);
  const memoryChart = ref(null);
  const resourceChart = ref(null);
  const cpuChart = ref(null);
  const memMon=ref<any>(null);
  const radioStyle = {
    display: 'flex',
    height: '30px',
    lineHeight: '30px'
  };
  const cpuMonitorRef=ref()
  let timerId = null;
  const xData = ref([]);
  const cpuSeriesData = ref([]);
  const userSeriesData = ref([]);
  const systemSeriesData = ref([]);
  const freeSeriesData = ref([]);
  const cachedSeriesData = ref([]);
  const buffersSeriesData = ref([]);
  const availableSeriesData = ref([]);
  const fileSeriesData = ref([]);
  const sockettcpSeriesData = ref([]);
  const socketudpSeriesData = ref([]);
  const threadSeriesData = ref([]);
  const crashSeriesData = ref([]);

  const getDeviceInfo = async () => {
    const res = await deviceInfoApi(systemStoreHook().deviceDomain);
    if (res?.data?.status === 0) {
      const data = res.data.data;
      isOnline.value = data.state === 1;
      isCharging.value = data.batt_charging;
      isApiAvailable.value = data.api_available;
      deviceCert.value = data.cert;
      deviceInfo.value = [
        { name: '设备域名', value: data.domain },
        { name: '设备状态', value: data.state==1?"在线": (data.state==0?"离线": "未知") },
        { name: '公网地址', value: data.public_ip},
        { name: '内网地址', value: data.default_ip},
        { name: '所在地区', value: data.ip_city},
        { name: '设备品牌', value: data.brand },
        { name: '设备型号', value: data.model },
        { name: '系统版本', value: util.sdkToVersion(data.sdk) },
        { name: '设备架构', value: data.abi },
        { name: '内存大小', value: util.bytesTokmgbString(data.mem_total, ' ') },
        { name: '磁盘大小', value: util.bytesTokmgbString(data.disk_total, ' ') },
        { name: '运行时间', value: data.state==1?formatDistance(new Date(), new Date(data.boot_time * 1000), { locale: zhCN }):"未知" },
        { name: '最后心跳', value: formatDistance(new Date(), new Date(data.heartbeat_time * 1000), { locale: zhCN }) },
      ];
    } else {
      deviceInfo.value = [];
    }
  };

  const getRemoteDeskLink = function () {
    return "d/" + systemStoreHook().deviceDomain + "/";
  }

  const downloadApiCert = function () {
    if (!deviceCert.value) {
      message.error("无法下载接口证书");
      return;
    }
    let blob = new Blob([deviceCert.value], { type: deviceCert.value.type });
    let downloadElement = document.createElement('a');
    let href = window.URL.createObjectURL(blob);
    downloadElement.href = href;
    downloadElement.download = systemStoreHook().deviceDomain + ".pem";
    document.body.appendChild(downloadElement);
    downloadElement.click();
    document.body.removeChild(downloadElement);
    window.URL.revokeObjectURL(href);
  }

  const getAllUser = async () => {
    if (!isAdmin) {
      return;
    }
    const params = { page: 1, size: 1000 };
    const res = await allGroupListApi(params);
    if (res?.data?.status === 0) {
      allUserList.value = res.data.data;
    } else {
      allUserList.value = [];
    }
  };

  const getDeviceUser = async () => {
    const params = { domain: systemStoreHook().deviceDomain, page: 1, size: 1000 };
    const res = await deviceGroupListApi(params);
    if (res?.data?.status === 0) {
      deviceGroupList.value = res.data.data;
    } else {
      deviceGroupList.value = [];
    }
  };

  const toAddDeviceGroup = () => {
    addUserId.value = '';
    deviceUserAddOpen.value = true;
  };

  const handleDeviceUserAdd = async () => {
    if (!addUserId.value) {
      return message.warning('请选择要添加的组');
    }
    const res = await deviceGroupAddApi(systemStoreHook().deviceDomain, addUserId.value);
    if (res?.data?.status === 0) {
      deviceUserAddOpen.value = false;
      message.success('添加成功');
      getDeviceUser();
    } else {
      message.error(`添加失败：${res?.data?.message}`);
    }
  };

  const handleDeviceGroupRemove = async (groupItem) => {
    const res = await deviceGroupRemoveApi(systemStoreHook().deviceDomain, groupItem.id);
    if (res?.data?.status === 0) {
      message.success('组权限已移除');
      getDeviceUser();
    } else {
      message.error(`组移除失败：${res?.data?.message}`);
    }
  };

  const getDeviceStatus = async () => {
    const res = await deviceStatusApi(systemStoreHook().deviceDomain);
    if (res?.data?.status === 0) {
      res?.data?.data && res?.data?.data.reverse().forEach(dataItem => {
        const formatDateTime = util.timestampToDate(dataItem.timestamp);
        xData.value.push(formatDateTime);
        cpuSeriesData.value.push([formatDateTime, dataItem.cpu_percent]);
        userSeriesData.value.push([formatDateTime, dataItem.cpu_times_user]);
        systemSeriesData.value.push([formatDateTime, dataItem.cpu_times_system]);

        freeSeriesData.value.push([formatDateTime, util.bytesToMB(dataItem.mem_free)]);
        buffersSeriesData.value.push([formatDateTime, util.bytesToMB(dataItem.mem_buffers)]);
        cachedSeriesData.value.push([formatDateTime, util.bytesToMB(dataItem.mem_cached)]);
        availableSeriesData.value.push([formatDateTime, util.bytesToMB(dataItem.mem_available)]);

        fileSeriesData.value.push([formatDateTime, dataItem.fd_count]);
        sockettcpSeriesData.value.push([formatDateTime, dataItem.tcpcon_count]);
        socketudpSeriesData.value.push([formatDateTime, dataItem.udpcon_count]);
        threadSeriesData.value.push([formatDateTime, dataItem.thread_count]);
        crashSeriesData.value.push([formatDateTime, dataItem.crash_count]);
      })

      initCpuChart();
      initMemoryChart();
      initResourceChart();
    } else {
      console.log(status)
    }
  }

  const initMemoryChart = () => {
    const myChart = echarts.init(memoryChart.value);
    myChart.setOption({
      'animation': true,
      'animationThreshold': 2000,
      'animationDuration': 1000,
      'animationEasing': 'cubicOut',
      'animationDelay': 0,
      'animationDurationUpdate': 300,
      'animationEasingUpdate': 'cubicOut',
      'animationDelayUpdate': 0,
      'aria': {
        'enabled': false
      },
      'color': [
        '#5470c6',
        '#91cc75',
        '#fac858',
        '#ee6666',
        '#73c0de',
        '#3ba272',
        '#fc8452',
        '#9a60b4',
        '#ea7ccc'
      ],
      'series': [
        {
          'type': 'line',
          'name': 'free (MB)',
          'connectNulls': false,
          'xAxisIndex': 0,
          'symbolSize': 4,
          'showSymbol': true,
          'smooth': false,
          'clip': true,
          'step': false,
          'data': freeSeriesData.value,
          'label': {
            'show': false,
            'margin': 8
          },
          'logBase': 10,
          'seriesLayoutBy': 'column',
          'lineStyle': {
            'show': true,
            'width': 1,
            'opacity': 1,
            'curveness': 0,
            'type': 'solid'
          },
          'areaStyle': {
            'opacity': 0.25
          },
          'zlevel': 0,
          'z': 0,
          'rippleEffect': {
            'show': true,
            'brushType': 'stroke',
            'scale': 2.5,
            'period': 4
          }
        },
        {
          'type': 'line',
          'name': 'buffer (MB)',
          'connectNulls': false,
          'xAxisIndex': 0,
          'symbolSize': 4,
          'showSymbol': true,
          'smooth': false,
          'clip': true,
          'step': false,
          'data': buffersSeriesData.value,
          'label': {
            'show': false,
            'margin': 8
          },
          'logBase': 10,
          'seriesLayoutBy': 'column',
          'lineStyle': {
            'show': true,
            'width': 1,
            'opacity': 1,
            'curveness': 0,
            'type': 'solid'
          },
          'areaStyle': {
            'opacity': 0.25
          },
          'zlevel': 0,
          'z': 0,
          'rippleEffect': {
            'show': true,
            'brushType': 'stroke',
            'scale': 2.5,
            'period': 4
          }
        },
        {
          'type': 'line',
          'name': 'cached (MB)',
          'connectNulls': false,
          'xAxisIndex': 0,
          'symbolSize': 4,
          'showSymbol': true,
          'smooth': false,
          'clip': true,
          'step': false,
          'data': cachedSeriesData.value,
          'label': {
            'show': false,
            'margin': 8
          },
          'logBase': 10,
          'seriesLayoutBy': 'column',
          'lineStyle': {
            'show': true,
            'width': 1,
            'opacity': 1,
            'curveness': 0,
            'type': 'solid'
          },
          'areaStyle': {
            'opacity': 0.25
          },
          'zlevel': 0,
          'z': 0,
          'rippleEffect': {
            'show': true,
            'brushType': 'stroke',
            'scale': 2.5,
            'period': 4
          }
        },
        {
          'type': 'line',
          'name': 'available (MB)',
          'connectNulls': false,
          'xAxisIndex': 0,
          'symbolSize': 4,
          'showSymbol': true,
          'smooth': false,
          'clip': true,
          'step': false,
          'data': availableSeriesData.value,
          'label': {
            'show': false,
            'margin': 8
          },
          'logBase': 10,
          'seriesLayoutBy': 'column',
          'lineStyle': {
            'show': true,
            'width': 1,
            'opacity': 1,
            'curveness': 0,
            'type': 'solid'
          },
          'areaStyle': {
            'opacity': 0.25
          },
          'zlevel': 0,
          'z': 0,
          'rippleEffect': {
            'show': true,
            'brushType': 'stroke',
            'scale': 2.5,
            'period': 4
          }
        }
      ],
      'legend': [
        {
          'data': [
            'free (MB)',
            'buffer (MB)',
            'cached (MB)',
            'available (MB)'
          ],
          'selected': {},
          'show': true,
          'padding': 5,
          'itemGap': 10,
          'itemWidth': 25,
          'itemHeight': 14,
          'backgroundColor': 'transparent',
          'borderColor': '#ccc',
          'borderRadius': 0,
          'pageButtonItemGap': 5,
          'pageButtonPosition': 'end',
          'pageFormatter': '{current}/{total}',
          'pageIconColor': '#2f4554',
          'pageIconInactiveColor': '#aaa',
          'pageIconSize': 15,
          'animationDurationUpdate': 800,
          'selector': false,
          'selectorPosition': 'auto',
          'selectorItemGap': 7,
          'selectorButtonGap': 10,
          'left': 'right'
        }
      ],
      'tooltip': {
        'show': true,
        'trigger': 'item',
        'triggerOn': 'mousemove|click',
        'axisPointer': {
          'type': 'line'
        },
        'showContent': true,
        'alwaysShowContent': false,
        'showDelay': 0,
        'hideDelay': 100,
        'enterable': false,
        'confine': false,
        'appendToBody': false,
        'transitionDuration': 0.4,
        'textStyle': {
          'fontSize': 14
        },
        'borderWidth': 0,
        'padding': 5,
        'order': 'seriesAsc'
      },
      'xAxis': [
        {
          'show': true,
          'scale': false,
          'nameLocation': 'end',
          'nameGap': 15,
          'gridIndex': 0,
          'inverse': false,
          'offset': 0,
          'splitNumber': 5,
          'minInterval': 0,
          'splitLine': {
            'show': true,
            'lineStyle': {
              'show': true,
              'width': 1,
              'opacity': 1,
              'curveness': 0,
              'type': 'solid'
            }
          },
          'data': xData.value
        }
      ],
      'yAxis': [
        {
          'show': true,
          'scale': false,
          'nameLocation': 'end',
          'nameGap': 15,
          'gridIndex': 0,
          'inverse': false,
          'offset': 0,
          'splitNumber': 5,
          'minInterval': 0,
          'splitLine': {
            'show': true,
            'lineStyle': {
              'show': true,
              'width': 1,
              'opacity': 1,
              'curveness': 0,
              'type': 'solid'
            }
          }
        }
      ],
      'title': [
        {
          'show': true,
          'text': '内存',
          'target': 'blank',
          'subtarget': 'blank',
          'left': 'left',
          'padding': 3,
          'itemGap': 10,
          'textAlign': 'auto',
          'textVerticalAlign': 'auto',
          'triggerEvent': false,
          'textStyle': {
            'fontSize': 18,
            'color': '#707B7C'
          }
        }
      ],
      'toolbox': {
        'show': true,
        'orient': 'horizontal',
        'itemSize': 15,
        'itemGap': 10,
        'left': '80%'
      },
      'dataZoom': [
        {
          'show': true,
          'type': 'inside',
          'start': 0,
          'end': 100,
        }
      ],
      'grid': {
        'left': 50,
        'right': 10,
        'top': 50,
        'bottom': 20
      }
    });
  };
  
  const initResourceChart = () => {
    const myChart = echarts.init(resourceChart.value);
    myChart.setOption({
      'animation': true,
      'animationThreshold': 2000,
      'animationDuration': 1000,
      'animationEasing': 'cubicOut',
      'animationDelay': 0,
      'animationDurationUpdate': 300,
      'animationEasingUpdate': 'cubicOut',
      'animationDelayUpdate': 0,
      'aria': {
        'enabled': false
      },
      'color': [
        '#5470c6',
        '#91cc75',
        '#fac858',
        '#ee6666',
        '#73c0de',
        '#3ba272',
        '#fc8452',
        '#9a60b4',
        '#ea7ccc'
      ],
      'series': [
        {
          'type': 'line',
          'name': 'File',
          'connectNulls': false,
          'xAxisIndex': 0,
          'symbolSize': 4,
          'showSymbol': true,
          'smooth': false,
          'clip': true,
          'step': false,
          'data': fileSeriesData.value,
          'label': {
            'show': true,
            'margin': 8
          },
          'logBase': 10,
          'seriesLayoutBy': 'column',
          'lineStyle': {
            'show': true,
            'width': 1,
            'opacity': 1,
            'curveness': 0,
            'type': 'solid'
          },
          'areaStyle': {
            'opacity': 0
          },
          'zlevel': 0,
          'z': 0
        },
        {
          'type': 'line',
          'name': 'Socket (TCP)',
          'connectNulls': false,
          'xAxisIndex': 0,
          'symbolSize': 4,
          'showSymbol': true,
          'smooth': false,
          'clip': true,
          'step': false,
          'data': sockettcpSeriesData.value,
          'label': {
            'show': true,
            'margin': 8
          },
          'logBase': 10,
          'seriesLayoutBy': 'column',
          'lineStyle': {
            'show': true,
            'width': 1,
            'opacity': 1,
            'curveness': 0,
            'type': 'solid'
          },
          'areaStyle': {
            'opacity': 0
          },
          'zlevel': 0,
          'z': 0
        },
        {
          'type': 'line',
          'name': 'Socket (UDP)',
          'connectNulls': false,
          'xAxisIndex': 0,
          'symbolSize': 4,
          'showSymbol': true,
          'smooth': false,
          'clip': true,
          'step': false,
          'data': socketudpSeriesData.value,
          'label': {
            'show': true,
            'margin': 8
          },
          'logBase': 10,
          'seriesLayoutBy': 'column',
          'lineStyle': {
            'show': true,
            'width': 1,
            'opacity': 1,
            'curveness': 0,
            'type': 'solid'
          },
          'areaStyle': {
            'opacity': 0
          },
          'zlevel': 0,
          'z': 0
        },
        {
          'type': 'line',
          'name': 'Thread',
          'connectNulls': false,
          'xAxisIndex': 0,
          'symbolSize': 4,
          'showSymbol': true,
          'smooth': false,
          'clip': true,
          'step': false,
          'data': threadSeriesData.value,
          'label': {
            'show': true,
            'margin': 8
          },
          'logBase': 10,
          'seriesLayoutBy': 'column',
          'lineStyle': {
            'show': true,
            'width': 1,
            'opacity': 1,
            'curveness': 0,
            'type': 'solid'
          },
          'areaStyle': {
            'opacity': 0
          },
          'zlevel': 0,
          'z': 0
        },
        {
          'type': 'line',
          'name': 'Crash',
          'connectNulls': false,
          'xAxisIndex': 0,
          'symbolSize': 4,
          'showSymbol': true,
          'smooth': false,
          'clip': true,
          'step': false,
          'data': crashSeriesData.value,
          'label': {
            'show': true,
            'margin': 8
          },
          'logBase': 10,
          'seriesLayoutBy': 'column',
          'lineStyle': {
            'show': true,
            'width': 1,
            'opacity': 1,
            'curveness': 0,
            'type': 'solid'
          },
          'areaStyle': {
            'opacity': 0
          },
          'zlevel': 0,
          'z': 0
        }
      ],
      'legend': [
        {
          'data': [
            'File',
            'Socket (TCP)',
            'Socket (UDP)',
            'Thread',
            'Crash'
          ],
          'selected': {
            'File': false,
            'Thread': false,
            'Crash': false
          },
          'show': true,
          'padding': 5,
          'itemGap': 10,
          'itemWidth': 25,
          'itemHeight': 14,
          'backgroundColor': 'transparent',
          'borderColor': '#ccc',
          'borderRadius': 0,
          'pageButtonItemGap': 5,
          'pageButtonPosition': 'end',
          'pageFormatter': '{current}/{total}',
          'pageIconColor': '#2f4554',
          'pageIconInactiveColor': '#aaa',
          'pageIconSize': 15,
          'animationDurationUpdate': 800,
          'selector': false,
          'selectorPosition': 'auto',
          'selectorItemGap': 7,
          'selectorButtonGap': 10,
          'left': 'right'
        }
      ],
      'tooltip': {
        'show': true,
        'trigger': 'item',
        'triggerOn': 'mousemove|click',
        'axisPointer': {
          'type': 'line'
        },
        'showContent': true,
        'alwaysShowContent': false,
        'showDelay': 0,
        'hideDelay': 100,
        'enterable': false,
        'confine': false,
        'appendToBody': false,
        'transitionDuration': 0.4,
        'textStyle': {
          'fontSize': 14
        },
        'borderWidth': 0,
        'padding': 5,
        'order': 'seriesAsc'
      },
      'xAxis': [
        {
          'show': true,
          'scale': false,
          'nameLocation': 'end',
          'nameGap': 15,
          'gridIndex': 0,
          'inverse': false,
          'offset': 0,
          'splitNumber': 5,
          'minInterval': 0,
          'splitLine': {
            'show': true,
            'lineStyle': {
              'show': true,
              'width': 1,
              'opacity': 1,
              'curveness': 0,
              'type': 'solid'
            }
          },
          'data': xData.value
        }
      ],
      'yAxis': [
        {
          'show': true,
          'scale': false,
          'nameLocation': 'end',
          'nameGap': 15,
          'gridIndex': 0,
          'inverse': false,
          'offset': 0,
          'splitNumber': 5,
          'minInterval': 0,
          'splitLine': {
            'show': true,
            'lineStyle': {
              'show': true,
              'width': 1,
              'opacity': 1,
              'curveness': 0,
              'type': 'solid'
            }
          }
        }
      ],
      'title': [
        {
          'show': true,
          'text': '资源',
          'target': 'blank',
          'subtarget': 'blank',
          'left': 'left',
          'padding': 3,
          'itemGap': 10,
          'textAlign': 'auto',
          'textVerticalAlign': 'auto',
          'triggerEvent': false,
          'textStyle': { 'fontSize': 18, 'color': '#707B7C' }
        }
      ],
      'toolbox': {
        'show': true,
        'orient': 'horizontal',
        'itemSize': 15,
        'itemGap': 10,
        'left': '80%'
      },
      'dataZoom': [
        {
          'show': true,
          'type': 'inside',
          'start': 0,
          'end': 100,
        }
      ],
      grid: {
        left: 50,
        right: 10,
        top: 50,
        bottom: 20
      }
    });
  };
  
  const initCpuChart = () => {
    const myChart = echarts.init(cpuChart.value);
    myChart.setOption({
      'animation': true,
      'animationThreshold': 2000,
      'animationDuration': 1000,
      'animationEasing': 'cubicOut',
      'animationDelay': 0,
      'animationDurationUpdate': 300,
      'animationEasingUpdate': 'cubicOut',
      'animationDelayUpdate': 0,
      'aria': {
        'enabled': false
      },
      'color': [
        '#5470c6',
        '#91cc75',
        '#fac858',
        '#ee6666',
        '#73c0de',
        '#3ba272',
        '#fc8452',
        '#9a60b4',
        '#ea7ccc'
      ],
      'series': [
        {
          'type': 'line',
          'name': 'CPU',
          'connectNulls': false,
          'xAxisIndex': 0,
          'symbolSize': 4,
          'showSymbol': true,
          'smooth': false,
          'clip': true,
          'step': false,
          'data': cpuSeriesData.value,
          'label': {
            'show': false,
            'margin': 8
          },
          'logBase': 10,
          'seriesLayoutBy': 'column',
          'lineStyle': {
            'show': true,
            'width': 1,
            'opacity': 1,
            'curveness': 0,
            'type': 'solid'
          },
          'areaStyle': {
            'opacity': 0.25
          },
          'markLine': {
            'silent': false,
            'precision': 2,
            'label': {
              'show': true,
              'margin': 8
            },
            'data': [
              {
                'name': '均线',
                'type': 'average'
              }
            ]
          },
          'zlevel': 0,
          'z': 0,
          'rippleEffect': {
            'show': true,
            'brushType': 'stroke',
            'scale': 2.5,
            'period': 4
          }
        },
        {
          'type': 'line',
          'name': 'User',
          'connectNulls': false,
          'xAxisIndex': 0,
          'symbolSize': 4,
          'showSymbol': true,
          'smooth': false,
          'clip': true,
          'step': false,
          'data': userSeriesData.value,
          'label': {
            'show': false,
            'margin': 8
          },
          'logBase': 10,
          'seriesLayoutBy': 'column',
          'lineStyle': {
            'show': true,
            'width': 1,
            'opacity': 1,
            'curveness': 0,
            'type': 'solid'
          },
          'areaStyle': {
            'opacity': 0.25
          },
          'markLine': {
            'silent': false,
            'precision': 2,
            'label': {
              'show': true,
              'margin': 8
            },
            'lineStyle': {
              'show': true,
              'width': 1,
              'opacity': 1,
              'curveness': 0,
              'type': 'solid',
              'color': '#0000FF'
            }
          },
          'zlevel': 0,
          'z': 0,
          'rippleEffect': {
            'show': true,
            'brushType': 'stroke',
            'scale': 2.5,
            'period': 4
          }
        },
        {
          'type': 'line',
          'name': 'System',
          'connectNulls': false,
          'xAxisIndex': 0,
          'symbolSize': 4,
          'showSymbol': true,
          'smooth': false,
          'clip': true,
          'step': false,
          'data': systemSeriesData.value,
          'label': {
            'show': false,
            'margin': 8
          },
          'logBase': 10,
          'seriesLayoutBy': 'column',
          'lineStyle': {
            'show': true,
            'width': 1,
            'opacity': 1,
            'curveness': 0,
            'type': 'solid'
          },
          'areaStyle': {
            'opacity': 0.25
          },
          'markLine': {
            'silent': false,
            'precision': 2,
            'label': {
              'show': true,
              'margin': 8
            },
            'lineStyle': {
              'show': true,
              'width': 1,
              'opacity': 1,
              'curveness': 0,
              'type': 'solid',
              'color': '#FF0000'
            }
          },
          'zlevel': 0,
          'z': 0,
          'rippleEffect': {
            'show': true,
            'brushType': 'stroke',
            'scale': 2.5,
            'period': 4
          }
        }
      ],
      'legend': [
        {
          'data': [
            'CPU',
            'User',
            'System'
          ],
          'selected': {},
          'show': true,
          'padding': 5,
          'itemGap': 10,
          'itemWidth': 25,
          'itemHeight': 14,
          'backgroundColor': 'transparent',
          'borderColor': '#ccc',
          'borderRadius': 0,
          'pageButtonItemGap': 5,
          'pageButtonPosition': 'end',
          'pageFormatter': '{current}/{total}',
          'pageIconColor': '#2f4554',
          'pageIconInactiveColor': '#aaa',
          'pageIconSize': 15,
          'animationDurationUpdate': 800,
          'selector': false,
          'selectorPosition': 'auto',
          'selectorItemGap': 7,
          'selectorButtonGap': 10,
          'left': 'right'
        }
      ],
      'tooltip': {
        'show': true,
        'trigger': 'item',
        'triggerOn': 'mousemove|click',
        'axisPointer': {
          'type': 'line'
        },
        'showContent': true,
        'alwaysShowContent': false,
        'showDelay': 0,
        'hideDelay': 100,
        'enterable': false,
        'confine': false,
        'appendToBody': false,
        'transitionDuration': 0.4,
        'textStyle': {
          'fontSize': 14
        },
        'borderWidth': 0,
        'padding': 5,
        'order': 'seriesAsc'
      },
      'xAxis': [
        {
          'show': true,
          'scale': false,
          'nameLocation': 'end',
          'nameGap': 15,
          'gridIndex': 0,
          'inverse': false,
          'offset': 0,
          'splitNumber': 5,
          'minInterval': 0,
          'splitLine': {
            'show': true,
            'lineStyle': {
              'show': true,
              'width': 1,
              'opacity': 1,
              'curveness': 0,
              'type': 'solid'
            }
          },
          'data': xData.value
        }
      ],
      'yAxis': [
        {
          'show': true,
          'scale': false,
          'nameLocation': 'end',
          'nameGap': 15,
          'gridIndex': 0,
          'inverse': false,
          'offset': 0,
          'splitNumber': 5,
          'minInterval': 0,
          'splitLine': {
            'show': true,
            'lineStyle': {
              'show': true,
              'width': 1,
              'opacity': 1,
              'curveness': 0,
              'type': 'solid'
            }
          }
        }
      ],
      'title': [
        {
          'show': true,
          'text': 'CPU',
          'target': 'blank',
          'subtarget': 'blank',
          'left': 'left',
          'padding': 3,
          'itemGap': 10,
          'textAlign': 'auto',
          'textVerticalAlign': 'auto',
          'triggerEvent': false,
          'textStyle': { 'fontSize': 18, 'color': '#707B7C' }
        }
      ],
      'toolbox': {
        'show': true,
        'orient': 'horizontal',
        'itemSize': 15,
        'itemGap': 10,
        'left': '80%'
      },
      'dataZoom': [
        {
          'show': true,
          'type': 'inside',
          'start': 0,
          'end': 100,
        }
      ],
      grid: {
        left: 50,
        right: 10,
        top: 50,
        bottom: 20
      }
    });
  };
  
  const webSocketConnect = () => {
    const domain = systemStoreHook().deviceDomain;
    window.location.protocol.replace("http", "ws");
    const url = `${location.protocol.replace("http", "ws")}//${location.host}/d/${domain}/ws/command`;
    ws.value = new WebSocket(url);
  
    var _memPercent = 0;
    var _cpuPercent = 0;
    var _netRcvBytes = 0;
    var _netSndBytes = 0;
    var _netSndPrev = 0;
    var _netRcvPrev = 0;
  
   
    memMon.value=new SmoothieChart({
      responsive: true,
      yMinFormatter: function (min, precision) {
        return '';
      },
      yMaxFormatter: function (min, precision) {
        return _memPercent + '% MEM';
      },
      millisPerPixel: 100,
      grid: { lineWidth: 1, millisPerLine: 500, verticalSections: 1, fillStyle: 'white', strokeStyle: '#f5f5f5' },
      tooltipLine: { lineWidth: 0.5, strokeStyle: '#bbbbbb' },
      labels: { fillStyle: 'black', fontFamily: 'Courier New', fontSize: 10 },
      maxValue: 100, minValue: 0
    });
    memMon.value.streamTo(document.getElementById('memMonitor') as HTMLCanvasElement);
  
    var memLine = new TimeSeries();
    var memBuffersLine = new TimeSeries();
    var memCachedLine = new TimeSeries();
    var memSharedLine = new TimeSeries();
  
    memMon.value.addTimeSeries(memLine, { lineWidth: 1, strokeStyle: '#3498db', fillStyle: 'rgba(52, 152, 219, 0.1)', interpolation: 'bezier' });
    memMon.value.addTimeSeries(memBuffersLine, { lineWidth: 0.5, strokeStyle: '#f1c40f', fillStyle: 'rgba(241, 196, 15, 0.01)', interpolation: 'bezier' });
    memMon.value.addTimeSeries(memCachedLine, { lineWidth: 0.5, strokeStyle: '#3a4899', fillStyle: 'rgba(58, 72, 153, 0.01)', interpolation: 'bezier' });
    memMon.value.addTimeSeries(memSharedLine, { lineWidth: 0.5, strokeStyle: '#e74c3c', fillStyle: 'rgba(231, 76, 60, 0.01)', interpolation: 'bezier' });
  
    var cpuMon = new SmoothieChart({
      responsive: true,
      yMinFormatter: function (min, precision) {
        return '';
      },
      yMaxFormatter: function (min, precision) {
        return _cpuPercent + '% CPU';
      },
      millisPerPixel: 100,
      grid: { lineWidth: 1, millisPerLine: 500, verticalSections: 1, fillStyle: 'white', strokeStyle: '#f5f5f5' },
      tooltipLine: { lineWidth: 0.5, strokeStyle: '#bbbbbb' },
      labels: { fillStyle: 'black', fontFamily: 'Courier New', fontSize: 10 },
      maxValue: 100, minValue: 0
    });
    cpuMon.streamTo(document.getElementById('cpuMonitor') as HTMLCanvasElement);
  
    var cpuLine = new TimeSeries();
    var cpuIdleLine = new TimeSeries();
    var cpuUserLine = new TimeSeries();
    var cpuSystemLine = new TimeSeries();
  
    cpuMon.addTimeSeries(cpuLine, { lineWidth: 1.2, strokeStyle: '#00ff00', fillStyle: 'rgba(0, 255, 0, 0.1)', interpolation: 'bezier' });
    cpuMon.addTimeSeries(cpuIdleLine, { lineWidth: 0.5, strokeStyle: '#979a9a', fillStyle: 'rgba(151, 154, 154, 0.01)', interpolation: 'bezier' });
    cpuMon.addTimeSeries(cpuUserLine, { lineWidth: 0.5, strokeStyle: '#f39c12', fillStyle: 'rgba(243, 156, 18, 0.01)', interpolation: 'bezier' });
    cpuMon.addTimeSeries(cpuSystemLine, { lineWidth: 0.5, strokeStyle: '#2e86c1', fillStyle: 'rgba(46, 134, 193, 0.01)', interpolation: 'bezier' });
  
    var netMon = new SmoothieChart({
      responsive: true,
      yMinFormatter: function (min, precision) {
        return util.bytesTokmgbString(_netRcvBytes) + '/s ⇣';
      },
      yMaxFormatter: function (min, precision) {
        return util.bytesTokmgbString(_netSndBytes) + '/s ⇡';
      },
      millisPerPixel: 100,
      grid: { lineWidth: 1, millisPerLine: 500, verticalSections: 2, fillStyle: 'white', strokeStyle: '#f5f5f5' },
      tooltipLine: { lineWidth: 0.5, strokeStyle: '#bbbbbb' },
      labels: { fillStyle: 'black', fontFamily: 'Courier New', fontSize: 10 },
      minValue: 0
    });
    netMon.streamTo(document.getElementById('netMonitor') as HTMLCanvasElement);
  
    var netLineRecv = new TimeSeries();
    var netLineSend = new TimeSeries();
  
    netMon.addTimeSeries(netLineRecv, { lineWidth: 1.2, strokeStyle: '#70bf56', fillStyle: 'rgba(112, 191, 86, 0.01)', interpolation: 'bezier' });
    netMon.addTimeSeries(netLineSend, { lineWidth: 0.8, strokeStyle: '#cb4d1c', fillStyle: 'rgba(203, 77, 28, 0.1)', interpolation: 'bezier' });
  
    ws.value.onopen = function (evt) {
      console.log('Connection open ...');
      timerId = setInterval(() => {
        if (ws.value.readyState === WebSocket.OPEN) {
          ws.value.send("STAT");
        }
      }, 1000);
    };
  
    ws.value.onmessage = function (evt) {
      // console.log('Received Message: ',JSON.parse(evt.data));
      if (evt && evt.data) {
        const { data, timestamp } = JSON.parse(evt.data);
        const statusTimeData = {
          time: timestamp*1000,//后端返回秒数
          ...data
        }
  
        _memPercent = statusTimeData.mem_percent;
        memLine.append(statusTimeData.time, _memPercent);
        memBuffersLine.append(statusTimeData.time, statusTimeData.mem_buffers);
        memCachedLine.append(statusTimeData.time, statusTimeData.mem_cached);
        memSharedLine.append(statusTimeData.time, statusTimeData.mem_shared);
  
        _cpuPercent = statusTimeData.cpu_percent;
        cpuLine.append(statusTimeData.time, _cpuPercent);
        cpuUserLine.append(statusTimeData.time, statusTimeData.cpu_times_user);
        cpuSystemLine.append(statusTimeData.time, statusTimeData.cpu_times_system);

        _netSndBytes = (_netSndPrev?(statusTimeData.net_io_bytes_sent-_netSndPrev):0);
        _netRcvBytes = (_netRcvPrev?(statusTimeData.net_io_bytes_recv-_netRcvPrev):0);

        _netRcvPrev = statusTimeData.net_io_bytes_recv;
        _netSndPrev = statusTimeData.net_io_bytes_sent;

        netLineSend.append(statusTimeData.time, _netRcvBytes);
        netLineRecv.append(statusTimeData.time, _netSndBytes);
      }
    };
  
    ws.value.onclose = function (evt) {
      console.log('Connection closed.');
      clearInterval(timerId)
    };
  
    if (props.activeKey === '1') {
      ws.value && ws.value.close();
    }
  };

  onMounted(() => {
    getDeviceInfo();
    getDeviceUser();
    getAllUser();
    getDeviceStatus();
    webSocketConnect();
  });
  
  onUnmounted(() => {
    ws.value && ws.value.close();
    if (cpuMonitorRef.value) {
      cpuMonitorRef.value.width = cpuMonitorRef.value.width;
      }
    memMon.value=""
  })
  </script>
  <style lang="less" scoped>
  .detail-content {
    width: 100%;
    height: calc(100vh - (58px + 32px));;
    overflow: hidden;
    display: flex;
    // overflow: auto;
    padding-bottom: 10px;
    .device-info {
      width: 300px;
      // height: fit-content;
      min-height: 100%;
      background-color: #F8F9F9;
      border-right: 1px solid #e5e7eb;
      padding: 0 12px 0 12px;
      display: flex;
      flex-direction: column;
      .info {
        .title {
          padding-top: 0px;
          font-weight: 500;
          font-size: 14px;
          margin-bottom: 10px;
          color: #212F3C;
        }
      }
      .info-item {
        display: flex;
        line-height: 16px;
        margin-bottom: 8px;
        font-size: 0.85rem;
        color: rgb(107 114 128 / 1);
        overflow: hidden;
        .name {
          font-weight: 350;
          text-align: left;
          font-size: 0.82rem;
          width: 110px;
        }
        .value {
          font-weight: normal;
          flex: 1;
          text-align: right;
          white-space: nowrap;
          word-break: break-all;
        }
      }
      .title {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 14px;
        font-weight: 500;
        margin-bottom: 20px;
        color: #212F3C;
        margin-top: 20px;
      }
      .add-btn {
        cursor: pointer;
      }
      .owner-list {
        overflow-y: auto;
        flex: 1;
      }

      .owner-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        overflow: hidden;
        //padding: 0 5px;
        margin-bottom: 10px;
      }
      .owner-info {
        display: flex;
        align-items: center;
        flex: 1;
        margin-right: 10px;
        overflow: hidden;
        .avatar {
          width: 40px;
          height: 40px;
          background: #ffffff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 10px;
        }
        .name-outer {
          flex: 1;
          overflow: hidden;
        }
        .name {
          font-size: 14px;
          line-height: 20px;
          font-weight: 500;
          color: rgb(107 114 128 / 1);
        }
        .contact {
          font-size: 0.85rem;
          line-height: 20px;
          font-weight: normal;
          color: rgb(107 114 128 / 1);
        }
      }
      ::-webkit-scrollbar {
        width: 2px;
      }
      ::-webkit-scrollbar-track {
        border-radius: 0px;
      }
      ::-webkit-scrollbar-thumb {
        background: grey;
      }
      .remove-btn {
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        &:hover {
          background-color: rgb(254 226 226 / 1);
        }
      }
    }
    .device-charts {
      flex: 1;
      padding: 0px;
      display: grid;
      height: 100%;
      grid-template-rows:repeat(2,1fr);
      grid-template-columns: repeat(2, 1fr);
      row-gap: 0px;
      /* 设置网格行间隙 */
      column-gap: 0px;
      /* 设置网格列间隙 */
      .chart-container {
        border: 1px solid #e5e7eb;
        padding: 10px 10px;
      }
      .chart-title {
        font-weight: 600;
        color: #000000;
        font-size: 18px;
        line-height: 18px;
        margin-bottom: 25px;
      }
      .chart {
        width: 100%;
        height: 100%;
      }
      .status-chart {
        width: 100%;
        height: calc(100% - 40px);
      }
      .chart-top {
        display: flex;
        justify-content: space-between;
        padding: 0 .8rem 0 .8rem;
        canvas {
          max-width: 50%;
        }
      }
      .chart-bottom {
        display: flex;
        justify-content: center;
        padding: 0 .8rem 0 .8rem;
        canvas {
          max-width: 100%;
        }
      }
    }
  }

  .detail-buttons {
    display: flex;
  }

  .detail-buttons-item {
    margin: 0 0 0 12px;
  }

  @media screen and (max-width: 1024px) {
    .detail-content {
      display: block !important;
    }
    .device-info,
    .device-charts {
      width: 100% !important;
    }
  }

  .radio-group-container {
    max-height: 200px;
    overflow-y: auto;
    border: 1px solid #f0f0f0;
  }

  .radio-group {
    width: 100%;
  }

  .radio-item {
    display: flex;
    align-items: center;
    padding: 10px;
    border-bottom: 1px solid #d9d9d9;
    width: 100%;
    box-sizing: border-box;
  }

  .radio-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
  }

  .group-icon {
    margin-right: 10px;
  }

  .group-name {
    font-weight: bold;
    max-width: 8rem;
    min-width: 8rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    text-align: left;
  }

  .group-contact {
    color: #888;
    font-size: 12px;
    white-space: nowrap;
    padding-left: 1.5rem;
    max-width: 16rem;
    min-width: 16rem;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: right;
  }

  .group-left {
    display: flex;
    align-items: center;
    flex-grow: 1;
  }
  </style>
