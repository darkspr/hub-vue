import { values } from "lodash-es";

/**
 * 时间戳转换为"YYYY-MM-DD HH:mm:ss"
 * @param timestamp 时间戳
 * @returns 
 */
const timestampToDate = (timestamp: any) => {
    const date = new Date(timestamp * 1000); // 注意：JavaScript时间戳是以毫秒为单位的，因此需要乘以1000
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // getMonth()返回的月份是从0开始的，所以需要+1
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

const  bytesTokmgbString = (value: any, split: any = "") => {
    if (value == null || value === '' || value === 0) {
      return '0B';
    }
    var unitArr = ['B', 'KB', 'MB', 'GB', 'TB'];
    var index = 0;
    var srcsize = parseFloat(value);
    index = Math.floor(Math.log(srcsize) / Math.log(1024));
    var size = (srcsize / Math.pow(1024, index)).toFixed(2);
    return size + split + unitArr[index];
}

const bytesToMB = (value: any) => {
    if (!value) {
      return 0;
    }
    return (value/1024/1024);
}

const getSdkInfo = (value: any) => {
  const version = "" + value;
  const codes = {
    "23": {
            "version": "6",
            "code": "M",
            "codename": "Marshmallow"
    },
    "24": {
            "version": "7",
            "code": "N",
            "codename": "Nougat"
    },
    "25": {
            "version": "7.1",
            "code": "N_MR1",
            "codename": "Nougat"
    },
    "26": {
            "version": "8",
            "code": "O",
            "codename": "Oreo"
    },
    "27": {
            "version": "8.1",
            "code": "O_MR1",
            "codename": "Oreo"
    },
    "28": {
            "version": "9",
            "code": "P",
            "codename": "Pie"
    },
    "29": {
            "version": "10",
            "code": "Q",
            "codename": "Quince Tart"
    },
    "30": {
            "version": "11",
            "code": "R",
            "codename": "Red Velvet Cake"
    },
    "31": {
            "version": "12",
            "code": "S",
            "codename": "Snow Cone"
    },
    "32": {
            "version": "12L",
            "code": "S_V2",
            "codename": "Snow Cone"
    },
    "33": {
            "version": "13",
            "code": "TIRAMISU",
            "codename": "Tiramisu"
    },
    "34": {
            "version": "14",
            "code": "UPSIDE_DOWN_CAKE",
            "codename": "Upside Down Cake"
    }
  };
  return codes[version];
}

const sdkToVersion = (value: any) => {
  const info = getSdkInfo(value);
  return info?(info["version"] + " (" + info["code"] + ")"):"SDK " + value;
}

export default {
    sdkToVersion,
    timestampToDate,
    bytesTokmgbString,
    bytesToMB
}