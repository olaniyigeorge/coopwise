import axios from 'axios'
import config from '../config'



const API = axios.create({
    baseURL: config.publicAppUrl || "http://localhost:3000",
    timeout: 10000,
    headers: {
        'Content-Type': "application/json"
    },
    withCredentials: false
})

export default API