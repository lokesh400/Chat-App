const express = require("express");
require('dotenv').config();
const http = require('http');
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const path = require("path");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const localStrategy = require("passport-local");
const socketIO = require('socket.io');

const User = require('./models/User');

const otprouter = require("./routes/otp.js");
const chatsrouter = require("./routes/chats.js");
const userrouter = require("./routes/user.js");
const socketHandler = require('./routes/socketHandler');

const app = express();
const port = 8000;



// Connect to MongoDB
mongoose.connect(process.env.mongo_url);

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.use(express.json());

const store = MongoStore.create({
  mongoUrl:process.env.mongo_url,
  crypto:{
    secret: process.env.secret,
  },
  touchAfter: 24*3600
})

store.on("error", ()=>{
  console.log("error in connecting mongo session store",error)
})

const sessionOptions = {
  store,
  secret: process.env.secret,
  resave:false,
  saveUninitialized:true,
  cookie:{
    expires: Date.now() + 3*24*60*60*1000,
    maxAge: 3*24*60*60*1000,
    httpOnly: true,
  }
}

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.currUser = req.user;
    next();
});


function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/user/login');
}

function isAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user.role === 'admin') {
    return next();
  }
  res.render("./error/accessdenied.ejs");
}

app.use("/user",userrouter);
app.use("/user",otprouter);
app.use("/",chatsrouter);

app.get('/',ensureAuthenticated, async (req, res) => {
  const users = await User.find(); // Fetch all users
  res.render('./chats/dashboard', { users });
});


Server = app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
socketHandler(io);
const io = socketIO(Server);