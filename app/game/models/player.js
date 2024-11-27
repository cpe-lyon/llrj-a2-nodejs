class Player {
    constructor(id) {
        this.id = id;
        this.cards = []; // cartes choisies par le joueur
        this.actionPoints = 50;
        this.totalActionPoints = 10;
        this.maxActionPoints = 200;
        this.isTurn = false;
    }
    addCard(card) {
        this.cards.push(card);
    }
    resetActionPoints() {
        this.actionPoints = this.totalActionPoints;
    }
    addActionPoints(){
        this.actionPoints += this.totalActionPoints;
    }
    isReady(){
        return this.cards.length > 0;
    }
}

module.exports = Player;