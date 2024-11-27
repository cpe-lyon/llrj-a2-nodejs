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

router.post('/playCard/:room', (req, res) => {
    const userLogin = req.headers['x-login'];
    try {
        return gameController.playCard(req.params.room, req.body.cardIdAttacker, req.body.cardIdDefender, res, userLogin);

    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

router.post('/endTurn/:room', (req, res) => {
    const userLogin = req.headers['x-login'];
    gameController.endTurn(req.params.room, res, userLogin);
});

module.exports = router;
