const express = require('express');
const router = express.Router();
const Cart = require('../model/Cart');
const Product = require('../model/post');
const { StatusCodes } = require('http-status-codes');
// Middleware to get user ID from the token
const { authenticateUser } = require('../middleware/authentication');

// Add to cart
router.post('/', authenticateUser, async (req, res) => {
    const { productId, quantity } = req.body;
    const userId = req.user.userId;
  
    try {
      let cart = await Cart.findOne({ user: userId });
  
      if (!cart) {
        cart = await Cart.create({ user: userId, items: [] });
      }
  
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(StatusCodes.NOT_FOUND).json({ error: 'Product not found' });
      }
  
      const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);
  
      if (itemIndex > -1) {
        cart.items[itemIndex].quantity = quantity;
      } else {
        cart.items.push({ product: productId, quantity });
      }
  
      // Calculate subtotal
      let subtotal = 0;
      for (const item of cart.items) {
        const product = await Product.findById(item.product);
        subtotal += item.quantity * product.price;
      }
      cart.subtotal = subtotal;
  
      await cart.save();
      res.status(StatusCodes.OK).json(cart);
    } catch (error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
    }
  });
// View cart
router.get('/', authenticateUser, async (req, res) => {
    const userId = req.user.userId;
  
    try {
      const cart = await Cart.findOne({ user: userId }).populate('items.product');
      if (!cart) {
        return res.status(StatusCodes.NOT_FOUND).json({ error: 'Cart not found' });
      }
  
      // Calculate subtotal
      let subtotal = 0;
      for (const item of cart.items) {
        subtotal += item.quantity * item.product.price;
      }
      cart.subtotal = subtotal;
  
      res.status(StatusCodes.OK).json(cart);
    } catch (error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
    }
  });



// Update cart item
router.put('/', authenticateUser, async (req, res) => {
  const { productId, quantity } = req.body;
  const userId = req.user.userId;

  try {
    const cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!cart) {
      return res.status(StatusCodes.NOT_FOUND).json({ error: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);
    if (itemIndex > -1) {
      if (quantity <= 0) {
        cart.items.splice(itemIndex, 1);
      } else {
        cart.items[itemIndex].quantity = quantity;
      }
    } else {
      return res.status(StatusCodes.NOT_FOUND).json({ error: 'Product not in cart' });
    }

    // Calculate subtotal
    let subtotal = 0;
    cart.items.forEach(item => {
      subtotal += item.quantity * item.product.price;
    });
    cart.subtotal = subtotal;

    await cart.save();
    res.status(StatusCodes.OK).json(cart);
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
  }
});


// Remove cart item
router.delete('/cart', authenticateUser, async (req, res) => {
    const { productId } = req.body;
    const userId = req.user.userId;
  
    try {
      const cart = await Cart.findOne({ user: userId }).populate('items.product');
      if (!cart) {
        return res.status(StatusCodes.NOT_FOUND).json({ error: 'Cart not found' });
      }
  
      const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);
      if (itemIndex > -1) {
        cart.items.splice(itemIndex, 1);
      } else {
        return res.status(StatusCodes.NOT_FOUND).json({ error: 'Product not in cart' });
      }
  
      // Calculate subtotal
      let subtotal = 0;
      cart.items.forEach(item => {
        subtotal += item.quantity * item.product.price;
      });
      cart.subtotal = subtotal;
  
      await cart.save();
      res.status(StatusCodes.OK).json(cart);
    } catch (error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
    }
  });
  

module.exports = router;
