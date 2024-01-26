import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { deleteFile } from "../utils/deleteFile.js";

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const { content } = req.body;
    const owner = req.user?._id;
    const images = req.files;
    const deletingFilesData = [];
    const imageUrlString = [];
    if (!content) throw new ApiError(400, "Content Field is required");
    if (!owner) throw new ApiError(401, "Invalid User is required");
    if (images !== null && images?.length) {
        for (const key of images) {
            const imagePath = key?.path;
            const image = await uploadOnCloudinary(imagePath);
            deletingFilesData.push(key?.originalname);
            imageUrlString.push(image?.url);
        }
        if (imageUrlString?.length) {
            for (const key of deletingFilesData) {
                deleteFile(key);
            }
        }
    }
    const newTweet = await Tweet.create({
        content,
        owner,
        images: imageUrlString,
    });
    const tweet = await Tweet.findById(newTweet?._id);
    if (!tweet)
        throw new ApiError(500, "Something Went Wront While Saving Tweet");
    return res
        .status(201)
        .json(new ApiResponse(201, "Tweet Created Successfully", tweet));
});

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const { userId } = req.params;
    const isValidId = isValidObjectId(userId);
    if (!isValidId) throw new ApiError(400, "Invalid UserID");
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, "UserId Not Found");
    const tweet = await Tweet.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId),
            },
        },
    ]);
    if (!tweet) throw new ApiError(404, "Tweets Not Found");
    return res
        .status(200)
        .json(new ApiResponse(200, "User Tweet Fetched Successfully", tweet));
});

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const { content } = req.body;
    if (!content) throw new ApiError(400, "Content Field is required");
    const { tweetId } = req.params;
    const isValidTweetId = isValidObjectId(tweetId);
    if (!isValidTweetId) throw new ApiError(400, "Invalid TweetId");
    const userId = req.user?._id;
    const tweet = await Tweet.findById(tweetId);
    if (!tweet) throw new ApiError(404, "Tweet Not Found");
    if (userId.toString() !== tweet.owner.toString())
        throw new ApiError(401, "Unauthorized Access To Update The Tweet");
    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set: { content },
        },
        {
            new: true,
        }
    );
    if (!updatedTweet)
        throw new ApiError(500, "Something Went While Updating The Tweet");
    return res
        .status(200)
        .json(new ApiResponse(200, "Tweet Updated Successfully", updatedTweet));
});

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const { tweetId } = req.params;
    const userId = req.user?._id;
    const isValidTweetId = isValidObjectId(tweetId);
    if (!isValidTweetId) throw new ApiError(400, "Invalid TweetId");
    const tweet = await Tweet.findById(tweetId);
    if (!tweet) throw new ApiError(404, "Tweet Not Found");
    if (userId.toString() !== tweet.owner.toString())
        throw new ApiError(401, "Unauthorized Access To Delete The Tweet");
    const deletedTweet = await Tweet.findByIdAndDelete(tweetId);
    if (!deletedTweet)
        throw new ApiError(500, "Something Went While Updating The Tweet");
    return res
        .status(200)
        .json(new ApiResponse(200, "Tweet Updated Successfully", deletedTweet));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };