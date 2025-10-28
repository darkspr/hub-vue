import axios from 'axios'
import type { AxiosInstance } from 'axios'
import Cookies from 'js-cookie'

var instance: AxiosInstance;

const translate = {
    "E40000": "非法请求",
    "E40001": "组名称或密码不正确",
    "E40002": "组已拥有该设备",
    "E40003": "组已经存在",
    "E40004": "无法对此组进行操作",
    "E40005": "目标组不能是管理员",
    "E40006": "插槽已被绑定到另一个实例",
    "E40007": "冲突的网络地址",
    "E40008": "插槽的网络地址尚未配置",
    "E40009": "已达最大插槽数限制",
    "E40010": "网络尚未配置",
    "E40011": "非法的网络地址",
    "E40012": "已达插槽最大配置数限制",
    "E40013": "无法对附加设备的插槽进行配置",
    "E40014": "值不能包含空格",
    "E40015": "网络已配置",
    "E40016": "非法的网络或者网段太小",
    "E40017": "非法的组名",
    "E40101": "未授权的组",
    "E40102": "不是平台的管理员组",
    "E40103": "不是设备的所有者",
    "E40105": "只有管理员或者本人可以操作",
    "E40401": "组不存在",
    "E40402": "设备不存在",
    "E40403": "没有这个授权令牌",
    "E40404": "没有这个插槽令牌",
    "E40405": "没有这个语言的翻译文件",
    "E50000": "服务器内部错误",
    "E41000": "无法连接此设备"
};

function createInstance(baseUrl: string) {
    //创建一个axios对象
    let instance = axios.create({
        baseURL: baseUrl,
        timeout: 300000,
        //表示跨域请求时是否需要使用凭证
        withCredentials: false, // default
        //表示服务器响应的数据类型，可以是 'arraybuffer', 'blob', 'document', 'json', 'text', 'stream'
        responseType: 'json', // default
        //响应编码
        //Note: Ignored for `responseType` of 'stream' or client-side requests
        responseEncoding: 'utf8', // default
        //xsrf token 的值的cookie的名称
        xsrfCookieName: 'XSRF-TOKEN', // default
        //the name of the http header that carries the xsrf token value
        xsrfHeaderName: 'X-XSRF-TOKEN', // default
        validateStatus: function (status) {
            return true;
        },
        // `onUploadProgress` 允许为上传处理进度事件
        onUploadProgress: (progressEvent) => {
            // Do whatever you want with the native progress event
        },
        // `onDownloadProgress` 允许为下载处理进度事件
        onDownloadProgress: (progressEvent) => {
            // 对原生进度事件的处理
        },
    })

    //请求拦截
    //所有的网络请求都会先走这个方法
    instance.interceptors.request.use(
        function (config: any) {
            if (config && config.headers && Cookies.get("Authorization") != null) {
                config.headers["Authorization"] = Cookies.get("Authorization");
            }
            return config;
        },
        function (err) {
            return Promise.reject(err);
        }
    )

    //响应拦截
    //所有的网络请求返回数据之后都会先执行此方法
    //可以根据服务器的返回状态码做相应的处理
    instance.interceptors.response.use(
        function (response) {
            if (response.data.status != 0 || response.data.status != 200) {
                response.data.message = translate[response.data.error] || response.data.message;
                //TODO
            }
            return response;
        },
        function (err) {
            return Promise.reject(err);
        }
    )

    return instance;
}

