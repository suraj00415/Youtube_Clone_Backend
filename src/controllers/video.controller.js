import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { deleteFile } from "../utils/deleteFile.js";
import { User } from "../models/user.model.js";

const getAllVideos = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        query = "",
        sortBy = "views",
        sortType = -1,
        userId,
    } = req.query;
    const options = {
        page: page,
        limit: limit,
    };
    // sortBy--->duration,views,createdAt
    // sortType--->asc,desc
    // userId--->owner
    // asc=1 & desc=-1
    let videopage = Video.aggregate([]);
    if (!userId) {
        videopage = Video.aggregate([
            [
                {
                    $sort: {
                        [sortBy]: Number(sortType),
                    },
                },
                {
                    $match: {
                        $or: [
                            {
                                title: {
                                    $regex: query,
                                    $options: "i",
                                },
                            },
                            {
                                description: {
                                    $regex: query,
                                    $options: "i",
                                },
                            },
                        ],
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
                                    avatar: 1,
                                    fullName: 1,
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
        ]);
    } else {
        const isValidUser = isValidObjectId(userId);
        if (!isValidUser) throw new ApiError(400, "Invalid UserId");
        const user = await User.findById(userId);
        if (!user) throw new ApiError(404, "User Not Found");
        videopage = Video.aggregate([
            [
                {
                    $match: {
                        owner: new mongoose.Types.ObjectId(userId),
                    },
                },
                {
                    $sort: {
                        [sortBy]: Number(sortType),
                    },
                },
                {
                    $match: {
                        $or: [
                            {
                                title: {
                                    $regex: query,
                                    $options: "i",
                                },
                            },
                            {
                                description: {
                                    $regex: query,
                                    $options: "i",
                                },
                            },
                        ],
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
                                    avatar: 1,
                                    fullName: 1,
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
        ]);
    }
    await Video.aggregatePaginate(videopage, options, function (err, results) {
        if (err) {
            console.log(err);
        } else {
            return res
                .status(200)
                .json(
                    new ApiResponse(200, "Videos Fetched Successfully", results)
                );
        }
    });
});

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;
    const userID = req.user?._id;
    if (!userID) throw new ApiError(401, "Invalid UserId");
    if (!title && !description)
        throw new ApiError(400, "Title and description required");
    const videoFilePath = req.files?.videoFile[0]?.path;
    const videoFileName = req.files?.videoFile[0]?.originalname;
    const thumbnailPath = req.files?.thumbnail[0]?.path;
    const thumbnailName = req.files?.thumbnail[0]?.originalname;
    if (!thumbnailPath || !videoFilePath)
        throw new ApiError(400, "Thumbnail or VideoFile is required");
    const videoFile = await uploadOnCloudinary(videoFilePath);
    const thumbnail = await uploadOnCloudinary(thumbnailPath);
    if (!videoFile || !thumbnail)
        throw new ApiError(400, "Thumbnail or VideoFile is required");
    const video = await Video.create({
        owner: userID,
        title,
        description,
        thumbnail: thumbnail?.url,
        videoFile: videoFile?.url,
        duration: videoFile?.duration,
    });

    const videoCreated = await Video.findById(video?._id);
    if (!videoCreated) throw new ApiError(400, "Video is not created");
    deleteFile(videoFileName);
    deleteFile(thumbnailName);
    res.status(201).json(
        new ApiResponse(201, "Video Created Successfully", videoCreated)
    );
});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const isValidVideoId = isValidObjectId(videoId);
    if (!isValidVideoId) throw new ApiError(400, "Invalid VideoId");
    const video = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId),
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
                            username: 1,
                            fullName: 1,
                            avatar: 1,
                        },
                    },
                ],
            },
        },
    ]);
    if (!video.length) throw new ApiError(404, "Video Not Found");
    return res
        .status(200)
        .json(new ApiResponse(200, "Video Fetched Successfully", video));
});

const updateVideo = asyncHandler(async (req, res) => {
    //TODO: update video details like title, description, thumbnail
    const { videoId } = req.params;
    const isValidVideoId = isValidObjectId(videoId);
    if (!isValidVideoId) throw new ApiError(400, "Invalid VideoID");
    const userId = req.user?._id;
    if (!userId) throw new ApiError(400, "Invalid User");
    const video = await Video.findById({ _id: videoId });
    if (!video) throw new ApiError(404, "Video Not Found");
    if (video?.owner?._id.toString() !== userId.toString())
        throw new ApiError(401, "Unauthorized Access To Update Video");
    const { title, description, thumbnail } = req.body;
    if (!title && !description && !thumbnail)
        throw new ApiError(400, "Any One Fields is Required");
    const newVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                title,
                description,
                thumbnail,
            },
        },
        {
            new: true,
        }
    );
    if (!newVideo) throw new ApiError(400, "Invalid Video Id ");
    return res
        .status(200)
        .json(new ApiResponse(200, "Video Updated Successfully", newVideo));
});

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const isValidVideoId = isValidObjectId(videoId);
    if (!isValidVideoId) throw new ApiError(400, "Invalid VideoID");
    const userId = req.user?._id;
    if (!userId) throw new ApiError(400, "Invalid User");
    const video = await Video.findById({ _id: videoId });
    if (!video) throw new ApiError(404, "Video Not Found");
    if (video?.owner?._id.toString() !== userId.toString())
        throw new ApiError(401, "Unauthorized Access To Delete Video");
    const deletedVideo = await Video.findByIdAndDelete(videoId);
    if (!deletedVideo) throw new ApiError(500, "Unable to delete Video");
    return res
        .status(202)
        .json(new ApiResponse(202, "Video Deleted Successfully", deleteVideo));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const isValidVideoId = isValidObjectId(videoId);
    if (!isValidVideoId) throw new ApiError(400, "Invalid VideoID");
    const userId = req.user?._id;
    if (!userId) throw new ApiError(400, "Invalid User");
    const video = await Video.findById({ _id: videoId });
    if (!video) throw new ApiError(404, "Video Not Found");
    if (video?.owner?._id.toString() !== userId.toString())
        throw new ApiError(
            401,
            "Unauthorized Access To Change THe Publish-Status Video"
        );

    const status = video.togglePublish();
    video.isPublished = status;
    await video.save({ validateBeforeSave: false });
    const newVideo = await Video.findById(videoId);
    if (!newVideo)
        throw new ApiError(
            500,
            "Something Went Wrong In Toggling Publishing Status"
        );
    return res
        .status(200)
        .json(new ApiResponse(200, "Publishing Status Changed", newVideo));
});

export {
    deleteVideo,
    getAllVideos,
    getVideoById,
    publishAVideo,
    togglePublishStatus,
    updateVideo,
};
