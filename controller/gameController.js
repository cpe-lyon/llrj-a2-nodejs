const Player = require('../models/player');
const Card = require('../models/card');

function startGame(players) {
    players.forEach(player => {
        player.resetActionPoints();
    });
    players[0].isTurn = true;
}

function playCard(attacker, defender, cardId) {
    const cardA = attacker.cards.find(c => c.id === cardId);
    if (!card) {
        throw new Error("Carte non trouvée dans les cartes de l'attaquant.");
    }
    if (attacker.actionPoints < card.attack) {
        throw new Error("Pas assez de points d'action pour jouer cette carte.");
    }

    const cardD = defender.cards.find(c => c.id === cardId);
    if (!cardD) {
        throw new Error("Carte non trouvée dans les cartes du defenseur.");
    }

    attacker.actionPoints -= cardA.attack;

    let damage = cardA.attack - cardD.health;

    const critChance = Math.random();
    const dodgeChance = Math.random();

    if (critChance < 0.1) {
        damage *= 2;
        console.log("Coup critique !");
    }

    if (dodgeChance < 0.1) {
        damage = 0;
        console.log("Esquive réussie !");
    }

    cardD.health -= damage;
    if (card.health <=0){
        console.log(`Dégâts infligés : ${damage}, carte tué : ${card.id}`);
        checkGameOver(defender);
    }else {
        console.log(`Dégâts infligés : ${damage}, vie restante : ${card.health}`);
        checkEndTurn(attacker,defender)
    }

    return damage;
}

function endTurn(player1, player2) {
    player1.isTurn=false;
    player2.isTurn=true;
    player2.addActionPoints();
}

function checkEndTurn(player1, player2){
    if (player1.actionPoints === 0){
        player1.isTurn=false;
        player2.isTurn=true;
        player2.addActionPoints();
    }
}

function checkGameOver(players) {
    const loser = players.find(player => player.cards.length === 0);
    return loser ? true : false;
}

module.exports = {
    startGame,
    playCard,
    endTurn,
    checkGameOver,
    checkEndTurn
};
