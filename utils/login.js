const jwt = require('jsonwebtoken');

const SECRET_KEY="CHAT_KEY_SEC"

/**
 *
 * @param app
 * @param {{[roomId:string]:{users:string[]}}} rooms
 * @param {{send:(msg:{ roomId: string, content: string, user: string, timestamp: number }) => void}} msgSender
 */
function registerTokenHttpApi(app){
    // Route for creating a room
    app.get('/wsauth', (req, res) => {
        const login = req.headers['x-login'];
        if (!login) {
            return res.status(400).send('X-login header is required');
        }

        const token = jwt.sign({ login }, SECRET_KEY, { expiresIn: '5m' });
        res.json({ token });
    });
}

function registerTokenMiddleware(io) {
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            console.log("Refused connection: to token")
            return next(new Error('Authentication error'));
        }

        jwt.verify(token, SECRET_KEY, (err, decoded) => {
            if (err) {
                return next(new Error('Authentication error'));
            }

            socket.login = decoded.login;
            next();
        });
    });
}

module.exports = {
    registerTokenHttpApi,
    registerTokenMiddleware
}