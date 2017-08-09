// Initialize the NodeJS dependencies
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const exphbs = require('express-handlebars');
const expressValidator = require('express-validator');
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const mongo = require('mongodb');
const mongoose = require('mongoose');
const MemcachedStore = require('connect-memcached')(session);
const uuid = require('node-uuid');
const Schema = mongoose.Schema;
const async = require("async");

const fs = require('fs');

const nodemailer = require('nodemailer');
const User = require('./models/user');

// Get server start time
const milliseconds = new Date().getTime();
let humanDate = new Date(milliseconds);

console.log(humanDate.getFullYear());
console.log(milliseconds);

// Initialize Database connection
mongoose.connect('mongodb://localhost/dentacoin');
global.db = mongoose.connection;

// Routing constants
const routes = require('./routes/index');
const users = require('./routes/users');
const navigation = require('./routes/navigation')


// Init App
var app = express();
var serv = require('http').Server(app);
var io = require('socket.io').listen(serv);

// Declare the Express session
var sessionMiddleware = session({
    secret: 'the most secretive secret possible',
    saveUninitialized: true,
    resave: true,
    store: new MemcachedStore({
        hosts: ['127.0.0.1:11211'],
    })
});

// Express session middleware for Socket.io
io.use(function(socket, next) {
    sessionMiddleware(socket.request, socket.request.res, next);
});

// Initialise the Express Session
app.use(sessionMiddleware);

// View Engine
app.set('views', path.join(__dirname, 'views'));
app.engine('handlebars', exphbs({defaultLayout:'default'}));
app.set('view engine', 'handlebars');

// BodyParser Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// Set Static Folder
app.use(express.static(path.join(__dirname, 'public')));

// Passport init
app.use(passport.initialize());
app.use(passport.session());

// Express Validator
app.use(expressValidator({
  errorFormatter: function(param, msg, value) {
      var namespace = param.split('.')
      , root    = namespace.shift()
      , formParam = root;

    while(namespace.length) {
      formParam += '[' + namespace.shift() + ']';
    }
    return {
      param : formParam,
      msg   : msg,
      value : value
    };
  }
}));

// Connect Flash
app.use(flash());

// Global Vars
app.use(function (req, res, next) {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.user = req.user || null;
  res.locals.inCart = 11;
  if (res.locals.user) {
    for (var i in res.locals.user) {
      if (i === 'username') {
        req.session.username = res.locals.user[i];
      }
    }
  }
  next();
});

app.use('/', routes);
app.use('/users', users);
app.use('/', navigation);

// Set Port
app.set('port', (process.env.PORT || 4004));

// Start the Server
serv.listen(app.get('port'), function(){
	console.log('Server started on port '+app.get('port'));
});

USERS_ONLINE = {};

// Sockets + session middleware
io.sockets.on('connection', function(socket) {

    username = socket.request.session.username;
    sessionid = socket.request.sessionID;

    USERS_ONLINE[username] = socket.id;

    // Here's where the magic happens when the users fill out the tests.

    socket.on('disconnect', function() {
        delete USERS_ONLINE[socket.id];
        delete chatId;
    });

});
