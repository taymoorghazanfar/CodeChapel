let mongoose = require("mongoose");

let categorySchema = new mongoose.Schema({

    name: String,
    articles: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Article"
        }
    ],
});

let Category = mongoose.model("Category", categorySchema);

module.exports = Category;