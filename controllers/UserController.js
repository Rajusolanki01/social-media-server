const Users = require("../models/Users");
const Post = require("../models/Post");
const { success, error } = require("../utils/responseWrapper");
const { mapPostOutput } = require("../utils/utils");
const cloudinary = require("cloudinary").v2;

//? Function  follow you or Unfollow
const followOrUnFollowUserController = async (req, res) => {
  try {
    const { userIdToFollow } = req.body;
    const curUserId = req._id;

    const userToFollow = await Users.findById(userIdToFollow);
    const curUser = await Users.findById(curUserId);

    if (curUserId === userIdToFollow) {
      return res.send(error(409, "users cannot follow themself"));
    }

    if (!userToFollow) {
      return res.send(error(404, "user to follow is not found"));
    }

    if (curUser.followings.includes(userIdToFollow)) {
      //already followed
      const followingIndex = curUser.followings.indexOf(userIdToFollow);
      curUser.followings.splice(followingIndex, 1);

      const followerIndex = userToFollow.followers.indexOf(curUser);
      userToFollow.followers.splice(followerIndex, 1);
    } else {
      userToFollow.followers.push(curUserId);
      curUser.followings.push(userIdToFollow);
    }
    await userToFollow.save();
    await curUser.save();

    return res.send(success(200, { user: userToFollow }));
  } catch (e) {
    res.send(error(500, e.message));
  }
};

//? user get post who can follow you
const getFeedData = async (req, res) => {
  try {
    const curUserId = req._id;

    const curUser = await Users.findById(curUserId).populate("followings");

    // Fetch suggestions (users not followed by the current user)

    const fullPost = await Post.find({
      owner: {
        $in: curUser.followings,
      },
    }).populate("owner");

    const posts = fullPost
      .map((item) => mapPostOutput(item, req._id))
      .reverse();

    const followingIds = curUser.followings.map((item) => item._id);
    followingIds.push(req._id);

    const suggestions = await Users.find({
      _id: {
        $nin: followingIds,
      },
    });

    const result = {
      ...curUser._doc,
      suggestions: suggestions,
      posts: posts,
    };

    delete result.post;

    return res.send(success(200, result));
  } catch (e) {
    return res.send(error(500, e.message));
  }
};

//? function getUserPost to get users post
const getUserPosts = async (req, res) => {
  try {
    const userId = req.body.userId;
    if (!userId) {
      return res.send(error(400, "User Id is Required "));
    }

    const allUserPosts = await Post.find({
      owner: userId,
    }).populate("likes");
    return res.send(success(200, { allUserPosts }));
  } catch (e) {
    return res.send(error(500, e.message));
  }
};

//? function getMyPost to get users own posts
const getMyPost = async (req, res) => {
  try {
    const curUserId = req._id; // Assuming the user ID is available in req.user

    // Fetch the user's own data using their ID
    const currentUser = await Users.findById(curUserId);

    // Fetch the count of followers for the current user
    const followersCount = currentUser.followers.length;

    // Fetch the count of followings for the current user
    const followingsCount = currentUser.followings.length;

    // Fetch the count of posts owned by the current user
    const postsCount = currentUser.post.length;

    // Find posts that are owned by the current user
    const allUserPosts = await Post.find({ owner: curUserId })
      .populate({
        path: "likes",
        select: "-password", // Optionally, exclude sensitive fields like "password" from the populated user data
      })
      .populate({
        path: "comments",
        populate: {
          path: "user likes",
          select: "-password", // Optionally, exclude sensitive fields like "password" from the populated user data
        },
      })
      .populate({
        path: "comments.subComments",
        populate: {
          path: "user likes",
          select: "-password", // Optionally, exclude sensitive fields like "password" from the populated user data
        },
      })
      .populate("likes");

    const response = {
      userData: {
        owner: currentUser._id,
        Name: currentUser.name,
        followersCount,
        followingsCount,
        postsCount,
      },
      posts: allUserPosts,
    };

    return res.send(success(200, response));
  } catch (e) {
    return res.send(error(500, e.message));
  }
};

//? function getMyInfo to get users own full information
const getmyInfo = async (req, res) => {
  try {
    const user = await Users.findById(req._id);

    return res.send(success(200, { user }));
  } catch (e) {
    return res.send(error(500, e.message));
  }
};

//? function getUserProfile to get users collect own detials
const getUserProfile = async (req, res) => {
  try {
    const userId = req.body.userId;

    const user = await Users.findById(userId).populate({
      path: "post",
      populate: {
        path: "owner",
      },
    });
    if (user && user.post) {
      const fullPost = user.post;
      const posts = await fullPost.map((item) => mapPostOutput(item, req._id)).reverse();
      const result = {
        ...user._doc,
        posts: posts,
      };

      delete result.post;
      return res.send(success(200, result));
    }
  } catch (e) {
    return res.send(error(500, e.message));
  }
};

//? function updateUserProfile to get users own byself full information updated
const updateUserProfile = async (req, res) => {
  try {
    const { name, bio, userImg } = req.body;

    const user = await Users.findById(req._id);

    if (name) {
      user.name = name;
    }
    if (bio) {
      user.bio = user.bio;
    }
    if (userImg) {
      const cloudImg = await cloudinary.uploader.upload(userImg, {
        folder: "profileImg",
      });

      user.avatar = {
        url: cloudImg.secure_url,
        publicId: cloudImg.public_id,
      };
    }
    await user.save();
    return res.send(success(200, { user }));
  } catch (e) {
    return res.send(error(500, e.message));
  }
};

//? Delete User Profile function
const deleteTheUserProfile = async (req, res) => {
  try {
    const curUserId = req._id;

    //? Delete all posts by the user
    await Post.deleteMany({ owner: curUserId });

    //? Remove user from followers' followings and from followings' followers
    const curUser = await Users.findById(curUserId);
    const usersToUpdate = curUser.followers.concat(curUser.followings);

    await Users.updateMany(
      { _id: { $in: usersToUpdate } },
      {
        $pull: { followers: curUserId, followings: curUserId },
      }
    );

    //? Remove user's likes from all posts
    await Post.updateMany(
      { likes: curUserId },
      {
        $pull: { likes: curUserId },
      }
    );

    //? Remove user's comments from all posts
    await Post.updateMany(
      { "comments.user": curUserId },
      {
        $pull: { comments: { user: curUserId } },
      }
    );

    //? Delete the user's profile
    await Users.deleteOne({ _id: curUserId });

    //? Clear the JWT cookie
    res.clearCookie("jwt", {
      httpOnly: true,
      secure: true,
    });

    return res.send(success(200, "User profile deleted successfully."));
  } catch (e) {
    return res.send(error(500, e.message));
  }
};

module.exports = {
  followOrUnFollowUserController,
  getFeedData,
  getMyPost,
  getUserPosts,
  getmyInfo,
  getUserProfile,
  updateUserProfile,
  deleteTheUserProfile,
};
