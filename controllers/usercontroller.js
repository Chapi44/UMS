const User = require("../model/user");
const CustomError = require("../errors"); 
const { StatusCodes } = require("http-status-codes");
const { createTokenUser, attachCookiesToResponse } = require("../utils");

require("dotenv").config();
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
};

const getUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
};
const deleteuser = async (req, res) => {
  try {
    const { id } = req.params;
    const finduser = await User.findByIdAndDelete({ _id: id });
    if (!finduser) {
      return res.status(400).json({ error: "no such user found" });
    }
    return res.status(200).json({ message: "deleted sucessfully" });
  } catch (error) {
    res.status(500).json({ error: "something went wrong" });
  }
};

const updateUser = async (req, res) => {
  try {
    const userId = req.user.userId;
    let updatedUser = await User.findById(userId);

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update name, bio, and username if available
    if (req.body.name) updatedUser.name = req.body.name;  
    if (req.body.bio) updatedUser.bio = req.body.bio;
    if (req.body.username) updatedUser.username = req.body.username;
    if(req.body.profession) updatedUser.profession = req.body.profession;

    // Update email if available and validate format
    if (req.body.email) {
      const emailAlreadyExists = await User.findOne({ email: req.body.email });
      if (emailAlreadyExists) {
        return res.status(400).json({ error: "Email already exists" });
      }
      updatedUser.email = req.body.email;
    }

    // Update password if available
    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      updatedUser.password = await bcrypt.hash(req.body.password, salt);
    }

    // Handle pictures update if available
    if (req.files && req.files.length > 0) {
      const newPictures = req.files.map(
        (file) => `${process.env.BASE_URL}/uploads/profile/${file.filename}`
      );
      updatedUser.pictures = newPictures;
    }

    await updatedUser.save();

    // Respond with updated user data (excluding password)
    res.status(200).json({
      message: "User updated successfully",
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        username: updatedUser.username,
        bio: updatedUser.bio,
        pictures: updatedUser.pictures,
        profession:updatedUser.profession
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateUserPassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    throw new CustomError.BadRequestError("Please provide both values");
  }
  const user = await User.findOne({ _id: req.user.userId });

  const isPasswordCorrect = await user.comparePassword(oldPassword);
  if (!isPasswordCorrect) {
    throw new CustomError.UnauthenticatedError("Invalid Credentials");
  }
  user.password = newPassword;

  await user.save();
  res.status(StatusCodes.OK).json({ msg: "Success! Password Updated." });
};

const deleteAllUsers = async (req, res) => {
  try {
    console.log("Before deleting all users");
    const result = await User.deleteMany ({});
    console.log("After deleting all users", result);

    res.status(200).json({ message: "All users deleted successfully" });
  } catch (error) {
    console.error("Error deleting all users:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


const searchUserByUsername = async (req, res) => {
  try {
    let { username, fullname } = req.query;

    if (!username && !fullname) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: "Username or fullname parameter is required" });
    }

    let query = {};

    if (username) {
      query.username = { $regex: new RegExp(username, "i") }; // Search by username
    }

    if (fullname) {
      query.name = { $regex: new RegExp(fullname, "i") }; // Search by fullname
    }

    // Search users by username or fullname using case-insensitive regex
    const users = await User.find(query)
      .select("name username bio profession pictures email role");

    res.status(StatusCodes.OK).json(users);
  } catch (error) {
    console.error("Error searching user by username or fullname:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Internal server error" });
  }
};


module.exports = {
 getAllUsers,
getUserById,
  deleteuser,
  updateUser,
  deleteAllUsers,
  updateUserPassword,
  searchUserByUsername
};
