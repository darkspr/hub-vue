import axios from './axios';

/**
 * 获取设备详情
 */
export function deviceInfoApi(domain: string){
    return axios.get(`/v1/device/${domain}`);
}

/**
 * 获取系统内组
 */
export function allGroupListApi(params: any){
    return axios.get(`/v1/group?page=${params.page}&size=${params.size}`);
}

/**
 * 获取该设备插槽被分配的组
 */
export function deviceGroupListApi(params: any){
    return axios.get(`/v1/device/${params.domain}/alloc?page=${params.page}&size=${params.size}`);
}

/**
 * 将设备（插槽）分配给某个组
 */
export function deviceGroupAddApi(domain: string, id: string){
    return axios.post(`/v1/device/${domain}/alloc?id=${id}`);
}

/**
 * 取消将设备（插槽）分配给某个组
 */
export function deviceGroupRemoveApi(domain: string, id: string){
    return axios.delete(`/v1/device/${domain}/alloc?id=${id}`);
}

/**
 * 获取设备状态（3天）
 */
export function deviceStatusApi(domain: string){
    return axios.get(`/v1/device/${domain}/status?limit=2280`);
}