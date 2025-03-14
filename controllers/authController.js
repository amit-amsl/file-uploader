const asyncHandler = require("express-async-handler");
const passport = require("passport");
const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const userSignUpGET = [
  (req, res, next) => {
    if (req.isAuthenticated()) {
      res.redirect("/");
    }
    next();
  },
  asyncHandler(async (req, res) => {
    res.render("signup", {
      title: "Sign up page",
    });
  }),
];

const userSignUpPOST = [
  body("username")
    .trim()
    .isLength({ min: 5, max: 15 })
    .withMessage("Username must be between 5 and 15 characters")
    .isAlphanumeric()
    .withMessage("Username must only contain alphanumeric characters")
    .custom(async (value) => {
      const username = await prisma.user.findUnique({
        where: {
          username: value,
        },
      });
      if (username) {
        throw new Error("Username already in use");
      }
    }),
  body("password")
    .trim()
    .isLength({ min: 8 })
    .withMessage("Password must have at least 8 characters"),
  body("confirm_password")
    .custom((value, { req }) => {
      return value === req.body.password;
    })
    .withMessage("Password confirmation isnt the same as the password"),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.render("signup", {
        title: "Sign up page",
        errors: errors.array(),
      });
      return;
    }
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const createUser = await prisma.user.create({
      data: {
        username: username,
        password_hash: hashedPassword,
      },
    });
    res.redirect("/login");
  }),
];

const userLogInGET = [
  (req, res, next) => {
    if (req.isAuthenticated()) {
      res.redirect("/");
    }
    next();
  },
  asyncHandler(async (req, res) => {
    const logInError = req.flash("error");
    res.render("login", {
      title: "Login page",
      error: logInError,
    });
  }),
];

const userLogInPOST = [
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true,
  }),
];

const userLogOutGET = (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
};

module.exports = {
  userSignUpGET,
  userSignUpPOST,
  userLogInGET,
  userLogInPOST,
  userLogOutGET,
};
