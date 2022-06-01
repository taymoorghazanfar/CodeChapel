let express = require("express"),
    router = express.Router(),
    passport = require("passport"),
    Article = require("../models/article"),
    User = require("../models/user"),
    middleware = require("../middleware/index"),
    nodeMailer = require("nodemailer");


//SHOW NEW USER FORM
router.get("/new", function (req, res) {

    res.render("users/register.ejs", {page: "register"});
});

//REGISTER THE USER TO DATABASE
router.post("/new", function (req, res) {

    let fullName = req.body["fullName"];
    let phone = req.body["phone"];
    let email = req.body["email"];
    let avatar = req.body["avatar"];
    let username = req.body["username"];
    let password = req.body["password"];

    //validate password and username
    if (password.length < 6 || username.length < 6) {

        req.flash("error", "Username and Password must be at least 6 characters long");
        res.redirect("back");
        return;
    }

    User.register(new User({
        username: username,
        fullName: fullName,
        phone: phone,
        avatar: avatar,
        email: email

    }), password, function (err, user) {

        if (err) {

            console.log(err);
            req.flash("error", err.message);
            res.redirect("back");

        } else {

            passport.authenticate("local")(req, res, function () {

                //prepare a welcome message to send via email
                let smtpTransport = nodeMailer.createTransport({

                    service: "Gmail",
                    auth: {

                        user: "projectcodechapel@gmail.com",
                        pass: "123456CCC"
                    }
                });

                let mailOptions = {

                    to: user.email,
                    from: "projectcodechapel@gmail.com",
                    subject: "Welcome to CodeChapel.com",
                    text: "Hello " + user.fullName + "\n" +
                        " Welcome to the most rich and friendly programming portal on the web.\n" +
                        " Are you an expert in programming ? Then its time to showcase your skills and start helping out the developer community by creating new articles.\n" +
                        " If not, Dont worry! We have thousands of expert programmers who has already joined CodChapel.com just to solve your programming problems.\n" +
                        " so what are you waiting for ?\n" +
                        " Start browsing thousands of articles available or create a new one by visiting the links given below:\n\n" +
                        " Login: " + "https://codechapel.herokuapp.com/users/login\n" +
                        " All articles: " + "https://codechapel.herokuapp.com/articles\n" +
                        " Create new article: " + "https://codechapel.herokuapp.com/articles/new\n\n" +
                        " Have a great day!"
                };

                //send message to the website owner(ME)
                smtpTransport.sendMail(mailOptions, function (err) {

                    if (!err) {

                        req.flash("success", "Welcome " + user["fullName"]);
                        res.redirect("/articles");

                    } else {

                        req.flash("success", "Welcome " + user["fullName"]);
                        res.redirect("/articles");
                    }
                });
            });
        }
    });
});

//SHOW LOGIN FORM
router.get("/login", function (req, res) {

    res.render("users/login.ejs", {page: "login"});
});

//LOGIN THE USER
router.post("/login", passport.authenticate("local",
    {

        successRedirect: "/articles",
        successFlash: "Welcome back!",

        failureRedirect: "/users/login",
        failureFlash: "Invalid username or password"

    }), function (req, res) {
});

//LOGOUT THE USER
router.get("/logout", function (req, res) {

    req.logout();
    // req.flash("success", "Logged out successfully");
    res.redirect("/users/login");
});

//SHOW PROFILE
router.get("/:id", function (req, res) {

    User.findById(req.params.id, function (err, foundUser) {

        if (!foundUser) {

            req.flash("error", "Profile not found");
            res.redirect("back");
            return;
        }
        if (err) {

            req.flash("error", err.message);
            res.redirect("back");

        } else {

            Article.find().where("author.id").equals(foundUser._id).exec(function (err, articles) {

                if (err) {

                    req.flash("error", err.message);
                    res.redirect("back");
                } else {

                    res.render("users/show.ejs", {user: foundUser, articles: articles, page: 'undefined'});
                }
            });
        }
    });
});

//SHOW EDIT PROFILE FORM
router.get("/:id/edit", middleware.checkProfileOwnership, function (req, res) {

    //find the user to edit
    User.findById(req.params.id, function (err, user) {

        if (err) {

            req.flash("error", "Nothing found to edit");
            res.redirect("back");

        } else {
            //goto edit page with article to edit
            res.render("users/edit.ejs", {user: user, page: 'undefined'});
        }
    });
});

//UPDATE PROFILE ROUTE
router.put("/:id", middleware.checkProfileOwnership, function (req, res) {

    //check email

    //find the profile
    User.findByIdAndUpdate(req.params.id, req.body.user, {
        runValidators: true,
        context: 'query'
    }, function (err, updatedUser) {

        if (err) {

            req.flash("error", err.message);
            res.redirect("back");

        } else {

            req.flash("success", "Profile updated successfully");
            res.redirect("/users/" + req.params.id);
        }
    });
});

//DESTROY PROFILE
router.delete("/:id", middleware.checkProfileOwnership, function (req, res) {

    User.findByIdAndRemove(req.params.id, function (err) {

        if (err) {

            console.log(err);
            req.flash("error", "Nothing found to delete");
            res.redirect("back");

        } else {

            res.redirect("/users/logout");
        }
    });
});

module.exports = router;