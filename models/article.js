let mongoose = require("mongoose");

let articleSchema = new mongoose.Schema({

    title: String,
    image: String,
    shortDescription: String,
    description: String,
    createdAt: {type: Date, default: Date.now()},
    views: {type: String, default: "0"},
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category"
    },
    comments: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment"
        }
    ],
    author: {
        id: {

            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    }
});

let Article = mongoose.model("Article", articleSchema);

module.exports = Article;