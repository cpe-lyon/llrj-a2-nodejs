class Player {
    constructor(id, name) {
        this.id = id;
        this.name = name;
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
}
