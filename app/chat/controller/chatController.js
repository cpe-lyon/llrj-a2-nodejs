require { ADMIN_KEY } from "../../commons/config";


class chatController {
    constructor({}) {
        console.log("new chatController");
    }
    
    /**
     *
     * @param app
     * @param {{[roomId:string]:{users:Set<string>}}} rooms
     * @param {{send:(msg:{ roomId: string, content: string, user: string, timestamp: number }) => void}} msgSender
     */
    registerRoomHttpApi(app, rooms, msgSender){
    
        app.post('/createRoom/:user', (req, res) => {
            const user = req.params.user;
            const userLogin = req.headers['x-login'];
            console.log("TRY room creation for ", userLogin);
            if ( !userLogin || userLogin === user) {
                return res.status(401).send('Room creation Forbidden');
            }
    
            const users = new Set([ user, userLogin ]);
            const roomId = `room_${Date.now()}`;
            rooms[roomId] = { users };
            msgSender.send({
                roomId: '0',
                content: `private-room;${roomId};${user}`,
                timestamp: new Date().getTime()
            });
    
            res.status(200).json({ roomId });
        });
    
        // Route for gettings all users in a room
        app.get('/getUsers/:roomId', (req, res) => {
            const roomId = req.params.roomId;
            res.status(200).json([...rooms[roomId].users]);
        });
    
        // Route for sending a message in a room
        app.post('/send/:roomId', (req, res) => {
            const roomId = req.params.roomId;
            const { content } = req.body;
            const adminKey = req.headers['x-adminkey'];
    
            if (!rooms[roomId]) {
                return res.status(404).send('Room not found');
            }
            if (adminKey !== ADMIN_KEY) {
                return res.status(403).send('Unauthorized');
            }
    
            const message = { roomId, content, timestamp: new Date().getTime() };
            msgSender.send(message)
    
            res.status(200).json({ roomId });
        });
    }
}

export default new chatController({})