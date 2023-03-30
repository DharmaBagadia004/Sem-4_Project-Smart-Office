const express = require('express');
// const logIn = require("../controlles/login"); 
// const loggedIn = require("../controlles/loggedIn");
// const mysql = require("./connection").con;
const app = express();
const path = require('path');;
const bodyParser= require("body-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookie = require("cookie-parser");
const randomstring = require('randomstring');

const auth = require('../controllers/auth');
const User = require("./register");
const fileup = require("./file");
const team = require("./team");
const feed_back = require("./feedback");
const { log } = require('console');

require('dotenv').config();


app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended:true }))

app.get('/', (req, res) => {
    res.render("login");
});
app.post("/login", async(req, res) => {
    try {
        // const email = req.body.email;
        // const password = req.body.password;
        const {email, password, username } = req.body;
        // console.log(email,password,username);
        const userEmail = await User.findOne({ email: email });
        // console.log("Mail:",userEmail);
        const isMatch = await bcrypt.compare(password, userEmail.password);

        const token = await userEmail.generateAuthToken();
        // console.log(`The required token is ${token}`);

        // Creating cookies
        // console.log(`Expires time: ${process.env.COOKIE_EXPIRES * 90 * 24 * 60 * 60 * 1000}`);
        res.cookie("jwt", token, {
            // expires: process.env.JWT_EXPIRES,
            expires: new Date(Date.now() + process.env.COOKIE_EXPIRES * 90 * 24 * 60 * 60 * 1000),
            httpOnly: true
        });
 
        // console.log("Hu ahi pochu chu!");
        // console.log(`Cookie: ${req.cookies.jwt}`);


        if (isMatch) {
            console.log("User ",username," login successful");
            res.status(201).redirect("/home");
        } else {
            res.send("invalid login details!!")
        }
    } catch (error) {
        console.log(error)
        console.log("Hello");
        res.status(400).send("Invalid login details")
            // res.status(201).render("index");
    }
})

app.get('/home', auth, (req, res) => {
    team.find().then(function(teams){
        feed_back.find().then(function(feds){
            res.render("Home", {
                data: req.user,team: teams,feed: feds});  
            });
    });
});
app.post("/feedback", (req,res)=>{
    var name=req.body.feedname;
    var des = req.body.feeddes;
    // console.log(name,des);
    const feed = new feed_back({
        feed_name: name,
        feed_des: des
    })
    const f= feed.save()
    res.redirect("/home")
})

app.get('/yourteam/:tcode',auth,(req,res)=>{
    console.log("TCPDE:",req.params.tcode);
    team.find({tcode: req.params.tcode}).then(function(list){
        // console.log("List:",list);
        res.render("yourteam",{
            data: req.user, team: list})
    })
});

app.get('/index/:code', auth,(req, res) => {
    var c = req.params.code;
    // fval(c);
    res.render("index",{
        data: req.user, code:req.params.code
    });
});
// let f = "";
// function fval(val)
// {
//     let fc = (req,res)=>
//     {
//         console.log("VAL:",val);
//         next();
//         // return val;
//     }
    
// }
app.get('/about', auth,(req, res) => {
    res.render("about",{
        data: req.user
    });
});
app.get('/contact', auth,(req, res) => {
    res.render("contact",{
        data: req.user
    });
});
app.get('/account',auth,(req, res) => {
    res.render("account", {
        data: req.user
    });
});

app.get("/account/admin", auth,(req, res) => {
    User.find().then(function(lists){
        var let = req.user.role.toUpperCase();
        // console.log("LET:",let);
        team.find().then(function(teams){
            // console.log(teams);
            res.render("admin", { data: let,datas: lists,team: teams });  
        })
    })
});

app.get("/account/admin/user/:id",auth,(req,res)=>{
    if(req.user.stafflogin==true)
    {
    User.deleteOne({"_id":req.params.id}).then(()=>{
        console.log("Data deleted"); // Success
    }).catch(function(error){
        console.log(error); // Failure
    });
    res.redirect("/account/admin")
    }
})

app.get("/account/admin/team/:id",auth,(req,res)=>{
    if(req.user.stafflogin==true)
    {
    team.deleteOne({"_id":req.params.id}).then(()=>{
        console.log("Data deleted"); // Success
    }).catch(function(error){
        console.log(error); // Failure
    });
    res.redirect("/account/admin")
    }
})

app.post("/account/admin/register", async(req, res) => {
    // console.log("REGISTER");
    try {
        // console.log("REGISTER TRY");
        const password = req.body.password;
        const cPassword = req.body.confirmpassword;

        if (password === cPassword) 
        {
            const registerCustomers = new User({
                username: req.body.username,
                email: req.body.email,
                password: password,
                confirmpassword: cPassword,
                role: "employee"
            })

            // console.log("the success part: " + registerCustomers);
            const token = await registerCustomers.generateAuthToken();
            // console.log(`The required token is ${token}`);

            // console.log("Ahi too pochi gayo!")

            const registered = await registerCustomers.save();
            // console.log(registered);
            // console.log("SUCCESSFUL");
            console.log("User",req.body.username,"Registered");
            res.status(201).redirect('/account/admin');
        } else {
            console.log("Not matching");
            res.send("Password not matching!!")
        }

    } catch (error) {
        res.status(400).send(error);
    }

})

app.post("/account/admin/teamreg", async(req, res) => {
    // console.log("REGISTER");
    let code = '';
    while (code.length < 5) {
    code += randomstring.generate({
        length: 1,
        charset: 'abcdefghijklmnopqrstuvwxyz1234567890!@$%&' });
    }
    console.log("Code:",code);
    try {
        // console.log("REGISTER TRY");
        const tcode = code;
        const tname = req.body.team_name;
        const tdes = req.body.team_des;
        const u1 = req.body.tmem1;
        const u2 = req.body.tmem2;
        const u3 = req.body.tmem3;
        const u4 = req.body.tmem4;
        
        if(u3 && u4)
        {
            const create_team = new team({
                team_name: tname,
                team_des: tdes,
                tcode: tcode,
                user1: u1,
                user2: u2,
                user3: u3,
                user4: u4,
            })
            const doneteam = create_team.save()
        }
        else if(u3)
        {
            const create_team = new team({
                team_name: tname,
                team_des: tdes,
                tcode: tcode,
                user1: u1,
                user2: u2,
                user3: u3,
                user4: null,
            })
            const doneteam = create_team.save()
        }
        else
        {
            const create_team = new team({
                team_name: tname,
                team_des: tdes,
                tcode: tcode,
                user1: u1,
                user2: u2,
                user3: null,
                user4: null,
            })
            const doneteam = create_team.save()
        }
        console.log("DoneTeam");
        res.status(201).redirect("/account/admin");
    } catch (error) {
        res.status(400).send(error);
    }
})

app.get("/message",auth,(req,res)=>{
    res.redirect("message");
})

app.get("/logout", auth,async(req, res) => {
    try {
        // console.log(req.user);
        console.log(`Logged-out out from ${req.user.username}'s account!!`);
        res.clearCookie('jwt');


        await req.user.save();
        res.redirect("/")
    } catch (error) {
        res.status(500).send(error);
    }
});

module.exports = app;