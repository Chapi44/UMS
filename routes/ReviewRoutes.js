const express = require("express");
const router = express.Router();
// const path = require("path");



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
  .patch( updateReview)
  .delete(
    deleteReview
  );



module.exports = router;