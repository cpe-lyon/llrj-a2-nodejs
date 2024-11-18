const ADMIN_KEY = 'ADMIN_KEY';

/**
 *
 * @param app
 * @param {{[roomId:string]:{users:string[]}}} rooms
 * @param {{send:(msg:{ roomId: string, content: string, user: string, timestamp: number }) => void}} msgSender
 */
function registerRoomHttpApi(app, rooms, msgSender){
    // Route for creating a room
    app.post('/createRoom', (req, res) => {
        const adminKey = req.headers['x-adminkey'];
        if (adminKey !== ADMIN_KEY) {
            return res.status(403).send('Unauthorized');
        }

        const { users } = req.body;
        const roomId = `room_${Date.now()}`;
        rooms[roomId] = { users };

        res.status(200).json({ roomId });
    });

    // Route for gettings all users in a room
    app.get('/getUsers/:roomId', (req, res) => {
        const roomId = req.params.roomId;
        const userLogin = req.headers['x-login'];

        if (!rooms[roomId]) {
            return res.status(404).send('Room not found');
        }
        if (!rooms[roomId].users.includes(userLogin)) {
            return res.status(403).send('Unauthorized');
        }

        res.status(200).json(rooms[roomId].users);
    });

    // Route for sending a message in a room
    app.post('/send/:roomId', (req, res) => {
        const roomId = req.params.roomId;
        const { content, user } = req.body;
        const adminKey = req.headers['x-adminkey'];

        if (!rooms[roomId]) {
            return res.status(404).send('Room not found');
        }
        if (adminKey !== ADMIN_KEY) {
            return res.status(403).send('Unauthorized');
        }

        const message = { roomId, content, user, timestamp: new Date().getTime() };
        msgSender.send(message)

        res.status(200).json({ roomId });
    });
}

module.exports = {
    registerRoomHttpApi
}