const Order = require('../model/order');
const Product = require('../model/post');

const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const { checkPermissions } = require('../utils');

const fakeStripeAPI = async ({ amount, currency }) => {
  const client_secret = 'someRandomValue';
  return { client_secret, amount };
};

const createOrder = async (req, res) => {
  const { items: cartItems, encrypted_url,shippingFee} = req.body;

  const userId = req.user.userId;
  if (!userId) {
    throw new CustomError.BadRequestError('User not found');
  }

  if (!cartItems || cartItems.length < 1) {
    throw new CustomError.BadRequestError('No cart items provided');
  }

  // Fetch user's previous orders
  const userOrders = await Order.find({ user: userId });

  let orderItems = [];
  let subtotal = 0;

  for (const item of cartItems) {
    const dbProduct = await Product.findOne({ _id: item.product });
    if (!dbProduct) {
      throw new CustomError.NotFoundError(
        `No product with id : ${item.product}`
      );
    }

    // Check if the user has already ordered this product
    const productOrdered = userOrders.some(order =>
      order.orderItems.some(orderItem => orderItem.product.equals(dbProduct._id))
    );


    const { images, courseName, price, _id } = dbProduct;
    const singleOrderItem = {
      amount: item.amount, // Fixed amount to 1
      price,
      images,
      courseName,
      product: _id,
    };

    // add item to order
    orderItems.push(singleOrderItem);
    // calculate subtotal
    subtotal += item.amount * price; // Since amount is always 1, no need to multiply with amount
  }

  // calculate total
  const total = subtotal;
  // get client secret
  const paymentIntent = await fakeStripeAPI({
    amount: total,
    currency: 'usd',
  });

  // create the order with populated orderItems
  const order = await Order.create({
    orderItems,
    total,
    subtotal,
    clientSecret: paymentIntent.client_secret,
    encrypted_url,
    user: userId,
  });

  // Populate product details in orderItems
  await Order.populate(order, { path: 'orderItems.product' });

  // send the order details in the response
  res
    .status(StatusCodes.CREATED)
    .json({ order, clientSecret: order.clientSecret });
};


const getAllOrders = async (req, res) => {
  const orders = await Order.find({});
  res.status(StatusCodes.OK).json({ orders, count: orders.length });
};
const getSingleOrder = async (req, res) => {
  const { id: orderId } = req.params;
  const order = await Order.findOne({ _id: orderId });
  if (!order) {
    throw new CustomError.NotFoundError(`No order with id : ${orderId}`);
  }
  checkPermissions(req.user, order.user);
  res.status(StatusCodes.OK).json({ order });
};
const getCurrentUserOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user.userId });
  res.status(StatusCodes.OK).json({ orders, count: orders.length });
};
const updateOrder = async (req, res) => {
  const { id: orderId } = req.params;
  const { paymentIntentId } = req.body;

  const order = await Order.findOne({ _id: orderId });
  if (!order) {
    throw new CustomError.NotFoundError(`No order with id : ${orderId}`);
  }
  // checkPermissions(req.user, order.user);

  order.paymentIntentId = paymentIntentId;
  order.status = 'paid';
  await order.save();

  res.status(StatusCodes.OK).json({ order });
};

module.exports = {
  getAllOrders,
  getSingleOrder,
  getCurrentUserOrders,
  createOrder,
  updateOrder,
};
