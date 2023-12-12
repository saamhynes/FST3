if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const express = require("express");
const bcrypt = require("bcrypt");
const passport = require("passport");
const localStrategy = require("passport-local").Strategy;
const flash = require("express-flash");
const session = require("express-session");
const methodOverride = require("method-override");
const uuid = require("uuid");
//const logins = require('./services/p.logins.dal') // use POSTGRESQL dal
const logins = require("./services/p.logins.dal.js"); // use MONGODB dal
const app = express();
const PORT = process.env.PORT || 3000;
global.DEBUG = true;
passport.use(
  new localStrategy(
    { usernameField: "email" },
    async (email, password, done) => {
      let user = await logins.getLoginByEmail(email);
      if (user == null) {
        return done(null, false, { message: "No user with that email." });
      }
      try {
        if (await bcrypt.compare(password, user.password)) {
          return done(null, user);
        } else {
          return done(null, false, {
            message: "Incorrect password was entered.",
          });
        }
      } catch (error) {
        return done(error);
      }
    }
  )
);

// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.
passport.serializeUser((user, done) => {
  done(null, user.id); // Assuming user has an 'id' property
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await logins.getLoginById(id);
    done(null, user); // Assuming you retrieve the user object based on its id
  } catch (error) {
    done(error, null);
  }
});

app.set("view-engine", "ejs");
app.use(express.urlencoded({ extended: false }));
app.use(flash());
app.use(
  session({
    secret: "keyboardcat",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride("_method"));

// Passport checkAuthenticated() middleware.
// For every route we check the person is logged in. If not we send them
// to the login page
app.get("/", checkAuthenticated, (req, res) => {
  res.render("index.ejs", { name: req.user.username });
});

app.get("/sample1", checkAuthenticated, (req, res) => {
  res.render("sql.db.ejs");
});
app.get("/sample2", checkAuthenticated, (req, res) => {
  res.render("mongo.db.ejs");
});

async function getUser(userId) {
  // Implementation depends on your data source
  // This is just a placeholder
  return {
    name: "John Doe",
    email: "john.doe@example.com",
    hobbies: ["Reading", "Coding", "Hiking"],
  };
}
app.get("/profile/:userId", checkAuthenticated, async (req, res) => {
  const user = await getUser(req.params.userId);
  res.render("both.db.ejs", { user });
});

app.get("/query/:word", checkAuthenticated, async (req, res) => {
  const results = await logins.findByQuery(req.params.word);
  res.json(results);
});

// Passport checkNotAuthenticated() middleware.
// This middleware is only for the login and register. If someone stumbles
// upon these routes they only need access if they are NOT authenticated.
app.get("/login", checkNotAuthenticated, (req, res) => {
  res.render("login.ejs");
});
app.post(
  "/login",
  checkNotAuthenticated,
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true,
  })
);
app.get("/register", checkNotAuthenticated, (req, res) => {
  res.render("register.ejs");
});
app.post("/register", checkNotAuthenticated, async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    let result = await logins.addLogin(
      req.body.name,
      req.body.email,
      hashedPassword,
      uuid.v4()
    );
    res.redirect("/login");
  } catch (error) {
    console.log(error);
    res.redirect("/register");
  }
});

app.delete("/logout", function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/login");
  });
});

function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
}
function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect("/");
  }
  return next();
}

app.listen(PORT, (err) => {
  if (err) console.log(err);
  console.log(`Passport app running on port ${PORT}.`);
});
