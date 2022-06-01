let express = require("express"),
    router = express.Router(),
    Article = require("../models/article"),
    Category = require("../models/category"),
    middleware = require("../middleware/index");

//SHOW ALL ARTICLES
router.get("/", function (req, res) {

    //if there is a search query
    if (req.query.search) {

        const regex = new RegExp(escapeRegex(req.query.search), "gi");

        //get articles according to search query from database
        Article.find({title: regex}, function (error, articles) {

            if (error) {

                console.log("Error occurred while reading articles");

            } else {

                res.render("articles/index.ejs", {articles: articles, page: "search"});
            }
        });
    }

    //else show all articles
    else {

        //get all articles from database: sort by date
        Article.find({}).sort({createdAt: -1}).populate("category").exec(function (error, articles) {

            if (error) {

                console.log("Error occurred while reading articles");

            } else {

                res.render("articles/index.ejs", {articles: articles, page: "recent"});
            }
        });
    }
});

//SHOW NEW ARTICLES FORM
router.get("/new", middleware.isLoggedIn, function (req, res) {

    res.render("articles/new.ejs", {page: 'undefined'});
});

//ADD NEW ARTICLE TO DATABASE
router.post("/", middleware.isLoggedIn, function (req, res) {

    //get data from form
    let title = req.body["title"];
    let image = req.body["image"];
    let shortDescription = req.body["shortDescription"];
    let description = req.body["description"];
    let author = {id: req.user._id, username: req.user.username};
    let categoryName = req.body.category.toString();

    //sanitize the full description
    description = req.sanitize(description);

    let newArticle = {
        title: title,
        image: image,
        shortDescription: shortDescription,
        description: description,
        author: author
    };

    //add to articles database
    Article.create(newArticle, function (error, article) {

        if (error) {

            console.log("Error occurred while inserting new article");

        } else {

            //find the selected category
            Category.findOne({name: categoryName}, function (err, foundCategory) {

                if (err) {

                    console.log("Error occurred while associating the new article");
                } else {

                    //associate the category with article
                    article.category = foundCategory;
                    article.save();

                    //add the article to selected category
                    foundCategory.articles.push(article);
                    foundCategory.save();

                    //redirect to /articles
                    req.flash("success", "New article added successfully");
                    res.redirect("/articles");
                }
            });
        }
    });
});

//SHOW A PARTICULAR ARTICLE
router.get("/:id", function (req, res) {

    //find the article with provided ID
    let article_id = req.params.id;

    Article.findById(article_id).populate("comments").populate("category").exec(function (error, article) {

        if (error) {

            console.log("Error occurred while displaying the article");

        } else {

            //increase article's view count
            let viewCount = parseInt(article.views.toString());
            viewCount++;
            article.views = viewCount.toString();
            article.save();

            //get all articles related to the showing article
            article.category.populate("articles", function (err, category) {

                //render SHOW template with that article along with related articles
                res.render("articles/show.ejs", {
                    article: article,
                    relatedArticles: category.articles,
                    page: 'undefined'
                });
            });
        }
    });
});

//EDIT ARTICLE ROUTE
router.get("/:id/edit", middleware.checkArticleOwnership, function (req, res) {

    //find the article to edit
    Article.findById(req.params.id, function (err, article) {

        if (err) {

            req.flash("error", "Nothing found to edit");
            res.redirect("back");
        } else {
            //goto edit page with article to edit
            res.render("articles/edit.ejs", {article: article, page: 'undefined'});
        }
    });
});

//UPDATE ARTICLE ROUTE
router.put("/:id", middleware.checkArticleOwnership, function (req, res) {

    //sanitize the full description
    req.body.article.description = req.sanitize(req.body.article.description);

    //find the article
    Article.findByIdAndUpdate(req.params.id, req.body.article, function (err, updatedArticle) {

        if (err) {

            req.flash("error", err.message);
            res.redirect("back");

        } else {

            req.flash("success", "Article updated successfully");
            res.redirect("/articles/" + req.params.id);
        }
    });
});

//DESTROY ARTICLE ROUTE
router.delete("/:id", middleware.checkArticleOwnership, function (req, res) {

    Article.findByIdAndRemove(req.params.id, function (err) {

        if (err) {

            console.log(err);
            req.flash("error", "Nothing found to delete");
            res.redirect("/articles");

        } else {

            req.flash("success", "Article deleted successfully");
            res.redirect("/articles");
        }
    });
});

//SEARCH FUNCTION
function escapeRegex(text) {

    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

module.exports = router;