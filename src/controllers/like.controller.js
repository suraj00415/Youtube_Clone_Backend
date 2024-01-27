import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { Tweet } from "../models/tweet.model.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const isValidVideoId = isValidObjectId(videoId);
    if (!isValidVideoId) throw new ApiError(400, "Invalid VideoId");
    const video = await Video.findById(videoId);
    if (!video) throw new ApiError(404, "Video Not Found");
    const isLiked = await Like.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId),
                likedBy: new mongoose.Types.ObjectId(req.user?._id),
            },
        },
    ]);
    if (isLiked.length) {
        const like = await Like.findByIdAndDelete(isLiked[0]?._id);
        if (!like)
            throw new ApiError(500, "Something Went Wrong While Disliking");
        return res
            .status(200)
            .json(new ApiResponse(200, "Unliked Successfully in Video", like));
    } else {
        const newLike = await Like.create({
            likedBy: req.user?._id,
            video: videoId,
        });
        const like = await Like.findById(newLike?._id);
        if (!like) throw new ApiError(500, "Soemthign Went Wrong While Liking");
        return res
            .status(200)
            .json(new ApiResponse(200, "Liked Successfully in Video", like));
    }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const isValidCommentId = isValidObjectId(commentId);
    if (!isValidCommentId) throw new ApiError(400, "Invalid CommentId");
    const comment = await Comment.findById(commentId);
    if (!comment) throw new ApiError(404, "Comment Not Found");
    const isLiked = await Like.aggregate([
        {
            $match: {
                comment: new mongoose.Types.ObjectId(commentId),
                likedBy: new mongoose.Types.ObjectId(req.user?._id),
            },
        },
    ]);
    console.log(isLiked);
    if (isLiked.length) {
        const like = await Like.findByIdAndDelete(isLiked[0]?._id);
        if (!like)
            throw new ApiError(500, "Something Went Wrong While Disliking");
        return res
            .status(200)
            .json(
                new ApiResponse(200, "Unliked Successfully in Comment", like)
            );
    } else {
        const newLike = await Like.create({
            likedBy: req.user?._id,
            comment: commentId,
        });
        const like = await Like.findById(newLike?._id);
        if (!like) throw new ApiError(500, "Soemthign Went Wrong While Liking");
        return res
            .status(200)
            .json(new ApiResponse(200, "Liked Successfully in Comment", like));
    }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
    //TODO: toggle like on tweet
    const { tweetId } = req.params;
    const isValidTweetId = isValidObjectId(tweetId);
    if (!isValidTweetId) throw new ApiError(400, "Invalid CommentId");
    const tweet = await Tweet.findById(tweetId);
    if (!tweet) throw new ApiError(404, "tweet Not Found");
    const isLiked = await Like.aggregate([
        {
            $match: {
                tweet: new mongoose.Types.ObjectId(tweetId),
                likedBy: new mongoose.Types.ObjectId(req.user?._id),
            },
        },
    ]);
    console.log(isLiked);
    if (isLiked.length) {
        const like = await Like.findByIdAndDelete(isLiked[0]?._id);
        if (!like)
            throw new ApiError(500, "Something Went Wrong While Disliking");
        return res
            .status(200)
            .json(new ApiResponse(200, "Unliked Successfully in Tweet", like));
    } else {
        const newLike = await Like.create({
            likedBy: req.user?._id,
            tweet: tweetId,
        });
        const like = await Like.findById(newLike?._id);
        if (!like) throw new ApiError(500, "Somethign Went Wrong While Liking");
        return res
            .status(200)
            .json(new ApiResponse(200, "Liked Successfully in Tweet", like));
    }
});

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const likedVideo = await Like.aggregate([
        {
            $match: {
                video: {
                    $exists: true,
                    $ne: true,
                },
            },
        },
        {
            $group: {
                _id: {
                    video: "$video",
                },
            },
        },
        {
            $lookup: {
                from: "videos",
                localField: "_id.video",
                foreignField: "_id",
                as: "video",
                pipeline: [
                    {
                        $project: {
                            owner: 1,
                            views: 1,
                            duration: 1,
                            title: 1,
                            thumbnail: 1,
                            videoFile: 1,
                        },
                    },
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1,
                                    },
                                },
                            ],
                        },
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner",
                            },
                        },
                    },
                ],
            },
        },
        {
            $addFields: {
                video: {
                    $first: "$video",
                },
            },
        },
    ]);
    if (!likedVideo)
        throw new ApiError(
            500,
            "Something went Wrong While Fetching THe Videos"
        );
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Liked Videos Fetched Successfully",
                likedVideo
            )
        );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
