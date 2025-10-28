import axios from './axios';

/**
 * 获取表格
 */
export function getList(params: any){
    return axios.get('/v1/device', params);
}

/**
 * 修改备注
 */
export function changeComment(domain: string, comment: string){
    return axios.putForm(`/v1/device/${domain}/comment`, {
        comment: comment
    })
}

/**
 * 删除设备记录
 * @param domain 
 * @returns 
 */
export function deleteRecord(domain: string){
    return axios.delete(`/v1/device/${domain}`)
}

/**
 * 新设备插槽记录
 * @param data 
 * @returns 
 */
export function addRecord(ip: string){
    return axios.postForm('/v1/device', {
        ip: ip
    })
}