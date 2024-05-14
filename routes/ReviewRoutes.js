const express = require("express");
const router = express.Router();
// const path = require("path");

const {
  authenticateUser,
  authorizePermissions,
} = require("../middleware/authentication");

const {
  createReview,
  getAllReviews,
  getSingleReview,
  updateReview,
  deleteReview,
} = require("../controllers/reviewController");

router.route("/").post( createReview)
router.get("/", getAllReviews);

router
  .route("/:id")
  .get(getSingleReview)
  .patch(authenticateUser, updateReview)
  .delete(
    [authenticateUser],
    deleteReview
  );



module.exports = router;