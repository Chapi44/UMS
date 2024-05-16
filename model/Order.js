const mongoose = require('mongoose');

const SingleOrderItemSchema = mongoose.Schema({


  product: {
    type: mongoose.Schema.ObjectId,
    ref: 'Product',
    required: true,
  },

});


const OrderSchema = mongoose.Schema(
    {
      subtotal: {
        type: Number,
        required: true,
      },
      total: {
        type: Number,
        required: true,
      },
      orderItems: [SingleOrderItemSchema],
      status: {
        type: String,
        enum: ['pending', 'failed', 'paid', 'delivered', 'canceled'],
        default: 'pending',
      },
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      encrypted_url:{
          type: String,
          // required: true,
      }
    },
    { timestamps: true }
  );
  
  module.exports = mongoose.model('Order', OrderSchema);