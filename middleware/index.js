// all the middleware goes here
let Article     = require("../models/article"),
    Comment     = require("../models/comment"),
    User        = require("../models/user");

let middlewareObject = {};

//ARTICLE OWNERSHIP MIDDLEWARE
middlewareObject.checkArticleOwnership = function (req, res, next) {

    //check if user is logged in
    if (req.isAuthenticated()) {

        //find the article to edit
        Article.findById(req.params.id, function (error, article) {

            if (error) {

                req.flash("error", "Internal error occurred");
                res.redirect("back");

            } else {

                //does the user own the article
                if (article.author.id.equals(req.user._id)) {

                    //goto edit page with article to edit
                    next();

                } else {

                    req.flash("error", "Permission denied");
                    res.redirect("back");
                }
            }
        });
    }
    //else redirect
    else {

        req.flash("error", "You must be logged in first");
        res.redirect("back");
    }
}

//COMMENT OWNERSHIP MIDDLEWARE
middlewareObject.checkCommentOwnership = function (req, res, next) {

    //check if user is logged in
    if (req.isAuthenticated()) {

        //find the articles to edit
        Comment.findById(req.params.comment_id, function (error, comment) {

            if (error) {

                req.flash("error", "Nothing found to edit");
                res.redirect("back");

            } else {

                //does the user own the comment
                if (comment.author.id.equals(req.user._id)) {

                    //goto edit page with comment to edit/delete
                    next();
                } else {

                    req.flash("error", "Permission denied");
                    res.redirect("back");
                }
            }
        });
    }
    //else redirect
    else {

        req.flash("error", "You must be logged in first");
        res.redirect("back");
    }
}

//PROFILE OWNERSHIP MIDDLEWARE
middlewareObject.checkProfileOwnership = function (req, res, next) {

    //check if user is logged in
    if (req.isAuthenticated()) {

        //find the user to edit
        User.findById(req.params.id, function (error, user) {

            if (error) {

                req.flash("error", "Nothing found to edit");
                res.redirect("back");

            } else {

                //does the user own the comment
                if (user._id.equals(req.user._id)) {

                    //goto edit page with profile to edit/delete
                    next();

                } else {

                    req.flash("error", "Permission denied");
                    res.redirect("back");
                }
            }
        });
    }
    //else redirect
    else {

        req.flash("error", "You must be logged in first");
        res.redirect("back");
    }
}

//IS USER LOGGED IN MIDDLEWARE
middlewareObject.isLoggedIn = function (req, res, next) {

    if (req.isAuthenticated()) {

        return next();
    }

    req.flash("error", "You must be logged in first");
    res.redirect("/users/login");
}


module.exports = middlewareObject;