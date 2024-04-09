const express = require("express");
const {
  getAllUsers,
  getUserById,
  deleteuser,
  updateUser,
  searchUserByUsername,
  updateUserPassword,

} = require("../controllers/usercontroller");
const {
  authenticateUser,
} = require("../middleware/authentication");

const multerMiddleware = require("../middleware/multerSetup");

const router = express.Router();

router.get(
  "/getallusers",
  getAllUsers
);

router.get(
  "/getuserById/:id",
  getUserById
);
router.post(
  "/delete/:id",
  deleteuser
);
router.patch(
  "/update",
  authenticateUser,
  multerMiddleware("profile", 1),
  updateUser
);


router.patch(
  "/updateUserPassword/:id",
  updateUserPassword
);



router.get("/search", authenticateUser, searchUserByUsername);


module.exports = router;