export default {

    createInstance,

    /**
     * 获取实例对象
     * @returns 
     */
    getInstance() {
        return instance;
    },

    /**
     * 切换后端请求路径
     * @param {*} backServerBaseUrl 
     */
    switchServer(backServerBaseUrl: string) {
        instance = createInstance(backServerBaseUrl);
    },

    // /**
    //  * 一般Get请求
    //  * @param {*} url 请求路径
    //  * @param {*} params 请求参数
    //  * @returns 
    //  */
    // get(url: string,params: Object|undefined = undefined){
    //     return instance.get(url,{
    //         params:params
    //     });
    // },
    /**
     * 一般Get请求
     * @param {*} url 请求路径
     * @param {*} params 请求参数，默认为空对象
     * @returns 
     */
    get(url: string, params: Object = {}) {
        return instance.get(url, {
            params: params
        });
    },

    /**
     * 带进度事件的Get请求
     * @param {*} url 请求路径
     * @param {*} params 请求参数
     * @param {*} uploadCallBack 上传事件
     * @param {*} downloadCallBack 下载事件
     * @returns 
     */
    getProgress(url: string, params: Object, uploadCallBack: Function, downloadCallBack: Function) {
        return instance.get(url, {
            params: params,
            onUploadProgress: function (progressEvent) {
                if (uploadCallBack != null && uploadCallBack != undefined) {
                    uploadCallBack(progressEvent);
                }
                // Do whatever you want with the native progress event
            },
            onDownloadProgress: function (progressEvent) {
                // 对原生进度事件的处理
                if (downloadCallBack != null && downloadCallBack != undefined) {
                    downloadCallBack(progressEvent)
                }
            }
        });
    },

    /**
     * 一般Post请求
     * @param {*} url 请求路径
     * @param {*} params 请求参数
     * @returns 
     */
    post(url: string, data: Object | undefined = undefined) {
        return instance.post(url, data, {
            headers: {
                'Content-Type': 'application/json;charset=UTF-8'
            }
        });
    },

    /**
     * 带进度事件的Post请求
     * @param {*} url 请求路径
     * @param {*} params 请求参数
     * @param {*} uploadCallBack 上传事件
     * @param {*} downloadCallBack 下载事件
     * @returns 
     */
    postProgress(url: string, data: Object, uploadCallBack: Function, downloadCallBack: Function) {
        return instance.post(url, data, {
            headers: {
                'Content-Type': 'application/json;charset=UTF-8'
            },
            onUploadProgress: function (progressEvent) {
                if (uploadCallBack != null && uploadCallBack != undefined) {
                    uploadCallBack(progressEvent);
                }
                // Do whatever you want with the native progress event
            },
            onDownloadProgress: function (progressEvent) {
                // 对原生进度事件的处理
                if (downloadCallBack != null && downloadCallBack != undefined) {
                    downloadCallBack(progressEvent)
                }
            },
        });
    },

    /**
     * 提交表格的Post请求
     * @param {*} url 请求路径
     * @param data
     * @returns
     */
    postForm(url: string, data: { [propName: string]: any }) {
        let param = new FormData();
        for (let key in data) {
            param.append(key, data[key]);
        }
        return instance.post(url, param, {
            headers: {
                'Content-Type': 'multipart/form-data',
                'Prefix': instance.defaults.baseURL
            }
        });
    },

    /**
     * 带进度事件提交表格的Post请求
     * @param {*} url 请求路径
     * @param {*} params 请求参数
     * @param {*} uploadCallBack 上传事件
     * @param {*} downloadCallBack 下载事件
     * @returns 
     */
    postFormProgress(url: string, data: { [propName: string]: any }, uploadCallBack: Function, downloadCallBack: Function) {
        let formData = new FormData();
        for (let key in data) {
            formData.append(key, data[key]);
        }
        return instance.post(url, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            onUploadProgress: function (progressEvent) {
                if (uploadCallBack != null && uploadCallBack != undefined) {
                    uploadCallBack(progressEvent);
                }
                // Do whatever you want with the native progress event
            },
            onDownloadProgress: function (progressEvent) {
                // 对原生进度事件的处理
                if (downloadCallBack != null && downloadCallBack != undefined) {
                    downloadCallBack(progressEvent)
                }
            }
        });
    },

    /**
     * 提交多文件表单的Post请求
     * @param {*} url 请求路径
     * @param {*} params 请求参数
     * @returns 
     */
    postFilesForm(url: string, data: { [propName: string]: any }, files: Array<File>) {
        let formData = new FormData();
        files.forEach((file) => {
            formData.append("file", file);
        });
        for (let key in data) {
            formData.append(key, data[key]);
        }
        return instance.post(url, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },

    /**
     * x-www-form-urlencoded的Post请求
     * @param {*} url 请求路径
     * @param {*} params 请求参数
     * @returns 
     */
    postFormUrlEncoded(url: string, data: { [propName: string]: any }) {
        let params = new URLSearchParams();
        for (let key in data) {
            params.append(key, data[key]);
        }
        return instance.post(url, params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
    },

    /**
     * 一般Put请求
     * @param {*} url 请求路径
     * @param {*} data 请求参数，默认为空对象
     * @returns 
     */
    put(url: string, data: Object = {}) {
        return instance.put(url, data, {
            headers: {
                'Content-Type': 'application/json;charset=UTF-8'
            }
        });
    },

    /**
 * 提交表格的PUT请求
 * @param {*} url 请求路径
 * @param data 表单数据对象
 * @returns Promise，包含请求响应
 */
    putForm(url: string, data: { [propName: string]: any }) {
        let param = new FormData();
        for (let key in data) {
            param.append(key, data[key]);
        }
        return instance.put(url, param, {
            headers: {
                // 注意：某些服务器可能需要移除'Content-Type'或设置为'undefined'，
                // 以允许浏览器自动设置正确的boundary值，这对于multipart/form-data是必需的。
                'Content-Type': 'multipart/form-data',
                'Prefix': instance.defaults.baseURL
            }
        });
    },

    /**
    * 一般Delete请求
    * @param {} url 请求路径
    * @param {} params 请求参数，默认为空对象
    * @returns
    */
    delete(url: string, params: Object = {}) {
        return instance.delete(url, {
            params: params,
            headers: {
                'Content-Type': 'application/json;charset=UTF-8'
            }
        });
    },


    /**
     * 获取文件blob
     * @param {*} url 
     * @param {*} params 
     * @returns 
     */
    async getBlob(url: string, params: Object | undefined = undefined) {
        let blob;
        await instance.get(url, {
            headers: {
                'Cache-Control': 'no-cache'
            },
            responseType: 'blob',
            params: params
        }).then((res: any) => {
            blob = new Blob([res], { type: res.type });
        });
        return blob;
    },

    /**
     * 获取文件
     * @param {*} url 
     * @param {*} params 
     * @returns 
     */
    async getFile(fileName: string, url: string, params: Object | undefined = undefined) {
        let file;
        await instance.get(url, {
            headers: {
                'Cache-Control': 'no-cache'
            },
            responseType: 'blob',
            params: params,
        }).then((res: any) => {
            let blob = new Blob([res], { type: res.type });
            file = new File([blob], fileName, { type: res.type });
        });
        return file;
    },

    /**
     * 获取文件
     * @param {*} url 
     * @param {*} params 
     * @returns 
     */
    async getFileProgress(fileName: string, url: string, params: Object | undefined = undefined, uploadCallBack: Function, downloadCallBack: Function) {
        let file;
        await instance.get(url, {
            headers: {
                'Cache-Control': 'no-cache'
            },
            responseType: 'blob',
            params: params,
            onUploadProgress: function (progressEvent) {
                if (uploadCallBack != null && uploadCallBack != undefined) {
                    uploadCallBack(progressEvent);
                }
                // Do whatever you want with the native progress event
            },
            onDownloadProgress: function (progressEvent) {
                // 对原生进度事件的处理
                if (downloadCallBack != null && downloadCallBack != undefined) {
                    downloadCallBack(progressEvent)
                }
            }
        }).then((res: any) => {
            let blob = new Blob([res], { type: res.type });
            file = new File([blob], fileName, { type: res.type });
        });
        return file;
    },

    /**
     * 下载文件
     * @param {*} url 文件URL
     */
    download(fileName: string, url: string, params: Object | undefined = undefined) {
        instance.get(url, {
            headers: {
                'Cache-Control': 'no-cache'
            },
            responseType: 'blob',
            params: params
        }).then((res: any) => {
            let blob = new Blob([res], { type: res.type });
            let downloadElement = document.createElement('a');
            let href = window.URL.createObjectURL(blob); //创建下载的链接
            downloadElement.href = href;
            downloadElement.download = fileName; //下载后文件名
            document.body.appendChild(downloadElement);
            downloadElement.click(); //点击下载
            document.body.removeChild(downloadElement); //下载完成移除元素
            window.URL.revokeObjectURL(href); //释放blob对象
        });
    },

    /**
     * 下载文件
     * @param {*} url 文件URL
     */
    postDownload(fileName: string, url: string, data: Object | undefined = undefined) {
        return instance.post(url, data, {
            headers: {
                'Content-Type': 'application/json;charset=UTF-8'
            },
            responseType: 'blob'
        }).then((res: any) => {
            let blob = new Blob([res], { type: res.type });
            let downloadElement = document.createElement('a');
            let href = window.URL.createObjectURL(blob); //创建下载的链接
            downloadElement.href = href;
            downloadElement.download = fileName; //下载后文件名
            document.body.appendChild(downloadElement);
            downloadElement.click(); //点击下载
            document.body.removeChild(downloadElement); //下载完成移除元素
            window.URL.revokeObjectURL(href); //释放blob对象
        });
    },

    /**
     * 获取文件blob
     * @param {*} url 
     * @param {*} params 
     * @returns 
     */
    async postBlob(url: string, data: Object | undefined = undefined) {
        let blob;
        await instance.post(url, data, {
            headers: {
                'Content-Type': 'application/json;charset=UTF-8',
                'Cache-Control': 'no-cache'
            },
            responseType: 'blob'
        }).then((res: any) => {
            blob = new Blob([res], { type: res.type });
        });
        return blob;
    },

    /**
     * 获取文件
     * @param {*} url 
     * @param {*} params 
     * @returns 
     */
    async postFile(fileName: string, url: string, data: Object | undefined = undefined) {
        let file;
        await instance.post(url, data, {
            headers: {
                'Content-Type': 'application/json;charset=UTF-8',
                'Cache-Control': 'no-cache'
            },
            responseType: 'blob',
        }).then((res: any) => {
            let blob = new Blob([res], { type: res.type });
            file = new File([blob], fileName, { type: res.type });
        });
        return file;
    }

}