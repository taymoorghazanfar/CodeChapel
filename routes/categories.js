let express = require("express"),
    router = express.Router(),
    Category = require("../models/category");

//SHOW ALL ARTICLES OF A PARTICULAR CATEGORY
router.get("/:id/articles", function (req, res) {

    let category_id = req.params.id;

    //find the particular category that was clicked
    Category.findById(category_id).populate("articles").exec(function (error, category) {

        console.log("cat name: " + category.name);

        if (error) {

            console.log("Error occurred while displaying the category articles");

        } else {

            //render SHOW template with all the articles of that category
            res.render("categories/index.ejs", {articles: category.articles, page: category.name});
        }
    });
});

module.exports = router;