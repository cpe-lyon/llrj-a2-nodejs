const { getUsers, sendMessage} = require('../services/apisService');

const Player = require('../models/player');

/**
 *
 * @type {{[room:string]: {players: [Player, Player]}}}
 */
let games = {};

class UserController {
    constructor({}) {
        console.log("new UserController")
    }

    async startGame(roomId, res) {
        if(!roomId) {
            return res.status(401).send('Invalid room id');
        }
        if(games[roomId]) {
            return res.status(401).send('Room already created');
        }
        console.log("Starting "+roomId)
        /**
         * @type {[Player, Player]}
         */
        let players = (await getUsers(roomId)).map(id=> new Player(id));

        players.forEach(player => {
            player.resetActionPoints();
        });
        players[0].isTurn = true;
        games[roomId] = {players};
        await sendMessage(roomId,"start-game;---")
        res.send({ message: "Le jeu a commencé." });
    }

    playCard(roomid, attacker, defender, cardId) {
        const cardA = attacker.cards.find(c => c.id === cardId);
        if (!cardA) {
            sendMessage(roomid,"Carte non trouvée dans les cartes de l'attaquant.","gameMaster");
            throw new Error("Carte non trouvée dans les cartes de l'attaquant.");
        }
        if(cardA.hasOwnProperty('attack')) {
            cardA.attack = 5
        }
        if (attacker.actionPoints < cardA.attack) {
            sendMessage(roomid,"Pas assez de points d'action pour jouer cette carte.","gameMaster");
            throw new Error("Pas assez de points d'action pour jouer cette carte.");
        }

        const cardD = defender.cards.find(c => c.id === cardId);
        if (!cardD) {
            sendMessage(roomid,"Carte non trouvée dans les cartes du defenseur.","gameMaster");
            throw new Error("Carte non trouvée dans les cartes du defenseur.");
        }

        attacker.actionPoints -= cardA.attack;

        if(cardD.hasOwnProperty('health')) {
            cardD.health = 10
        }

        let damage = Math.abs(cardA.attack - cardD.health)

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
        if (cardD.health <=0){
            sendMessage(roomid,`Dégâts infligés : ${damage}, carte tué : ${cardD.id}`,"gameMaster");
            console.log(`Dégâts infligés : ${damage}, carte tué : ${cardD.id}`);
            checkGameOver(defender);
        }else {
            sendMessage(roomid,`Dégâts infligés : ${damage}, vie restante : ${cardD.health}`,"gameMaster");
            console.log(`Dégâts infligés : ${damage}, vie restante : ${cardD.health}`);
            checkEndTurn(attacker,defender)
        }
        return damage;
    }

    endTurn(roomid, player1, player2) {
        player1.isTurn=false;
        player2.isTurn=true;
        player2.addActionPoints();
        sendMessage(roomid,`C'est au tour de ${player2}`,"gameMaster");
    }

    checkEndTurn(player1, player2){
        if (player1.actionPoints === 0){
            player1.isTurn=false;
            player2.isTurn=true;
            player2.addActionPoints();
            sendMessage(roomid,`C'est au tour de ${player2}`,"gameMaster");
        }
    }

    checkGameOver(player) {
        if (player.cards.length === 0){
            sendMessage(roomid,`${player} a perdu`)
            return true
        }
    }
}

module.exports = new UserController({})