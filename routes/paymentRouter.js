const express = require("express");
const router = express.Router();

const paymentController1 = require("../controllers/Pay");


router.post("/chapa/pay", paymentController1.payment);




module.exports = router;
