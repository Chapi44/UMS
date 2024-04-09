const express = require("express");
const router = express.Router();
const authcontroller = require("../controllers/authController");

router.post(
  "/register",
 authcontroller.register
);
router.post("/login", authcontroller.signin);

router.post('/reguser', authcontroller.registerUser);
router.post("/forgot-password", authcontroller.forgotPassword);
router.post("/reset-password", authcontroller.ResetPassword);

module.exports = router;
