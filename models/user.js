let mongoose = require("mongoose"),
    passportLocalMongoose = require("passport-local-mongoose"),
    uniqueValidator = require("mongoose-unique-validator");

let userSchema = mongoose.Schema({

    fullName: String,
    phone: String,
    email: {type: String, unique: true},
    avatar: String,
    username: String,
    password: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date

});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(uniqueValidator);

let User = mongoose.model("User", userSchema);

module.exports = User;