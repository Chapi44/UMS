const express = require("express");
const paymentController = require("../controllers/paymentController");

const router = express.Router();
// Routes
router.get("/home", paymentController.home);
router.post("/notifier", paymentController.notifier);
router.get("/success/:orderID", paymentController.success);
router.post("/pay", paymentController.pay);

router.post("/chapa/pay", paymentController.chapa_pay);
router.get("/chapa/callback/:order_id/:reference", paymentController.chapa_callback);
router.post("/santim-pay/pay", paymentController.santim_pay_process_payment);
router.get("/santim-pay/callback", paymentController.santim_pay_callback);
router.post("/arif-pay/callback", paymentController.arif_pay_callback);



module.exports = router;
