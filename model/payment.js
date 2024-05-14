const mongoose = require("mongoose");

// Define address schema
const addressSchema = new mongoose.Schema({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String },
  postalCode: { type: String, required: true },
  country: { type: String, required: true },
});

// Define payment schema
const paymentSchema = new mongoose.Schema({
  transactionID: { type: String, required: true, unique: true },
  paymentGatewayResponse: { type: Object, required: true },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, required: true },
  paymentMethod: { type: String, required: true },
  customerID: { type: String, required: true },
  customerName: { type: String },
  emailAddress: { type: String },
  transactionDateTime: { type: Date, default: Date.now },
  orderID: { type: String },
  productDetails: { type: String },
  billingAddress: { type: addressSchema, required: true },
  shippingAddress: { type: addressSchema },
  additionalMetadata: { type: Object },
  status: { type: String },
});

const Payment = mongoose.model("Payment", paymentSchema);

module.exports = Payment;
