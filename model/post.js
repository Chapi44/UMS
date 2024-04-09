const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      maxlength: [50, "Name can not be more than 50 characters"],
    },

    description: {
      type: [String],
    
    },
    images: {
      type: [String],
      default: [],
   
  },

  catagory: {
	type: [String]
  },
    user: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
    replies: [
			{
				userId: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "User",
					required: true,
				},
				text: {
					type: String,
					required: true,
				},
				pictures: {
					type:[ String],
				},
				username: {
					type: String,
				},
				likes: [
					{
					  type: mongoose.Schema.Types.ObjectId,
					  ref: "Like1",
					},
				  ],
          replies:[]
			},
		],
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);



ProductSchema.virtual("likes", {
  ref: "Like",
  localField: "_id",
  foreignField: "product",
  justOne: false,
});





module.exports = mongoose.model("Product", ProductSchema);


