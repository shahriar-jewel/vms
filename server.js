require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const path = require('path');
const bp = require('body-parser');
const flash = require('connect-flash');
const { readdirSync } = require('fs');
// var expressLayouts = require('express-ejs-layouts');
var expressLayouts = require('express-ejs-layouts');
const router = express.Router();


const app = express();

app.use(express.json());
app.use(session({
    secret: 'secret',
    saveUninitialized: true,
    resave: true
}));

app.use(flash());
app.use('/', require('./routes/web'));
app.use('/meeting', require('./routes/web'));

app.use(expressLayouts);
app.use(cookieParser());

app.use(cors());

app.use(bp.json());
app.use(bp.urlencoded({
    extended: true
}));

// view engine
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'upload')));
app.set("views", path.join(__dirname, "views"));
app.set("layout", path.join(__dirname, "./views/common/layout.ejs"));
// app.set("view engine", "pug");
app.set('view engine', 'ejs');

// routes middleware
app.use('/admin', require('./routes/web'));
app.use('/api', require('./routes/api'));

app.use(function(req, res, next) {
    res.locals.user = req.user;
    next();
});

app.locals = {
    name : 'Juwel',
};


console.log('Routing Done...');
// Connect to mongodb
const URI = process.env.MONGODB_URL;
mongoose.connect(URI, {
    // useNewUrlParser: true,
    // useUnifiedTopology: true,
    useMongoClient : true
}, err => {
    if (err) throw err;
    console.log('Connected to MongoDB');
});

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
    console.log('Server is running on port', PORT)
});