import { ADMIN_KEY, GATEWAY_HOST } from '../../commons/config'
const axios = require('axios')

export const sendMessage = async (roomId, content) => {
    const res =await axios.post(`http://${GATEWAY_HOST}/chat/send/`+roomId, {content}, {
        headers: {
            'x-adminkey': ADMIN_KEY
        }
    });
    if (res.error) throw new Error("Error in chat response");
}


export const getUsers = async (roomId) => {
    const {data, error} = await axios.get(`http://${GATEWAY_HOST}/chat/getUsers/`+roomId);
    if (error) throw new Error("Error in chat response");
    return data;
}

