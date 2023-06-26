
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

//var encrypt = require('mongoose-encryption');
//var md5 = require('md5');
//const bcrypt = require('bcrypt');
//const saltRounds = 10;
//const _ = require("lodash");
const { name } = require("ejs");

const app = express();
//console.log(process.env.API_KEY);

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static("public"));

//initalise session
app.use(session({
    secret: "All is well my bro.",
    resave: false,
    saveUninitialized: false
}));

//initalise session passport
app.use(passport.initialize());
app.use(passport.session());

//connection db 
mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

userSchema.plugin(passportLocalMongoose);// hash pasword 
//DB encription

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.get("/", function(req, res){
    res.render("home");
});


app.get("/login", function(req, res){
    res.render("login");
});


app.get("/register", function(req, res){

    res.render("register");
});

app.get("/secrets", function(req, res){
    if(req.isAuthenticated()){
        res.render("secrets");
    } else{
        res.redirect("/login");
    }
});

app.get("/logout", function (req, res) {

    req.logout(function(err) {
        if (err) { 
            return next(err);
         }
         res.redirect("/");
      });
});


app.post("/register", function(req,res){

    User.register({username: req.body.username, active: false}, req.body.password, function(err, user) {
        if (err) { 
            console.log(err);
             res.redirect("/register");

        }else { 
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets");;
            });
      };

});
});

app.post("/login", function(req, res){

    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.logIn(user, function (err) {
        if (err){
            console.log(err);
            res.redirect("login");
        } else{
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets");
            });
        }
    });
   
});







let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, function () {
    console.log("Server started successfully."); 
  });