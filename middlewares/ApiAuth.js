const jwt = require('jsonwebtoken');
const { respondWithError, respondWithSuccess } = require('../controllers/admin/ResponseController');

const apiauth = (req, res, next) => {
    try {
        const token = req.headers['authorization'];
        if (!token) return respondWithError(req, res, msg = 'Invalid Authentication !', data ='', 401);

        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
            if (err) return respondWithError(req, res, msg = 'Invalid Authentication !', data ='', 401);

            req.user = user;
            next();
        })
    } catch (err) {
        return res.status(500).json({ msg: err.message });
    }
}

module.exports = apiauth;