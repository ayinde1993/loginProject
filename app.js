
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
var encrypt = require('mongoose-encryption');
//const _ = require("lodash");
const { name } = require("ejs");

const app = express();
//console.log(process.env.API_KEY);

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static("public"));
//connection db 
mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});
//DB encription
secret = process.env.SECRET;

userSchema.plugin(encrypt, { secret: secret,  encryptedFields: ['password'] });


const User = mongoose.model("User", userSchema);

app.get("/", function(req, res){
    res.render("home");
});


app.get("/login", function(req, res){
    res.render("login");
});


app.get("/register", function(req, res){

    res.render("register");
});

app.post("/register", function(req,res){

    const newUser =  new User ({
        email: req.body.username,
        password: req.body.password

    })
    newUser.save().then(function(saveUser){
        if (saveUser) {
        res.render("secrets");  
        } else{
            res.send("Oups please retry pls!");
        }
    })

});

app.post("/login", function(req, res){
    const userName = req.body.username;
    const passWord = req.body.password;

    User.findOne({email: userName}).then(function (foundUser) {
        if (!foundUser) {
           console.log("User not found make sur this user have an account");
           res.redirect("/login")
            
        } else {
            if (foundUser.password === passWord) {
                res.render("secrets");
            } else {
                console.log("Password not Match");
                res.redirect("/login")
            }
        }
    })
});





let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, function () {
    console.log("Server started successfully."); 
  });