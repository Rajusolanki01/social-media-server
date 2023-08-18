const router = require("express").Router();
const postController = require("../controllers/postController");
const requireUser = require("../middlewares/requireUser");

router.get("/all", requireUser, postController.getAllPostController);
router.post("/", requireUser, postController.createPostController);//? Create the Post
router.post("/likeAndUnlike", requireUser, postController.likeAndUnlikePost);//? Like & Unlike the Post
router.post("/comment",requireUser,postController.addCommentToPostController);//? add comment the Post
router.post("/likeComment",requireUser,postController.likeAndUnlikeComment);//? add Like comment 
router.post("/subcomment", requireUser,postController.addSubCommentController);//? add subComment the Post
router.post("/likeSubcomment",requireUser,postController.likeAndUnlikeSubcomment);//? add comment the Post
router.put("/", requireUser,postController.updatePostController); //? Update the Post
router.delete("/delete", requireUser,postController.deletePostController);//? Delete the Post
router.delete("/deleteCommentAndSubcomment", requireUser,postController.deleteCommentAndSubCommentController);//? Delete comment or subComment the Post
// router.delete("/deletesubcomment", requireUser,postController.deleteSubCommentController);//? Delete subComment the Post

module.exports = router;
 