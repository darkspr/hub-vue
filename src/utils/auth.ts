const getToken = () => {
    return localStorage.getItem('token')
}

const setToken = (token: any) => {
    return localStorage.setItem('token', token)
}

const removeToken = () => {
    return localStorage.removeItem('token')
}

const getGroup = () => {
    const group: any = localStorage.getItem('group') || ''
    return JSON.parse(group)
}

const setGroup = (group: any) => {
    return localStorage.setItem('group', JSON.stringify(group))
}

const removeGroup = () => {
    return localStorage.removeItem('group')
}

export default {
    getToken,
    setToken,
    removeToken,
    getGroup,
    setGroup,
    removeGroup
}