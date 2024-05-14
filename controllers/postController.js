const Product = require("../model/post");
const Like = require("../model/like");
const Catagory= require("../model/category");
const { StatusCodes } = require("http-status-codes");
const CustomError = require("../errors");
const path = require("path");
const fs = require('fs')
const baseURL = process.env.BASE_URL;

const createposts = async (req, res) => {
  try {
    const { name, description,catagory,color,price } = req.body;

    // Construct image paths with base URL
    const pictures = req.files.map(file => baseURL + "/uploads/posts/" + file.filename);

    // Use req.userId obtained from the decoded token
    const userId = req.user.userId;
    console.log(userId);

    const newPost = await Product.create({
      name,
      catagory,
      description,
      images: pictures,
      color,
      price,
      user: userId, // Assign userId to the user field
    
    });

    // Check if userId is missing
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    res.status(StatusCodes.CREATED).json({ post: newPost });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
  }
};

const createcatagories = async (req, res) => {
  try {
    const { name } = req.body;

    // Construct image paths with base URL
    const pictures = req.files.map(file => baseURL + "/uploads/posts/" + file.filename);

    // Use req.userId obtained from the decoded token
    const userId = req.user.userId;
    console.log(userId);

    const newPost = await Catagory.create({
      name,
     
      images: pictures,
      
      user: userId, // Assign userId to the user field
    
    });

    // Check if userId is missing
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    res.status(StatusCodes.CREATED).json({ post: newPost });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
  }
};


const getAllposts = async (req, res) => {
  try {
    const products = await Product.find({})
      .populate({
        path: "user",
        select: "name username pictures" // Specify the fields you want to include
      })
      .populate({ 
        path: "likes", 
        populate: { 
          path: "user", 
          select: "username pictures" // Include username and pictures of the user who liked
        } 
      })
      .lean(); // Convert Mongoose documents to plain JavaScript objects

    // Calculate the number of replies and likes for each post
    products.forEach(post => {
      post.repliesCount = post.replies.length;
      post.likesCount = post.likes.length;

      // Calculate the number of likes for each reply
      post.replies.forEach(reply => {
        reply.likesCount = reply.likes.length;
      });
    });

    res.status(StatusCodes.OK).json({ products });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

const getSinglepost = async (req, res) => {
  try {
    const { id: productId } = req.params;

    const product = await Product.findOne({ _id: productId })
      .populate({
        path: "user",
        select: "name username pictures" // Specify the fields you want to include
      })
      .populate({ 
        path: "likes", 
        populate: { 
          path: "user", 
          select: "username pictures" // Include username and pictures of the user who liked
        } 
      })
      .lean(); // Convert Mongoose document to plain JavaScript object

    if (!product) {
      throw new CustomError.NotFoundError(`No product with id : ${productId}`);
    }

    // Calculate the number of replies and likes for the single post
    product.repliesCount = product.replies.length;
    product.likesCount = product.likes.length;

    // Calculate the number of likes for each reply
    product.replies.forEach(reply => {
      reply.likesCount = reply.likes.length;
    });

    res.status(StatusCodes.OK).json({ product });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};



const updatepostbyid = async (req, res) => {
  try {
    const { id: productId } = req.params;

    // Find the post by ID
    const updatedPost = await Product.findById(productId);

    if (!updatedPost) {
      return res.status(StatusCodes.NOT_FOUND).json({ error: "Post not found" });
    }

    // Ensure that the user is the creator of the post
    if (updatedPost.user.toString() !== req.user.userId) {
      console.log(req.userId);
      return res.status(StatusCodes.FORBIDDEN).json({ error: "You are not authorized to update this post" });
    }

    // Update post properties if available
    if (req.body.name) {
      updatedPost.name = req.body.name;
    }
    if (req.body.description) {
      updatedPost.description = req.body.description;
    }
    if (req.body.category) {
      updatedPost.catagory = req.body.category;
    }

    // Handle image update if available
    if (req.files && req.files.length > 0) {
      // Delete previous images
      if (updatedPost.images && updatedPost.images.length > 0) {
        updatedPost.images.forEach((image) => {
          // Extract filename from the URL
          const filename = image.split("/").pop();
          const imagePath = path.join(__dirname, "..", "uploads", "posts", filename);
          try {
            if (fs.existsSync(imagePath)) {
              fs.unlinkSync(imagePath);
              console.log(`Deleted previous image: ${imagePath}`);
            } else {
              console.log(`Previous image not found: ${imagePath}`);
            }
          } catch (error) {
            console.error(`Error deleting previous image: ${imagePath}`, error);
          }
        });
      }

      // Save new images
      updatedPost.images = req.files.map((file) => baseURL + "/uploads/posts/" + file.filename);
    }

    // Save the updated post
    await updatedPost.save();

    res.status(StatusCodes.OK).json({ message: "Post updated successfully", post: updatedPost });
  } catch (error) {
    console.error("Error updating post by ID:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Internal server error" });
  }
};

const deletepostbyid = async (req, res) => {
  const productId = req.params.id;
  const userId = req.userId;

  try {
    // Find the product by ID
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(StatusCodes.NOT_FOUND).json({ error: "Product not found" });
    }

    // Check if the user is the author of the post
    const isCreator = product.user.toString() === userId;

    if (!isCreator) {
      return res.status(StatusCodes.FORBIDDEN).json({ error: "You are not allowed to delete this post", isCreator: isCreator });
    }

    // Delete the post
    const result = await Product.deleteOne({ _id: productId });

    if (result.deletedCount === 0) {
      throw new CustomError.NotFoundError(`No product with id : ${productId}`);
    }

    res.status(StatusCodes.OK).json({ msg: "Success! Post is removed.", isCreator: isCreator });
  } catch (error) {
    console.error("Error deleting post by ID:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Internal server error" });
  }
};

