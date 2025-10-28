
import axios from './axios';

/**
 * 获取设备信息
 * @returns 
 */
export function getInfo(){
    return axios.get('/v1/info');
}

/**
 * 获取所有设备的物理分布信息（需要登录）
 * @returns 
 */
export function getWorldData(){
    return axios.get('/v1/device/distribute')
}