const jwt = require('jsonwebtoken');

const Auth = (req, res, next) => {
    try {
        const accesstoken = req.cookies.accesstoken;
        if (!accesstoken) return res.redirect('/');

        jwt.verify(accesstoken, '37KV?w<P*mNR#K{9eK:N&/r@N=Rr#Y}8F,468/*g[jtVHW&Kbs', (err, user) => {
            if (err) return res.status(400).json({ msg: "Invalid Authentication" });

            req.user = user;
            next();
        });
    } catch (err) {
        return res.status(500).json({ msg: err.message });
    }
}

module.exports = Auth;