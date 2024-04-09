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

    replyToReply
    

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
  ).get(getAllposts);

router
  .route("/:id")
  .get(getSinglepost)
 router.delete("/:id",authenticateUser,deletepostbyid);

  router.put("/:id",authenticateUser, upload.array("images", 6), updatepostbyid);



router.put("/reply/:id", authenticateUser, replyToPost);
router.post('/replytoreply', authenticateUser, replyToReply);
router.post('/products/:productId/replies/:replyId/like', authenticateUser, likeOrUnlikeReply);


router.post("/like/:id", authenticateUser, likeProduct);




module.exports = router;
