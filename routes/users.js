var express = require('express');
var router = express.Router();
var multer = require('multer');
var upload = multer({destination: './uploads'});
var passport = require('passport');
var localStrategy = require('passport-local').Strategy;

var User = require('../models/user');

/* GET users listing. */
router.get('/', function (req, res, next) {
    res.send('respond with a resource');
});

router.get('/register', function (req, res, next) {
    res.render('register', {title: 'Register'});
});

router.get('/login', function (req, res, next) {
    res.render('login', {title: 'Login'});
});

router.post('/login',
    passport.authenticate('local', {failureRedirect: '/users/login', failureFlash: 'Invalid username or password'}),
    function (req, res) {
        req.flash('success', 'You are now in');
        res.redirect('/');
    });

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    User.getUserById(id, function(err, user) {
        done(err, user);
    });
});

passport.use(new localStrategy(function (username, password, done) {
    User.getuserByUsername(username, function (err, user) {
        if (err) throw err;
        if (!user) {
            return done(null, false, {message: "Unkown user"})
        }

        User.comparePassword(password, user.password, function (err, isMatch) {
            if (err) return done(err);
            if (isMatch) {
                return done(null, user);
            } else {
                return done(null, false, {message: 'Invalid password'});
            }
        })
    });
}));

router.post('/register', upload.single('profileimage'), function (req, res, next) {
    var name = req.body.name;
    var email = req.body.email;
    var username = req.body.username;
    var password = req.body.password;
    var password2 = req.body.password2;

    if (req.file) {
        console.log('Uploading file....');
        var profileImage = req.file.filename;
    } else {
        console.log('No file in queue....');
        var profileImage = 'noimage.jpg';
    }

    //Form validator
    req.checkBody('name', 'Name field is required').notEmpty();
    req.checkBody('email', 'Email field is required').notEmpty();
    req.checkBody('email', 'Email is not valid').isEmail();
    req.checkBody('username', 'Userame field is required').notEmpty();
    req.checkBody('password', 'Password field is required').notEmpty();
    req.checkBody('password2', 'Passwords do not match').equals(req.body.password);


    //Check errors
    var errors = req.validationErrors();
    if (errors) {
        res.render('register', {
            errors: errors
        })
    } else {
        var newUser = new User({
            name: name,
            email: email,
            username: username,
            password: password,
            profileImage: profileImage
        });

        User.createUser(newUser, function (err, user) {
            if (err) throw err;
            console.log(user);
        });

        req.flash('success', 'You are in bro');

        res.location('/');
        res.redirect('/');
    }

});


module.exports = router;
