let offline = true;

// app setup
let express = require("express"),
    mongoose = require("mongoose"),
    bodyParser = require("body-parser"),
    User = require("./models/user"),
    Category = require("./models/category"),
    moment = require("moment"),
    passport = require("passport"),
    LocalStrategy = require("passport-local"),
    expressSession = require("express-session"),
    methodOverride = require("method-override"),
    flash = require("connect-flash"),
    sanitizer = require("express-sanitizer"),
    app = express();

//ROUTES
let indexRoutes = require("./routes/index"),
    userRoutes = require("./routes/users"),
    articleRoutes = require("./routes/articles"),
    categoryRoutes = require("./routes/categories"),
    commentRoutes = require("./routes/comments");

//safer way to declare directories. todo: use ===> __direname
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(sanitizer());
app.use(methodOverride("_method"));
app.use(flash());

//setup moments
app.locals.moment = moment;

//PASSPORT CONFIG***********************************************************
app.use(expressSession({

    secret: "Lau ji ghauri aya fir",
    resave: false,
    saveUninitialized: false

}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//**************************************************************************

mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);

//online connection string
let connection_url_online = "mongodb+srv://taymoor:582693tay@codechapel.aycjp.mongodb.net/codechapel?retryWrites=true&w=majority";

//offline connection string
let connection_url_offline = "mongodb://localhost/code_chapel";

if (offline) {
    mongoose.connect(connection_url_offline, {useNewUrlParser: true, useUnifiedTopology: true});
} else {
    mongoose.connect(connection_url_online, {useNewUrlParser: true, useUnifiedTopology: true});
}

//get all categories
let allCategories;

Category.find({}, function (error, categories) {

    allCategories = categories;
})

//to include logged in user on every route/file
app.use(function (req, res, next) {

    res.locals.currentUser = req["user"];
    res.locals.categories = allCategories;
    //include error/success messages on every route/file
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();

});

//config routes
app.use("/", indexRoutes);
app.use("/users", userRoutes);
app.use("/articles", articleRoutes);
app.use("/categories", categoryRoutes);
app.use("/articles/:id/comments", commentRoutes);

// start the server
if (offline) {

    app.listen(3000, function () {

        console.log("Server is running");
    });

} else {
    app.listen(process.env.PORT, process.env.IP);
}
