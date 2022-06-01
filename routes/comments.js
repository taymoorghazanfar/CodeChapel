let express = require("express"),
    router = express.Router({mergeParams: true}),
    Article = require("../models/article"),
    Comment = require("../models/comment"),
    User = require("../models/user"),
    middleware = require("../middleware/index"),
    nodeMailer = require("nodemailer");

//*********************COMMENT ROUTES**********************//

//SHOW NEW COMMENT FORM ROUTE
router.get("/new", middleware.isLoggedIn, function (req, res) {

    //find the articles by id
    Article.findById(req.params.id, function (err, campground) {

        if (err) {

            console.log("Error occurred");
        } else {

            //render the new comment form
            res.render("comment/new.ejs", {article: campground, page: 'undefined'});
        }
    });
});

//ADD THE COMMENT TO PARTICULAR ARTICLE
router.post("/", middleware.isLoggedIn, function (req, res) {

    //find the article using id
    Article.findById(req.params.id, function (err, article) {

        if (err) {

            console.log("Error occurred");
            req.flash("error", "Internal error occurred");
            res.redirect("/articles");
        } else {

            //create new comment
            Comment.create(req.body["comment"], function (err, comment) {

                if (err) {

                    console.log("Error occurred");
                    req.flash("error", "Internal error occurred");
                    res.redirect("/articles");
                } else {

                    //add author name and id to comment and save to database
                    comment.author.id = req.user._id;
                    comment.author.username = req.user.username;
                    comment.save();

                    //associate comment with the article
                    article["comments"].push(comment);
                    article.save();

                    //find the author of the article
                    User.findById(article.author.id, function (err, author) {

                        if (!err) {

                            //notify the author of the article about the comment
                            let smtpTransport = nodeMailer.createTransport({

                                service: "Gmail",
                                auth: {

                                    user: "projectcodechapel@gmail.com",
                                    pass: "123456CCC"
                                }
                            });

                            let mailOptions = {

                                to: author.email,
                                from: "projectcodechapel@gmail.com",
                                subject: "New comment on your article at CodeChapel.com",
                                text: "Your article '" + article.title + "' has a new comment. check below:\n\n" +
                                    "'" + comment.author.username + "' says: "
                                    + comment.text
                            };

                            smtpTransport.sendMail(mailOptions, function (err) {

                                if (!err) {

                                    console.log("mail sent");
                                } else {

                                    console.log("Error while sending the mail");
                                }
                            });
                        }
                    });

                    //redirect back to the show article
                    req.flash("success", "Successfully added your comment");
                    res.redirect("/articles/" + req.params.id);
                }
            });
        }
    });
});

//SHOW EDIT COMMENT FORM ROUTE
router.get("/:comment_id/edit", middleware.checkCommentOwnership, function (req, res) {

    //find the comment to edit
    Comment.findById(req.params.comment_id, function (err, comment) {

        if (err) {

            console.log(err);
            req.flash("error", "Internal error occurred");
            res.redirect("back");
        } else {

            //goto edit comment page with articles id and comment to be edited
            res.render("comment/edit.ejs", {article_id: req.params.id, comment: comment, page: 'undefined'});
        }
    });
});

//UPDATE THE COMMENT ROUTE
router.put("/:comment_id", middleware.checkCommentOwnership, function (req, res) {

    //update the comment in database
    Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function (err, updatedComment) {

        if (err) {

            console.log(err);
            req.flash("error", "Internal error occurred");
            res.redirect("back");
        } else {

            //go back to show page
            req.flash("success", "Comment updated successfully");
            res.redirect("/articles/" + req.params.id);
        }
    });
});

//COMMENT DESTROY ROUTE
router.delete("/:comment_id", middleware.checkCommentOwnership, function (req, res) {

    //find the comment by id
    Comment.findByIdAndRemove(req.params.comment_id, function (err) {

        if (err) {

            console.log(err);
            req.flash("error", "Internal error occurred");
            res.redirect("back");
        } else {

            //reload show articles page
            req.flash("success", "Comment deleted successfully");
            res.redirect("/articles/" + req.params.id);
        }
    });
});

module.exports = router;