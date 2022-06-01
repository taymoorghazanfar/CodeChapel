let express = require("express"),
    router = express.Router(),
    User = require("../models/user"),
    async = require("async"),
    nodeMailer = require("nodemailer"),
    crypto = require("crypto");

//HOME PAGE
router.get("/", function (req, res) {

    res.render("landing.ejs");
});

//ABOUT US PAGE
router.get("/about", function (req, res) {

    res.render("about.ejs", {page: 'undefined'});
});

router.post("/feedback", function (req, res) {

    //get data from form
    let name = req.body["name"];
    let email = req.body["email"];
    let message = req.body["message"];

    //prepare the message to send
    let smtpTransport = nodeMailer.createTransport({

        service: "Gmail",
        auth: {

            user: "projectcodechapel@gmail.com",
            pass: "123456CCC"
        }
    });

    let mailOptions = {

        to: "www.taymoor@gmail.com",
        from: "projectcodechapel@gmail.com",
        subject: "Feedback from CodeChapel.com",
        text: "Sender name: " + name + "\n" +
            "Sender email: " + email + "\n" +
            "Message: " + message
    };

    //send message to the website owner(ME)
    smtpTransport.sendMail(mailOptions, function (err) {

        if (!err) {

            req.flash("success", "Your feedback has been sent successfully");
            res.redirect("/about");

        } else {

            req.flash("error", err.message);
            res.redirect("/about");
        }
    });
});

//FORGOT PASSWORD REQUEST FORM ROUTE
router.get("/request-reset", function (req, res) {

    res.render("request_reset.ejs", {page: 'undefined'});
});

//FORGOT PASSWORD TOKEN/EMAIL ROUTE
router.post("/request-reset", function (req, res) {
    async.waterfall([

        function (done) {
            crypto.randomBytes(20, function (err, buf) {

                let token = buf.toString("hex");
                done(err, token);
            });
        },

        function (token, done) {

            User.findOne({email: req.body.email}, function (err, user) {

                if (!user) {

                    req.flash("error", "No account is associated with provided email");
                    return res.redirect("/request-reset");
                }

                user.resetPasswordToken = token;
                user.resetPasswordExpires = Date.now() + 3600000; //1 Hour
                user.save(function (err) {

                    done(err, token, user);
                });
            });
        },

        function (token, user, done) {

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
                subject: "CodeChapel.com password reset request",
                text: "You are receiving this email because you have requested to reset your password.\n" +
                    "Click on the following URL or paste it in your browser to complete your request.\n" +
                    "https://" + req.headers.host + "/reset-password/" + token + "\n\n" +
                    "If you did not request this, ignore this email and your password will remain unchanged"
            };

            smtpTransport.sendMail(mailOptions, function (err) {

                console.log("mail sent");
                req.flash("success", "An email has been sent to " + user.email + " with further instructions");
                done(err, "done");

            });
        }
    ], function (err) {

        if (err) {

            return next(err);
        }

        res.redirect("/request-reset");
    });
});

//SHOW RESET PASSWORD FORM ROUTE
router.get("/reset-password/:token", function (req, res) {

    User.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: {$gt: Date.now()}}, function (err, user) {

        if (!user) {

            req.flash("error", "Password reset token is invalid or has expired");
            return res.redirect("/request-reset");
        }

        res.render("reset_password.ejs", {token: req.params.token, page: 'undefined'});
    });
});

//UPDATE PASSWORD
router.post("/reset-password/:token", function (req, res) { 

    async.waterfall([
        function (done) {
            User.findOne({
                resetPasswordToken: req.params.token,
                resetPasswordExpires: {$gt: Date.now()}
            }, function (err, user) {

                if (!user) {

                    req.flash("error", "Password reset token is invalid or has expired");
                    return res.redirect("back");
                }
                if (req.body.password === req.body.confirm) {

                    user.setPassword(req.body.password, function (err) {

                        user.resetPasswordToken = undefined;
                        user.resetPasswordExpires = undefined;
                        user.save(function (error) {

                            req.logIn(user, function (err) {

                                done(err, user);
                            })
                        });
                    });
                } else {

                    req.flash("error", "Passwords do not match");
                    return res.redirect("back");
                }
            });
        },

        function (user, done) {

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
                subject: "Your password has been changed",
                text: "Hello!\n\n" +
                    "This is a confirmation that password for your account at CodeChapel.com has been changed"
            };

            smtpTransport.sendMail(mailOptions, function (err) {

                req.flash("success", "Your password has been updated successfully");
                done(err);
            });
        }
    ], function (err) {

        if (err) {

            req.flash("error", err.message);
            res.redirect("/articles");
        } else {

            res.redirect("/articles");
        }
    });
});

module.exports = router;