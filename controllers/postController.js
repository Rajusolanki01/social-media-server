const Post = require("../models/Post");
const Users = require("../models/Users");
const { success, error } = require("../utils/responseWrapper");
const { mapPostOutput } = require("../utils/utils");
const cloudinary = require("cloudinary").v2;

const getAllPostController = async (req, res) => {
  try {
    // Assuming req._id is the user's ID obtained from authentication middleware
    return res.send(success(200, "These are all the posts"));
  } catch (e) {
    res.send(error(500, e.message));
  }
};

//? Function to create a new post
const createPostController = async (req, res) => {
  try {
    const { caption, postImg } = req.body;

    if (!caption || !postImg) {
      return res.send(error(400, "Caption and Post Image is Required"));
    }
    const cloudImg = await cloudinary.uploader.upload(postImg, {
      folder: "postImg",
    });

    const owner = req._id;

    const user = await Users.findById(owner);

    if (!user) {
      return res.send(error(404, "User not found."));
    }

    const post = await Post.create({
      // Create a new post and save it to the database
      owner,
      caption,
      image: {
        publicId: cloudImg.public_id,
        url: cloudImg.url,
      },
    });

    user.post.push(post._id); // Update the user's posts array with the new post's ID
    await user.save();
    return res.send(success(201, post));
  } catch (e) {
    return res.send(error(500, e.message));
  }
};

//? Function to update Post and Caption ..
const updatePostController = async (req, res) => {
  try {
    const { postId, caption, postImg } = req.body;
    const curUserId = req._id;

    const post = await Post.findById(postId);

    if (!post) {
      return res.send(error(404, "Post not Found"));
    }

    if (post.owner.toString() !== curUserId) {
      return res.send(error(403, "Only Owners Can Update Their Post"));
    }

    // Check if the caption is provided and not empty before updating i
    if (caption) {
      post.caption = caption;
    }

    // Update the post image if provided in the request body
    if (postImg) {
      const cloudImg = await cloudinary.uploader.upload(postImg, {
        folder: "postImg",
      });
      //  Update the post.image properties
      post.image = post.image || {};
      post.image.publicId = cloudImg.public_id;
      post.image.url = cloudImg.url;
    }

    await post.save();

    return res.send(success(200, { data: post }));
  } catch (e) {
    return res.send(error(500, e.message));
  }
};

//? Function to Delete Post and Caption ..
const deletePostController = async (req, res) => {
  try {
    const { postId } = req.body; // Assuming the postId is passed as a parameter in the URL

    // Find the post by postId and the owner of the post
    const post = await Post.findOne({ _id: postId, owner: req._id });

    if (!post) {
      return res.send(error(404, "You are not the owner of this post"));
    }
    // Delete the post from the database
    await post.deleteOne();

    // Remove the post's ID from the user's posts array
    const user = await Users.findById(req._id);
    if (user) {
      user.post.pull(postId);
      await user.save();
    }

    return res.send(success(200, "Post deleted successfully."));
  } catch (e) {
    return res.send(error(500, e.message));
  }
};

//? Function to like or unlike a post

const likeAndUnlikePost = async (req, res) => {
  try {
    const { postId } = req.body;
    const curUserId = req._id;

    const post = await Post.findById(postId).populate("owner");

    if (!post) {
      return res.send(error(404, "Post not found"));
    }

    if (post.likes.includes(curUserId)) {
      //? If the user already liked the post, unlike it
      const index = post.likes.indexOf(curUserId);
      post.likes.splice(index, 1);
    } else {
      //? If the user has not liked the post, like it
      post.likes.push(curUserId);
    }

    await post.save();
    return res.send(success(200, { post: mapPostOutput(post, req._id) }));
  } catch (e) {
    return res.send(error(500, e.message));
  }
};

//? Function to add a comment to a post
const addCommentToPostController = async (req, res) => {
  try {
    const { postId, text } = req.body;
    const ownerId = req._id; // Assuming user data is available in req.user

    const post = await Post.findById(postId);

    if (!post) {
      return res.send(error(404, "Post not found"));
    }
    const user = await Users.findById(ownerId);

    // Create a new comment object with the provided text and current user's ID as the author
    const newComment = {
      user: {
        _id: user._id,
        name: user.name, // Include user's name in the comment
        avatar: user.avatar, // Include user's avatar in the comment
      },
      text,
      createdAt: new Date(),
    };
    // Add the new comment to the post's comments array
    post.comments.push(newComment);
    await post.save();

    return res.send(success(200, newComment, "Comment added successfully"));
  } catch (e) {
    return res.send(error(500, e.message));
  }
};

