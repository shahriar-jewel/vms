const router = require('express').Router();
const VisitorController = require('../controllers/api/VisitorController');
const LoginController = require('../controllers/api/LoginController');
const apiauth = require('../middlewares/ApiAuth');
const { check } = require('express-validator');

router.post('/access-token', LoginController.accessToken);
router.get('/logout', LoginController.logout);
router.get('/refresh-token', LoginController.refreshToken);
// router.get('/infor', auth, LoginController.getUser);

router.post('/visitorinfo/v2', apiauth,
    VisitorController.getVisitorPayload);

module.exports = router;