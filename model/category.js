const mongoose = require("mongoose");

const catagorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      maxlength: [50, "Name can not be more than 50 characters"],
    },

    images: {
      type: [String],
      default: [],
   
    },

    user: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },

  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);








module.exports = mongoose.model("Catagory", catagorySchema);


