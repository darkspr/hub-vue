import axios from './axios';

export function getList(params: any){
    return axios.get('/v1/group', params);
}

export function deleteRecord(id: number){
    return axios.delete(`/v1/group/${id}`)
}

export function addRecord(form: any){
    return axios.postForm('/v1/group', {
        name: form.name,
        password: form.password,
        contact: form.contact,
    })
}

export function changePsw(uid: number, password: string){
    return axios.putForm(`/v1/group/${uid}/credentials`, {
        password: password
    });
}
