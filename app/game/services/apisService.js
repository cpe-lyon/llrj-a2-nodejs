const { ADMIN_KEY, GATEWAY_HOST } = require('../../commons/config');
const axios = require('axios')
const Player = require("../models/player")

const sendMessage = async (roomId, content) => {
    const res =await axios.post(`http://${GATEWAY_HOST}/internal/chat/send/`+roomId, {content}, {
        headers: {
            'x-adminkey': ADMIN_KEY
        }
    });
    if (res.error) throw new Error("Error in chat response");
}


const getUsers = async (roomId) => {
    const {data, error} = await axios.get(`http://${GATEWAY_HOST}/internal/chat/getUsers/`+roomId).catch(e => ({data:null, error: e}));
    console.log("RESPONSE from chat ", {data,error});
    if (error) throw new Error("Error in chat response");
    return data;
}

/**
 * @param {Player} player
 * @return Promise<{id:number}[]>
 */
const getCards = async (player) => {
    console.log("Asking cards of "+ player.id)
    const {data, error} = await axios.get(`http://${GATEWAY_HOST}/cards/user/`+player.id).catch(e => ({data:null, error: e}));
    if (error) throw new Error("Error in api response");
    return data;
}

module.exports = { sendMessage, getUsers, getCards};