require("../app_chat")
const Player = require('../models/player');
const Card = require('../models/card');
const {sendMessage} = require("../app_chat");

function startGame(roomid,players) {
    players.forEach(player => {
        player.resetActionPoints();
    });
    players[0].isTurn = true;
    sendMessage(roomid,`Debut de la partie, ${players[0]} qui commence`,"gameMaster", Date.now())
}

function playCard(roomid, attacker, defender, cardId) {
    const cardA = attacker.cards.find(c => c.id === cardId);
    if (!card) {
        sendMessage(roomid,"Carte non trouvée dans les cartes de l'attaquant.","gameMaster", Date.now());
        throw new Error("Carte non trouvée dans les cartes de l'attaquant.");
    }
    if (attacker.actionPoints < card.attack) {
        sendMessage(roomid,"Pas assez de points d'action pour jouer cette carte.","gameMaster", Date.now());
        throw new Error("Pas assez de points d'action pour jouer cette carte.");
    }

    const cardD = defender.cards.find(c => c.id === cardId);
    if (!cardD) {
        sendMessage(roomid,"Carte non trouvée dans les cartes du defenseur.","gameMaster", Date.now());
        throw new Error("Carte non trouvée dans les cartes du defenseur.");
    }

    attacker.actionPoints -= cardA.attack;

    let damage = cardA.attack - cardD.health;

    const critChance = Math.random();
    const dodgeChance = Math.random();

    if (critChance < 0.1) {
        damage *= 2;
        sendMessage(roomid,"Coup critique !","gameMaster", Date.now());
        console.log("Coup critique !");
    }

    if (dodgeChance < 0.1) {
        damage = 0;
        sendMessage(roomid,"Esquive réussie !","gameMaster", Date.now());
        console.log("Esquive réussie !");
    }

    cardD.health -= damage;
    if (card.health <=0){
        sendMessage(roomid,`Dégâts infligés : ${damage}, carte tué : ${card.id}`,"gameMaster", Date.now());
        console.log(`Dégâts infligés : ${damage}, carte tué : ${card.id}`);
        checkGameOver(defender);
    }else {
        sendMessage(roomid,`Dégâts infligés : ${damage}, vie restante : ${card.health}`,"gameMaster", Date.now());
        console.log(`Dégâts infligés : ${damage}, vie restante : ${card.health}`);
        checkEndTurn(attacker,defender)
    }
    return damage;
}

function endTurn(roomid, player1, player2) {
    player1.isTurn=false;
    player2.isTurn=true;
    player2.addActionPoints();
    sendMessage(roomid,`C'est au tour de ${player2}`,"gameMaster", Date.now());
}

function checkEndTurn(player1, player2){
    if (player1.actionPoints === 0){
        player1.isTurn=false;
        player2.isTurn=true;
        player2.addActionPoints();
        sendMessage(roomid,`C'est au tour de ${player2}`,"gameMaster", Date.now());
    }
}

function checkGameOver(players) {
    const loser = players.find(player => player.cards.length === 0);
    return loser ? true : false;
    sendMessage(roomid,"${loser} a perdu", Date.now())
}

module.exports = {
    startGame,
    playCard,
    endTurn,
    checkGameOver,
    checkEndTurn
};
