const Player = require('../models/player');
const Card = require('../models/card');
const router = express.Router();
const ADMIN_KEY = 'ADMIN_KEY';

function sendMessage(roomId, msgSender) {
    // VERIF L'URL
    router.post('/sendMessage', (req, res) => {
        const { content, user } = req.body;
        const adminKey = req.headers['x-adminkey'];

        // if (!rooms[roomId]) {
        //     return res.status(404).send('Room not found');
        // }
        if (adminKey !== ADMIN_KEY) {
            return res.status(403).send('Unauthorized');
        }

        const message = { roomId, content, user, timestamp: new Date().getTime() };
        msgSender.send(message)

        res.status(200).json({ roomId });
    });
}

function startGame(roomid,players) {
    players.forEach(player => {
        player.resetActionPoints();
    });
    players[0].isTurn = true;
    sendMessage(roomid,`Debut de la partie, ${players[0]} qui commence`,"gameMaster")
}

function playCard(roomid, attacker, defender, cardId) {
    const cardA = attacker.cards.find(c => c.id === cardId);
    if (!card) {
        sendMessage(roomid,"Carte non trouvée dans les cartes de l'attaquant.","gameMaster");
        throw new Error("Carte non trouvée dans les cartes de l'attaquant.");
    }
    if (attacker.actionPoints < card.attack) {
        sendMessage(roomid,"Pas assez de points d'action pour jouer cette carte.","gameMaster");
        throw new Error("Pas assez de points d'action pour jouer cette carte.");
    }

    const cardD = defender.cards.find(c => c.id === cardId);
    if (!cardD) {
        sendMessage(roomid,"Carte non trouvée dans les cartes du defenseur.","gameMaster");
        throw new Error("Carte non trouvée dans les cartes du defenseur.");
    }

    attacker.actionPoints -= cardA.attack;

    let damage = cardA.attack - cardD.health;

    const critChance = Math.random();
    const dodgeChance = Math.random();

    if (critChance < 0.1) {
        damage *= 2;
        sendMessage(roomid,"Coup critique !","gameMaster");
        console.log("Coup critique !");
    }

    if (dodgeChance < 0.1) {
        damage = 0;
        sendMessage(roomid,"Esquive réussie !","gameMaster");
        console.log("Esquive réussie !");
    }

    cardD.health -= damage;
    if (card.health <=0){
        sendMessage(roomid,`Dégâts infligés : ${damage}, carte tué : ${card.id}`,"gameMaster");
        console.log(`Dégâts infligés : ${damage}, carte tué : ${card.id}`);
        checkGameOver(defender);
    }else {
        sendMessage(roomid,`Dégâts infligés : ${damage}, vie restante : ${card.health}`,"gameMaster");
        console.log(`Dégâts infligés : ${damage}, vie restante : ${card.health}`);
        checkEndTurn(attacker,defender)
    }
    return damage;
}

function endTurn(roomid, player1, player2) {
    player1.isTurn=false;
    player2.isTurn=true;
    player2.addActionPoints();
    sendMessage(roomid,`C'est au tour de ${player2}`,"gameMaster");
}

function checkEndTurn(player1, player2){
    if (player1.actionPoints === 0){
        player1.isTurn=false;
        player2.isTurn=true;
        player2.addActionPoints();
        sendMessage(roomid,`C'est au tour de ${player2}`,"gameMaster");
    }
}

function checkGameOver(player) {
    if (player.cards.length === 0){
        sendMessage(roomid,`${player} a perdu`)
        return true
    }
}

module.exports = {
    startGame,
    playCard,
    endTurn,
    checkGameOver,
    checkEndTurn
};
