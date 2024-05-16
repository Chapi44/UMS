const express = require("express");
const router = express.Router();
const path = require ('path')
const multer = require("multer");
const {
    createposts,
    getAllposts,
    getSinglepost,
    updatepostbyid,
    deletepostbyid,
    replyToPost,
    likeOrUnlikeReply,
    likeProduct,
    createcatagories,
    replyToReply,
    gethasDiscount,
    getCategoryById,
    getCategories    

  } = require("../controllers/postController");

const {
  authenticateUser ,
  authorizePermissions1 ,
} = require("../middleware/authentication");


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/posts/');
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

router.route("/").post(
  authenticateUser,
  upload.array('images', 6),
  createposts
  )
  router.route("/catagorie").post(
    authenticateUser,
    upload.array('images', 6),
    createcatagories
    )
  router.get("/",getAllposts);

router
  .route("/:id")
  .get(getSinglepost)
 router.delete("/:id",authenticateUser,deletepostbyid);

  router.put("/:id",authenticateUser, upload.array("images", 6), updatepostbyid);

  router.get("/categories/cat", getCategories);
  router.get("/cat/:id", getCategoryById);

router.put("/reply/:id", authenticateUser, replyToPost);
router.post('/replytoreply', authenticateUser, replyToReply);
router.post('/products/:productId/replies/:replyId/like', authenticateUser, likeOrUnlikeReply);
router.get("/products/hasDiscount", gethasDiscount);

router.post("/like/:id", authenticateUser, likeProduct);




module.exports = router;
