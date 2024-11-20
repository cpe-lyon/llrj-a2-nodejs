const express = require('express');
const router = express.Router();
const gameController = require('../controller/gameController');

router.post('/start', (req, res) => {
    // Initialiser le jeu avec les joueurs fournis
    gameController.startGame(req.body.players);
    res.send({ message: "Le jeu a commencé." });
});

router.post('/playCard', (req, res) => {
    try {
        const damage = gameController.playCard(req.body.attacker, req.body.defender, req.body.cardId);
        res.send({ message: `Carte jouée avec succès, dégâts infligés: ${damage}` });
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

router.post('/endTurn', (req, res) => {
    gameController.endTurn(req.body.players);
    res.send({ message: "Fin de tour, main passée au joueur suivant." });
});

module.exports = router;
