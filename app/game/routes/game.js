const express = require('express');
const router = express.Router();
const gameController = require('../controller/gameController');

router.post('/start/:room',async  (req, res) => {
    // Initialiser le jeu avec les joueurs fournis
    return gameController.startGame(req.params.room, res);
});

router.get('/data/:room',async  (req, res) => {
    // Initialiser le jeu avec les joueurs fournis
    console.log("Getting game data");
    return gameController.getGame(req.params.room, res);
});

router.post('/select/:room', async (req, res) => {
    const userLogin = req.headers['x-login'];
    if (!userLogin) return res.status(401);
    return await gameController.selectCards(req.params.room, userLogin, req.body.cardIds, res);
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
