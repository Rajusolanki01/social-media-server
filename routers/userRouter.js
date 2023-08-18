const router = require("express").Router();
const requireUser = require("../middlewares/requireUser");
const userController = require("../controllers/UserController");

router.post(
  "/followAndUnfollow",
  requireUser,
  userController.followOrUnFollowUserController
);
router.get("/getFeedData", requireUser, userController.getFeedData);
router.get("/getMyPost", requireUser, userController.getMyPost);
router.get("/getUserPosts", requireUser, userController.getUserPosts);
router.get("/getMyInfo", requireUser, userController.getmyInfo);
router.post("/getUserProfile", requireUser, userController.getUserProfile);
router.put("/updateMyProfile", requireUser, userController.updateUserProfile);
router.delete(
  "/deleteProfile",
  requireUser,
  userController.deleteTheUserProfile
);

module.exports = router;