const likeProduct = async (req, res) => {
  try {
    const { id: productId } = req.params;
    const userId = req.user.userId;

    // Check if the user has already liked the product
    const existingLike = await Like.findOne({
      user: userId,
      product: productId,
    });

    let totalLikes;

    if (existingLike) {
      // User has already liked the product, so unlike it
      await Like.deleteOne({
        user: userId,
        product: productId,
      });

      // Decrement the like count in the Product model
      const product = await Product.findByIdAndUpdate(
        productId,
        { $inc: { numOfLikes: -1 } },
        { new: true }
      );

      totalLikes = product.numOfLikes;

      res
        .status(StatusCodes.OK)
        .json({ message: "Product unliked successfully", totalLikes });
    } else {
      // User hasn't liked the product, so like it
      const like = new Like({ user: userId, product: productId });
      await like.save();

      // Increment the like count in the Product model
      const product = await Product.findByIdAndUpdate(
        productId,
        { $inc: { numOfLikes: 1 } },
        { new: true }
      );

      totalLikes = product.numOfLikes;

      res
        .status(StatusCodes.OK)
        .json({ message: "Product liked successfully", totalLikes });
    }
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({ error: error.message });
  }
};

const replyToPost = async (req, res) => {
  try {
    const { text } = req.body;
    const postId = req.params.id;
    const userId = req.user.userId;
    const pictures = req.user.pictures;
    const username = req.user.username;

    if (!text) {
      return res.status(400).json({ error: "Text field is required" });
    }

    const post = await Product.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Create a reply object
    const reply = { userId, text, pictures, username };

    // Push the reply to the post's replies array
    post.replies.push(reply);

    // Save the updated post
    await post.save();

    res.status(200).json(reply);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


const replyToReply = async (req, res) => {
  try {
    const { text, replyId, postId } = req.body; // Extracting postId from the request body
    const userId = req.userId;
    const pictures = req.user.pictures;
    const username = req.user.username;

    if (!text || !postId) { // Checking if text and postId are provided
      return res.status(400).json({ error: "Text and postId fields are required" });
    }

    const post = await Product.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const parentReply = post.replies.find(reply => reply._id.toString() === replyId);
    if (!parentReply) {
      return res.status(404).json({ error: "Parent reply not found" });
    }

    // Create a reply object
    const reply = { userId, text, pictures, username, replies: [] };

    // Push the reply to the parent reply's nested replies array
    parentReply.replies.push(reply);

    // Save the updated post
    await post.save();

    res.status(200).json(reply);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



const likeOrUnlikeReply = async (req, res) => {
  try {
    const { productId, replyId } = req.params;
    const userId = req.userId;
    console.log(userId);

    // Find the product by its ID
    const product = await Product.findById(productId);
    if (!product) {
      throw new CustomError.NotFoundError('Product not found');
    }

    // Find the reply within the product's replies array
    const replyIndex = product.replies.findIndex(reply => reply._id.toString() === replyId);
    if (replyIndex === -1) {
      throw new CustomError.NotFoundError('Reply not found');
    }

    const reply = product.replies[replyIndex];

    // Check if the user has already liked the reply
    const existingLikeIndex = reply.likes.findIndex(like => like.toString() === userId);
    const userLikedReply = existingLikeIndex !== -1;

    if (userLikedReply) {
      // User has already liked the reply, so unlike it
      reply.likes.splice(existingLikeIndex, 1);
      await product.save();

      // Calculate total number of likes for the reply
      const totalLikes = reply.likes.length;

      res.status(StatusCodes.OK).json({ message: 'Reply unliked successfully', totalLikes });
    } else {
      // User hasn't liked the reply, so like it
      reply.likes.push(userId);
      await product.save();

      // Calculate total number of likes for the reply
      const totalLikes = reply.likes.length;

      res.status(StatusCodes.OK).json({ message: 'Reply liked successfully', totalLikes });
    }
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};



module.exports = {
  createposts,
  getAllposts,
  getSinglepost,
  updatepostbyid,
  deletepostbyid,
  likeProduct,
  replyToPost,
  likeOrUnlikeReply,
  replyToReply,
  createcatagories

};

