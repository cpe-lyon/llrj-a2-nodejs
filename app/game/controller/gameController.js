const { getUsers } = require('../services/apisService');

const Player = require('../models/player');
const Card = require('../models/card');
const express = require('express');
const router = express.Router();
const ADMIN_KEY = 'ADMIN_KEY';

let games = {};

class UserController {
    constructor({}) {
        console.log("new UserController")
    }

    async startGame(roomId, res) {
        if(!games[roomId]) {
            res.status(404).send('Room not found');
        }
        let players = (await getUsers(roomId)).map(id=> new Player(id));

        players.forEach(player => {
            player.resetActionPoints();
        });
        players[0].isTurn = true;
        sendMessage(roomid,`Debut de la partie, ${players[0]} qui commence`,"gameMaster")
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

export default new UserController({})