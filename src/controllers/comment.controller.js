import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const { videoId } = req.params;
    const { page = 1, limit = 10, sort = -1 } = req.query;
    const isValidVideoId = isValidObjectId(videoId);
    if (!isValidVideoId) throw new ApiError(400, "Invalid videoId");
    const video = await Video.findById(videoId);
    if (!video) throw new ApiError(404, "Video Not Found");
    const comment = Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId),
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
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "video",
                pipeline: [
                    {
                        $project: {
                            title: 1,
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
                owner: {
                    $first: "$owner",
                },
            },
        },
        {
            $sort: {
                updatedAt: Number(sort),
            },
        },
    ]);
    await Comment.aggregatePaginate(
        comment,
        {
            page,
            limit,
        },
        function (err, results) {
            if (err) {
                console.log(err);
            } else {
                return res
                    .status(200)
                    .json(
                        new ApiResponse(
                            200,
                            "Comment Fetched Successfully",
                            results
                        )
                    );
            }
        }
    );
});

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const { videoId } = req.params;
    const { content } = req.body;
    const userId = req.user?._id;
    const isValidVideoId = isValidObjectId(videoId);
    if (!isValidVideoId) throw new ApiError(400, "Invalid videoId");
    if (!content) throw new ApiError(400, "Content Field is Required");
    const video = await Video.findById(videoId);
    if (!video) throw new ApiError(404, "Video Not Found");
    const newComment = await Comment.create({
        content,
        video: videoId,
        owner: userId,
    });
    const comment = await Comment.findById(newComment?._id);
    if (!comment)
        throw new ApiError(500, "Something Went Wrong in creating Commnets");
    return res
        .status(201)
        .json(new ApiResponse(201, "Comment Created Successfully", comment));
});

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const { content } = req.body;
    const { commentId } = req.params;
    if (!content) throw new ApiError(400, "Content Is Required");
    const isCommentIdValid = isValidObjectId(commentId);
    if (!isCommentIdValid) throw new ApiError(400, "Invalid CommentId");
    const comment = await Comment.findById(commentId);
    if (!comment) throw new ApiError(404, "Comment Not Found");
    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set: { content },
        },
        { new: true }
    );
    if (!updatedComment)
        throw new ApiError(500, "Something Went Wrong While Updating Comment");
    return res
        .status(200)
        .json(new ApiResponse(200, "Comment Updated", updatedComment));
});

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const { commentId } = req.params;
    const isCommentIdValid = isValidObjectId(commentId);
    if (!isCommentIdValid) throw new ApiError(400, "Invalid CommentId");
    const comment = await Comment.findById(commentId);
    if (!comment) throw new ApiError(404, "Comment Not Found");
    const deletedComment = await Comment.findOneAndDelete({ _id: commentId });
    if (!deletedComment)
        throw new ApiError(500, "Something Went Wrong While Updating Comment");
    return res
        .status(200)
        .json(new ApiResponse(200, "Comment Deleted", deletedComment));
});

const getUserCommentOnVideoID = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const userId = req.user?._id;
    const isVideoIdValid = isValidObjectId(videoId);
    if (!isVideoIdValid) throw new ApiError(400, "Invalid VideoId");
    const video = await Video.findById(videoId);
    if (!video) throw new ApiError(404, "Video Does Not Exists");
    const comment = await Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId),
                owner: new mongoose.Types.ObjectId(userId),
            },
        },
    ]);

    if (!comment)
        throw new ApiError(
            500,
            "Something Went Wrong While Fetching User Comment On Video ID"
        );
    return res.json(
        new ApiResponse(
            200,
            "User Comment On VideoId Fetched Successfully",
            comment
        )
    );
});
export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment,
    getUserCommentOnVideoID,
};
