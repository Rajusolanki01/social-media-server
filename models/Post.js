const mongoose = require("mongoose");

const postSchema = mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    image: {
      PublicId: String,
      url: String,
    },
    caption: {
      type: String,
      required: true,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
      },
    ],
    comments: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "user",
        },
        text: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        likes: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
          },
        ],
        subComments: [
          {
            user: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "user",
            },
            text: {
              type: String,
              required: true,
            },
            createdAt: { 
              type: Date,
              default: Date.now,
            },
            likes: [
              {
                type: mongoose.Schema.Types.ObjectId,
                ref: "user",
              },
            ],
          },
        ],
      },
    ],
    shares: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "user",
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true, // Add createdAt and updatedAt fields
  }
);

module.exports = mongoose.model("post", postSchema);
