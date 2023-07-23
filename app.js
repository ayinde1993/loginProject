
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const { name } = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const findOrCreate = require('mongoose-findorcreate');

//var encrypt = require('mongoose-encryption');
//var md5 = require('md5');
//const bcrypt = require('bcrypt');
//const saltRounds = 10;
//const _ = require("lodash");


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
    password: String,
    googleId: String,
    facebookId: String,
    //secret: String
});

const SecretsListeSchema = new mongoose.Schema({
        pseudo: String,
        secret: String
   });

userSchema.plugin(passportLocalMongoose);// hash pasword 
//DB encription
userSchema.plugin(findOrCreate);// hash pasword 


const User = new mongoose.model("User", userSchema);
const SecretsListe = new mongoose.model("SecretsListe", SecretsListeSchema);

passport.use(User.createStrategy());

//used to serialize the user for the session
passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      cb(null, { id: user.id, username: user.username });
    });
  });
// used to deserialize the user
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL:"https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
   // console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_CLIENT_ID,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));





app.get("/", function(req, res){
    res.render("home");
});

app.get("/auth/google",
  passport.authenticate("google", { scope: ["profile"] 
}));

app.get("/auth/facebook",
  passport.authenticate("facebook")
  );

  app.get("/auth/google/secrets", 
  passport.authenticate("google", { failureRedirect: "/login"}),
  function(req, res) {
    // Successful authentication, redirect secret page.
    res.redirect("/secrets");
  });

  app.get("/auth/facebook/secrets",
  passport.authenticate("facebook", { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  });

app.get("/login", function(req, res){
    res.render("login");
});


app.get("/register", function(req, res){

    res.render("register");
});

app.get("/secrets", function(req, res){
    SecretsListe.find({}).then(function(foundSecrets){
    if(foundSecrets){
        res.render("secrets", {foundSecrets: foundSecrets})
    }
   })
});

app.get("/submit", function(req, res){
    if(req.isAuthenticated()){
        res.render("submit");
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

app.post("/submit",function(req,res){

    User.findOne({email: req.body.username }).then(function(foundUser) {
        if (foundUser){
            console.log(foundUser.email);
        }
       
      

    })// find All items  

    // const submitedSecret = req.body.secret;

    // const newSecret = new SecretsListe({
    //         pseudo: user.id,
    //         secret: submitedSecret
        
       
    //   });
    //   newSecret.save();
    //   res.redirect("/secrets");

    //   SecretsListe.find({}).then(function (foundedSecret) {
    //     if (!foundedSecret){
    //         console.log(err);
    //     } else{
    //         if(foundedSecret){
    //            // secret.save();

    //             console.log(newSecret.secrets.pseudo);
               
               
    //            foundedSecret.push(newSecret);
    //            //foundedSecret.save()
    //         //.then(function(){
    //         //       res.redirect("/secrets");
    //         //      });
    //         }
    //     }
        
    // });


});







let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, function () {
    console.log("Server started successfully."); 
  });