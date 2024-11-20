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
        sendMessage(roomid,`start-game;Debut de la partie, ${players[0]} qui commence`)
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
            cardA = attacker.cards.find(c => c.id === attackerCardId);
            cardD = defender.cards.find(c => c.id === defenderCardId);
        } else {
            attacker = players[1];
            defender = players[0];
            cardA = defender.cards.find(c => c.id === attackerCardId);
            cardD = attacker.cards.find(c => c.id === defenderCardId);
        }

        if (!cardA || !cardD) {
            throw new Error("Carte non trouvée dans les cartes de l'attaquant.");
        }

        if(cardA.hasOwnProperty('attack')) {
            cardA.attack = 5
        }
        if(cardD.hasOwnProperty('health')) {
            cardD.health = 10
        }

        if (attacker.actionPoints < cardA.attack) {
            throw new Error("Pas assez de points d'action pour jouer cette carte.");
        }

        attacker.actionPoints -= cardA.attack;

        let damage = Math.abs(cardA.attack - cardD.health)

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

        cardD.health -= damage;
        
        if (cardD.health <=0){
            sendMessage(roomId,`reload-game;Dégâts infligés : ${damage}, carte tué : ${cardD.id}`);
            console.log(`Dégâts infligés : ${damage}, carte tué : ${cardD.id}`);
            checkGameOver(defender);
        }else {
            sendMessage(roomId,`reload-game;Dégâts infligés : ${damage}, vie restante : ${cardD.health}`);
            console.log(`Dégâts infligés : ${damage}, vie restante : ${cardD.health}`);
            attacker, defender = checkEndTurn(attacker, defender);
        }

        games[roomId].players[0] = attacker;
        games[roomId].players[1] = defender;
    }

    endTurn(roomid, res) {
        if(!games[roomId]) {
            res.status(404).send('Room not found');
        }
        let players = games[roomId].players;
        if(players[0].isTurn == true) {
            games[roomId].players[0] = false;
            games[roomId].players[1] = true;
            games[roomId].players[1].addActionPoints();
            sendMessage(roomid,`reload-game;C'est au tour de ${players[1]}`);
        } else {
            games[roomId].players[1] = false;
            games[roomId].players[0] = true;
            games[roomId].players[0].addActionPoints();
            sendMessage(roomid,`reload-game;C'est au tour de ${players[0]}`);
        }
    }

    checkEndTurn(player1, player2){
        if (player1.actionPoints === 0){
            player1.isTurn=false;
            player2.isTurn=true;
            player2.addActionPoints();
            sendMessage(roomid,`reload-game;C'est au tour de ${player2}`);
        }
        return player1, player2;
    }

    checkGameOver(player) {
        if (player.cards.length === 0){
            sendMessage(roomid,`game-end;${player} a perdu`)
            return true
        }
    }
}

module.exports = new UserController({})