import axios from './axios';

/**
 * 登录
 * @param name 
 * @param password 
 * @returns 
 */
export function login(name: string, password: string){
    return axios.postForm('/v1/group/login', {
        name: name,
        password: password
    });
}
