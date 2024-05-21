const { Chapa } = require("chapa-nodejs");
const Order = require("../model/order"); // Import Order model
const User = require("../model/user");
const request = require("request");

const chapa = new Chapa({
  secretKey: "CHASECK_TEST-P26zh5kcYwPGnWKWXsFMvt8IFagTlDAw",
});

const generateTransactionReference = async () => {
  // Generate or fetch your Transaction Reference
  const tx_ref = await chapa.generateTransactionReference({
    prefix: "KU", // defaults to `TX`
    size: 20, // defaults to `15`
  });
  return tx_ref;
};

const payment = async (req, res) => {
  const { order_id } = req.body;

  // Fetch the order details from the database
  const order = await Order.findById(order_id);

  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }

  const user = await User.findById(order.user);
  const tx_ref = await generateTransactionReference();

  const options = {
    method: "POST",
    url: "https://api.chapa.co/v1/transaction/initialize",
    headers: {
      Authorization: "Bearer CHASECK_TEST-P26zh5kcYwPGnWKWXsFMvt8IFagTlDAw",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: order.total,
      currency: "ETB",
      email: "abebech_bekele@gmail.com",
      first_name: user.fullname,
      last_name: user.fullname,
      phone_number: "0900112233",
      tx_ref: tx_ref,
      callback_url: "https://webhook.site/077164d6-29cb-40df-ba29-8a00e59a7e60",
      return_url: "https://mtuniformsolution.com/",
      customization: {
        title: "Payment",
        description: "I love",
      },
    }),
  };

  request(options, (error, response) => {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.status(response.statusCode).json(JSON.parse(response.body));
  });
};

module.exports = {
  payment,
};
