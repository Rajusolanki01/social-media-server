var ta = require("time-ago");

//?Modify the mongooose data so fontend easily access and read this data
const mapPostOutput = (post, userId) => {
  return {
    _id: post._id,
    caption: post.caption,
    image: post.image,
    owner: {
      _id: post.owner._id,
      name: post.owner.name,
      avatar: post.owner.avatar,
    },
    likesCount: post.likes.length,
    isLiked: post.likes.includes(userId),
    timeAgo: ta.ago(post.createdAt),
    comments: post.comments.map((comment,userId) => {
      return {
        _id: comment?._id,
        user: {
          _id: comment?.user?._id, // Update this line to access the user's _id
          name: comment?.user?.name,
          avatar: comment?.user?.avatar,
        },
        text: comment?.text,
        createdAt: comment?.createdAt,
        likes: comment?.likes?.length,
        isLiked: comment?.likes?.includes(userId),
        timeAgo: ta.ago(comment?.createdAt),
        subComments: comment?.subComments?.map((subComment,userId) => {
          return {
            _id: subComment?._id,
            user: {
              _id: subComment?.user?._id, // Update this line to access the user's _id
              name: subComment?.user?.name,
              avatar: subComment?.user?.avatar,
            },
            text: subComment?.text,
            createdAt: subComment?.createdAt,
            likes: subComment?.likes?.length,
            isLiked: subComment?.likes?.includes(userId),
            timeAgo: ta.ago(subComment?.createdAt),
          };
        }).reverse(),
      };
    }).reverse(),
  };
};

module.exports = {
  mapPostOutput,
};