//? Function to Like a comment
const likeAndUnlikeComment = async (req, res) => {
  try {
    const { postId, commentId } = req.body;
    const curUserId = req._id;

    const post = await Post.findById(postId);

    if (!post) {
      return res.send(error(404, "Post not found"));
    }

    const comment = post.comments.find((c) => c._id.toString() === commentId);

    if (!comment) {
      return res.send(error(404, "Comment not found"));
    }

    if (comment.likes.includes(curUserId)) {
      // If the user already liked the comment, unlike it
      const index = comment.likes.indexOf(curUserId);
      comment.likes.splice(index, 1);
      await post.save();
      return res.send(success(200, "Comment Unlike successful"));
    } else {
      // If the user has not liked the comment, like it
      comment.likes.push(curUserId);
      await post.save();
      return res.send(success(200, "Comment like successful"));
    }
  } catch (e) {
    return res.send(error(500, e.message));
  }
};

//? Function to add a sub-comment to a post
const addSubCommentController = async (req, res) => {
  try {
    const { commentId, text } = req.body;
    const authorId = req._id; // Assuming user data is available in req.user

    const post = await Post.findOne({ "comments._id": commentId });

    if (!post) {
      return res.send(error(404, "Parent comment not found"));
    }

    //? Find the parent comment where the sub-comment will be added

    const parentComment = post.comments.find(
      (comment) => comment._id.toString() === commentId
    );

    //? Create a new sub-comment object with the provided text and current user's ID as the author
    const newSubComment = {
      user: authorId,
      text,
      createdAt: new Date(),
    };

    //? Add the new sub-comment to the parent comment's subComments array
    parentComment.subComments.push(newSubComment);
    await post.save();

    return res.send(
      success(200, newSubComment, "Sub-comment added successfully")
    );
  } catch (e) {
    return res.send(error(500, e.message));
  }
};

//? Function to Like a sub-comment

const likeAndUnlikeSubcomment = async (req, res) => {
  try {
    const { postId, commentId, subcommentId } = req.body;
    const curUserId = req._id;

    const post = await Post.findById(postId);

    if (!post) {
      return res.send(error(404, "Post not found"));
    }

    const comment = post.comments.find((c) => c._id.toString() === commentId);

    if (!comment) {
      return res.send(error(404, "Comment not found"));
    }

    const subcomment = comment.subComments.find(
      (sc) => sc._id.toString() === subcommentId
    );

    if (!subcomment) {
      return res.send(error(404, "Subcomment not found"));
    }

    if (subcomment.likes.includes(curUserId)) {
      // If the user already liked the subcomment, unlike it
      const index = subcomment.likes.indexOf(curUserId);
      subcomment.likes.splice(index, 1);
      await post.save();
      return res.send(success(200, "Subcomment Unlike successful"));
    } else {
      // If the user has not liked the subcomment, like it
      subcomment.likes.push(curUserId);
    }

    await post.save();
    return res.send(success(200, "Subcomment like successful"));
  } catch (e) {
    return res.send(error(500, e.message));
  }
};

//? Function to delete a comment or SubComment from a post
const deleteCommentAndSubCommentController = async (req, res) => {
  try {
    const { postId, commentId, subCommentId } = req.body;
    const userId = req._id; // Assuming you have authenticated the user and stored their ID in req.user._id

    const post = await Post.findById(postId);

    if (!post) {
      return res.send(error(404, "Post not found"));
    }

    const commentIndex = post.comments.findIndex((comment) =>
      comment._id.equals(commentId)
    );

    if (commentIndex === -1) {
      return res.send(error(404, "Comment not found"));
    }

    const comment = post.comments[commentIndex];

    // Check if the user is the owner of the post or the author of the comment
    if (comment.user.equals(userId) || post.owner.equals(userId)) {
      if (subCommentId) {
        const subcommentIndex = comment.subComments.findIndex((subcomment) =>
          subcomment._id.equals(subCommentId)
        );

        if (subcommentIndex === -1) {
          return res.send(error(404, "SubComment not found"));
        }

        comment.subComments.splice(subcommentIndex, 1);
        await post.save();
        return res.send(success(200, "Subcomment deleted successfully"));
      } else {
        // If no subcommentId provided, delete the entire comment
        post.comments.splice(commentIndex, 1);
        await post.save();
        return res.send(success(200, "Comment deleted successfully"));
      }
    } else {
      const commenter = await Users.findById(comment.user);
      return res.send(
        error(
          403,
          `You're not authorized to Delete this Comment or SubComment. This comment was made by ${commenter.name}.`
        )
      );
    }
  } catch (e) {
    return res.send(error(500, e.message));
  }
};


module.exports = {
  getAllPostController,
  createPostController,
  updatePostController,
  deletePostController,
  likeAndUnlikePost,
  addCommentToPostController,
  likeAndUnlikeComment,
  addSubCommentController,
  likeAndUnlikeSubcomment,
  deleteCommentAndSubCommentController,
};
