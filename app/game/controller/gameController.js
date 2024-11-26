const { getUsers, sendMessage, getCards} = require('../services/apisService');

const Player = require('../models/player');

/**
 *
 * @type {{[room:string]: {ready:boolean, players: [Player, Player]}}}
 */
let games = {};

class UserController {
    constructor({}) {
        console.log("new UserController")
    }

    getGame(room, res){
        const game = games[room]
        return game ? res.status(200).json(game) : res.status(404);
    }

    async selectCards(roomId, login, cards, res){
        if (cards?.length !== 3)
            return res.status(400).send("need 3 cards");
        let players = games[roomId]?.players;
        /**
         * @type {Player}
         */
        let player = players && players?.filter(p => p.id === login)[0];
        if (player.cards?.length === 3)
            return res.status(400).send("Cards already selected");
        let myCards = await getCards(player);
        let selectedCards = myCards?.filter(c => cards.includes(c.id));
        if (selectedCards?.length !== 3)
            return res.status(400).send("need 3 OWNED cards");
        selectedCards.forEach(c=>player.addCard(c));

        if (players.filter(p => p.cards.length === 3).length === 2){
            games[roomId].ready = true;
        }

        await sendMessage(roomId,"reload-game;---")

    }

    async startGame(roomId, res) {
        if(!roomId) {
            return res.status(400).send('Invalid room id');
        }
        if(games[roomId]) {
            return res.status(400).send('Room already created');
        }
        console.log("Starting "+roomId)
        /**
         * @type {[Player, Player]}
         */
        let players = (await getUsers(roomId)).map(id=> new Player(id));

        for (let player of players){
            if ((await getCards(player)).length < 3)
                return res.status(400).send('3 cards needed per player');
        }

        players.forEach(player => {
            player.resetActionPoints();
        });
        players[0].isTurn = true;
        games[roomId] = {players, ready: false};
        await sendMessage(roomId,"start-game;---")
        res.send({ message: "Le jeu a commencé." });
    }

    playCard(roomId, attackerCardId, defenderCardId, res) {
        if(!games[roomId]) {
            res.status(404).send('Room not found');
        }
        let players = games[roomId].players;
        let cardA, cardD, attacker, defender;

        if(players[0].isTurn == true) {
            attacker = players[0];
            defender = players[1];
        } else {
            attacker = players[1];
            defender = players[0];
        }
        cardA = attacker.cards.find(c => c.id === attackerCardId);
        cardD = defender.cards.find(c => c.id === defenderCardId);

        if (!cardA || !cardD) {
            throw new Error("Carte non trouvée dans les cartes de l'attaquant.");
        }

        if(!cardA.hasOwnProperty('attack')) {
            cardA.attack = 5
        }
        if(!cardD.hasOwnProperty('hp')) {
            cardD.hp = 10
        }

        console.log("ADOIWHOIHJAWOIDJAWD", cardD);
        
        if (attacker.actionPoints < cardA.energy) {
            throw new Error("Pas assez de points d'action pour jouer cette carte.");
        }

        attacker.actionPoints -= cardA.energy;

        let damage = Math.abs(cardA.attack)

        const critChance = Math.random();
        const dodgeChance = Math.random();

        if (critChance < 0.1) {
            damage *= 2;
            sendMessage(roomId,"game-log;Coup critique !");
            console.log("Coup critique !");
        }

        if (dodgeChance < 0.1) {
            damage = 0;
            sendMessage(roomId,"game-log;Esquive réussie !");
            console.log("Esquive réussie !");
        }

        cardD.hp -= damage;

        if (cardD.hp <=0){
            sendMessage(roomId,`reload-game;Dégâts infligés : ${damage}, carte tué : ${cardD.id}`);
            console.log(`Dégâts infligés : ${damage}, carte tué : ${cardD.id}`);
            this.checkGameOver(defender, roomId);
        }else {
            sendMessage(roomId,`reload-game;Dégâts infligés : ${damage}, vie restante : ${cardD.hp}`);
            console.log(`Dégâts infligés : ${damage}, vie restante : ${cardD.hp}`);
            [attacker, defender] = this.checkEndTurn(attacker, defender, roomId);
        }

        console.log(defender);
    }

    endTurn(roomId, res) {
        if(!games[roomId]) {
            res.status(404).send('Room not found');
        }
        let players = games[roomId].players;
        if(players[0].isTurn == true) {
            games[roomId].players[0].isTurn = false;
            games[roomId].players[1].isTurn = true;
            console.log(games[roomId].players[1]);
            
            games[roomId].players[1].addActionPoints();
            sendMessage(roomId,`reload-game;C'est au tour de ${players[1]}`);
        } else {
            games[roomId].players[1].isTurn = false;
            games[roomId].players[0].isTurn = true;
            games[roomId].players[0].addActionPoints();
            sendMessage(roomId,`reload-game;C'est au tour de ${players[0]}`);
        }
    }

    checkEndTurn(player1, player2, roomId){
        if (player1.actionPoints === 0){
            player1.isTurn=false;
            player2.isTurn=true;
            player2.addActionPoints();
            sendMessage(roomId,`reload-game;C'est au tour de ${player2}`);
        }
        return [player1, player2];
    }

    checkGameOver(player, roomId) {
        if (player.cards.length === 0){
            sendMessage(roomId,`game-end;${player} a perdu`)
            return true
        }
    }
}

module.exports = new UserController({})