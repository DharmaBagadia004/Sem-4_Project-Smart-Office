// const User = require('../routes/register')

// exports.getLogin = (req, res, next) => {
//   res.render('auth/login', {
//     path: '/login',
//     pageTitle: 'Login',
//     isAuthenticated: false
//   });
// };

// exports.getSignup = (req, res, next) => {
//   res.render('auth/signup', {
//     path: '/signup',
//     pageTitle: 'Signup',
//     isAuthenticated: false
//   });
// };

// exports.postLogin = (req, res, next) => {
//   User.findById('5bab316ce0a7c75f783cb8a8')
//     .then(user => {
//       req.session.isLoggedIn = true;
//       req.session.user = user;
//       req.session.save(err => {
//         console.log(err);
//         res.redirect('/');
//       });
//     })
//     .catch(err => console.log(err));
// };

// exports.postSignup = (req, res, next) => {
//   const username = req.body.username;
//   const email = req.body.email;
//   const password = req.body.password;
//   const confirmPassword = req.body.confirmpassword;
//   console.log(username,email,password,confirmpassword);
//   User.findOne({ email: email })
//     .then(userDoc => {
//       if (userDoc) {
//         console.log("FAIL");
//         // return res.redirect('/account/admin');
//       }
//       const user = new User({
//         username: username,
//         email: email,
//         password: password,
//         confirmpassword: confirmPassword
//       });
//       console.log( `PASS1:${user}`);
//       return user.save();
//     })
//     .then(result => {
//       console.log("PASS2");
//       // res.redirect('/account/admin');
//     })
//     .catch(err => {
//       console.log(err);
//     });
// };

// exports.postLogout = (req, res, next) => {
//   req.session.destroy(err => {
//     console.log(err);
//     res.redirect('/');
//   });
// };
const jwt = require('jsonwebtoken');
const Register = require('../routes/register');

const auth = async(req, res, next) => {
    try {
        // console.log("Hello from auth");
        const token = req.cookies.jwt;
        const verifyUser = jwt.verify(token, process.env.JWT_SECRET);
        // console.log(verifyUser);

        const user = await Register.findOne({ _id: verifyUser._id });
        // console.log(user.firstName);
        req.token = token;
        req.user = user;
        next();

    } catch (error) {
        res.redirect("/")
        // res.status(401).send(`Please login to visit this page. \n Error: ${error}`);
    }
}

module.exports = auth;