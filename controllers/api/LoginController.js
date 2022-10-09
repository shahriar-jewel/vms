const User = require('../../model/UserModel');
    //const bcrypt = require('bcrypt')
const bcrypt = require('bcrypt-nodejs')
const jwt = require('jsonwebtoken')
const { body, validationResult } = require('express-validator');
const { respondWithError, respondWithSuccess } = require('../admin/ResponseController');
// const VisitorInfo = require('../../model/role/');
// const Employees = require('../models/employeeModel');

const LoginController = {
    accessToken: async(req, res) => {
        try {
            const { email, password } = req.body;

            const user = await User.findOne({ email });
            if (!user) return res.status(400).json({ status: false, msg: "User does not exist." });
            if (user && !user.status==1) return res.status(400).json({ status: false, msg: "User is inactive." });

            const isMatch = bcrypt.compareSync(password, user.password);

            if (!isMatch) return res.status(400).json({ status: false, msg: "Incorrect password." });

            // If login success , create access token and refresh token
            const accesstoken = createAccessToken({ id: user._id, sys_group_id: user.sys_group.id, name: user.name });
            const refreshtoken = createRefreshToken({ id: user._id, sys_group_id: user.sys_group.id, name: user.name });

            res.cookie('refreshtoken', refreshtoken, {
                httpOnly: true,
                path: '/api/v1/refresh-token',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7d
            })

            return res.json({ accesstoken, status: true });

        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    },
    logout: async(req, res) => {
        try {
            res.clearCookie('refreshtoken', { path: '/api/refresh-token' })
            return res.json({ msg: "Logged out", status: true })
        } catch (err) {
            return res.status(500).json({ msg: err.message, status: false })
        }
    },
    refreshToken: (req, res) => {
        try {
            const rf_token = req.cookies.refreshtoken;
            if (!rf_token) return res.status(400).json({ msg: "Please Login or Register", status: false });

            jwt.verify(rf_token, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
                if (err) return res.status(400).json({ msg: "Please Login or Register", status: false });
                const accesstoken = createAccessToken({ id: user.id });
                return res.json({ accesstoken, status: true });
            })

        } catch (err) {
            return res.status(500).json({ msg: err.message, status: false })
        }
    },
    getLoggedinUser: async(req, res) => {
        try {
            const user = await User.findById(req.user.id).select('-password');
            if (!user) return respondWithSuccess(req,res,msg='User does not exist.',user='',200);
             return respondWithSuccess(req,res,msg='Loggedin user information.',user,200);
        } catch (err) {
            return respondWithSuccess(req,res,msg=err.message,user='',200);
        }
    },
    
}

const createAccessToken = (user) => {
    return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' })
}
const createRefreshToken = (user) => {
    return jwt.sign(user, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' })
}

module.exports = LoginController;