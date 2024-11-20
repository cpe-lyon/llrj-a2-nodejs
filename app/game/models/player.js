export default class Player {
    constructor(id) {
        this.id = id;
        this.cards = []; // cartes choisies par le joueur
        this.actionPoints = 3;
        this.totalActionPoints = 3;
        this.isTurn = false;
    }
    addCard(card) {
        this.cards.push(card);
    }
    resetActionPoints() {
        this.actionPoints = this.totalActionPoints;
    }
    addActionPoints(){
        this.actionPoints += 2;
    }
    isReady(){
        return this.cards.length == 3;
    }
}
