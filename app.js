const express = require("express");
const path = require("node:path");
const session = require("express-session");
const passport = require("passport");
const { PrismaSessionStore } = require("@quixo3/prisma-session-store");
const { PrismaClient } = require("@prisma/client");
const flash = require("connect-flash");

const app = express();

const indexRouter = require("./routes/indexRoutes");

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

const assetsPath = path.join(__dirname, "public");
app.use(express.static(assetsPath));

app.use(
  session({
    cookie: { maxAge: 3 * 60 * 60 * 1000 }, // 3 hours
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: new PrismaSessionStore(new PrismaClient(), {
      checkPeriod: 2 * 60 * 1000, //ms
      dbRecordIdIsSessionId: true,
      dbRecordIdFunction: undefined,
    }),
  })
);
app.use(flash());

//Need to require the entire auth.js module so app.js knows about it
require("./middleware/auth.js");
app.use(passport.session());

app.use(express.json());
app.use(express.urlencoded({ extended: true })); // parses form payloads and sets it to the `req.body`

app.use("/", indexRouter);
app.use((err, req, res, next) => {
  console.error(err.stack);
  //res.status(500).send("Something broke!");
  res.status(500).redirect(req.header("Referer"));
});

const PORT = 3000;
app.listen(PORT, () => console.log(`listening on port ${PORT}!`));
