import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";

const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body;
    if (!name || !description)
        throw new ApiError(400, "Name and Description Field is required");
    const newPlaylist = await Playlist.create({
        name,
        description,
        owner: req.user?._id,
    });
    const playlist = await Playlist.findById(newPlaylist._id);
    if (!playlist)
        throw new ApiError(500, "Something went wrong while creating playlist");
    return res
        .status(201)
        .json(new ApiResponse(201, "Playlist Created Successfully", playlist));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    //TODO: get user playlists
    const isUserIdValid = isValidObjectId(userId);
    if (!isUserIdValid) throw new ApiError(400, "Invalid UserId");
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, "User Not Found");
    const playlist = await Playlist.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId),
            },
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos",
                pipeline: [
                    {
                        $project: {
                            title: 1,
                            views: 1,
                            thumbnail: 1,
                            duration: 1,
                            owner: 1,
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
                totalVideos: {
                    $size: "$videos",
                },
            },
        },
    ]);
    if (!playlist)
        throw new ApiError(
            500,
            "Something Went Wrong While Fetching Playlist Data"
        );
    return res
        .status(200)
        .json(
            new ApiResponse(200, "User Playlist Fetched Successfully", playlist)
        );
});

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    const isValidPlaylistId = isValidObjectId(playlistId);
    if (!isValidPlaylistId) throw new ApiError(400, "Invalid PlaylistId");
    const playlistFind = await Playlist.findById(playlistId);
    if (!playlistFind) throw new ApiError(404, "Playlist Not Found");
    //TODO: get playlist by id
    const playlist = await Playlist.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(playlistId),
            },
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos",
                pipeline: [
                    {
                        $project: {
                            title: 1,
                            views: 1,
                            thumbnail: 1,
                            duration: 1,
                            owner: 1,
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
                totalVideos: {
                    $size: "$videos",
                },
            },
        },
    ]);
    if (!playlist)
        throw new ApiError(
            500,
            "Something Went Wrong While Fetching Playlist Data By Id"
        );
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Playlist By Id Fetched SuccessFully",
                playlist
            )
        );
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;
    const isValidPlaylistId = isValidObjectId(playlistId);
    const isValidVideoId = isValidObjectId(videoId);
    if (!isValidPlaylistId || !isValidVideoId)
        throw new ApiError(400, "Invalid PlaylistId or VideoId");
    const playlistFind = await Playlist.findById(playlistId);
    const video = await Video.findById(videoId);
    if (!playlistFind) throw new ApiError(404, "Playlist Not Found");
    if (!video) throw new ApiError(404, "Video Not Found");
    if (playlistFind.owner.toString() !== req.user?._id.toString())
        throw new ApiError(401, "Unauthorized to add the Video");
    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $addToSet: {
                videos: videoId,
            },
        },
        {
            new: true,
        }
    );
    if (!playlist)
        throw new ApiError(
            500,
            "Something went wrong while adding video in playlist"
        );
    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                "Video Added to Playlist Successfully",
                playlist
            )
        );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;
    const isValidPlaylistId = isValidObjectId(playlistId);
    const isValidVideoId = isValidObjectId(videoId);
    if (!isValidPlaylistId || !isValidVideoId)
        throw new ApiError(400, "Invalid PlaylistId or VideoId");
    const playlistFind = await Playlist.findById(playlistId);
    if (!playlistFind) throw new ApiError(404, "Playlist Not Found");
    const video = await Video.findById(videoId);
    if (!video) throw new ApiError(404, "Video Not Found");
    if (playlistFind.owner.toString() !== req.user?._id.toString())
        throw new ApiError(401, "Unauthorized to delete the Video");
    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull: {
                videos: videoId,
            },
        },
        {
            new: true,
        }
    );
    if (!playlist)
        throw new ApiError(
            500,
            "Something went wrong while deleting video in playlist"
        );
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Video Deleted to Playlist Successfully",
                playlist
            )
        );
});

const deletePlaylist = asyncHandler(async (req, res) => {
    // TODO: delete playlist
    const { playlistId } = req.params;
    const isValidPlaylistId = isValidObjectId(playlistId);
    if (!isValidPlaylistId) throw new ApiError(400, "Invalid PlaylistId ");
    const playlistFind = await Playlist.findById(playlistId);
    if (!playlistFind) throw new ApiError(404, "Playlist Not Found");
    if (playlistFind.owner.toString() !== req.user?._id.toString())
        throw new ApiError(401, "Unauthorized to delete the Video");
    const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId);
    if (!deletedPlaylist)
        throw new ApiError(
            500,
            "Something Went Wrong While Deleting The Playlist"
        );
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Playlist Deleted Successfully",
                deletedPlaylist
            )
        );
});

const updatePlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body;
    if (!name && !description)
        throw new ApiError(400, "Name or Description Field is Required");
    //TODO: update playlist
    const { playlistId } = req.params;
    const isValidPlaylistId = isValidObjectId(playlistId);
    if (!isValidPlaylistId) throw new ApiError(400, "Invalid PlaylistId ");
    const playlistFind = await Playlist.findById(playlistId);
    if (!playlistFind) throw new ApiError(404, "Playlist Not Found");
    if (playlistFind.owner.toString() !== req.user?._id.toString())
        throw new ApiError(401, "Unauthorized to update the playlist");
    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set: { name, description },
        },
        {
            new: true,
        }
    );
    if (!playlist)
        throw new ApiError(
            500,
            "Something went wrong while adding video in playlist"
        );
    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                "Video Added to Playlist Successfully",
                playlist
            )
        );
});
const togglePublicStatus = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    const isValidPlaylistId = isValidObjectId(playlistId);
    if (!isValidPlaylistId) throw new ApiError(400, "Invalid PlaylistId ");
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) throw new ApiError(404, "Playlist Not Found");
    if (playlist.owner.toString() !== req.user?._id.toString())
        throw new ApiError(
            401,
            "Unauthorized to change public status the playlist"
        );
    const status = playlist.togglePublicStatus();
    playlist.isPublic = status;
    await playlist.save({ validateBeforeSave: false });
    return res
        .status(200)
        .json(new ApiResponse(200, "Playlist Public Status Changed", playlist));
});

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist,
    togglePublicStatus,
};
