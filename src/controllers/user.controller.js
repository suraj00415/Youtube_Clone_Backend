import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { deleteFile } from "../utils/deleteFile.js";

const generateAccessAndRefreshToken = async (userid) => {
    try {
        const user = await User.findById(userid);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });
        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(
            500,
            "Something went wrong while generating refresh and acces token"
        );
    }
};

const registerUser = asyncHandler(async (req, res) => {
    const { fullName, username, email, password } = req.body;
    if (!fullName || !username || !email || !password) {
        throw new ApiError(400, "All Field Are Required");
    }
    const existedUser = await User.findOne({
        $or: [{ username }, { email }],
    });
    if (existedUser) {
        throw new ApiError(409, "User with username or email already exists");
    }
    const avatarfilePath = req.files?.avatar[0].path;
    const avatarfileName = req.files?.avatar[0].originalname;
    let coverImagefilePath;
    let coverImagefileName = "";
    if (
        req.files &&
        Array.isArray(req.files.coverImage) &&
        req.files.coverImage.length > 0
    ) {
        coverImagefilePath = req.files?.coverImage[0].path;
        coverImagefileName = req.files?.coverImage[0].originalname;
    }
    if (!avatarfilePath) {
        throw new ApiError(400, "Avatar Files Required");
    }
    const avatar = await uploadOnCloudinary(avatarfilePath);
    const coverImage = await uploadOnCloudinary(coverImagefilePath);

    if (!avatar) {
        throw new ApiError(400, "Avatar File Not Uploded Due To Error");
    }
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        username: username.toLowerCase(),
        email,
        password,
    });

    const userCreated = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if (!userCreated) {
        throw new ApiError(500, "Something Went Wrong While Regestering User");
    }
    deleteFile(avatarfileName);
    deleteFile(coverImagefileName);
    return res
        .status(201)
        .json(new ApiResponse(200, "User Registerd Successfully", userCreated));
});

const loginUser = asyncHandler(async (req, res) => {
    // enter username and pass from "req.body"
    // check if username or email exists
    // find user
    // check password with database
    // access and refresh token
    // send cookies

    const { username, email, password } = req.body;
    if (!username && !email)
        throw new ApiError(400, "Email or Username is required");

    const user = await User.findOne({
        $or: [{ email }, { username }],
    });

    if (!user) throw new ApiError(404, "User does not exists");

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) throw new ApiError(401, "Invalid user credentials");

    const { refreshToken, accessToken } = await generateAccessAndRefreshToken(
        user._id
    );

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    const option = {
        secure: true,
        httpOnly: true,
    };
    return res
        .status(200)
        .cookie("accessToken", accessToken, option)
        .cookie("refreshToken", refreshToken, option)
        .json(
            new ApiResponse(200, "User LoggedIn Successfully", {
                user: loggedInUser,
                accessToken,
                refreshToken,
            })
        );
});

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: { refreshToken: 1 },
        },
        { new: true }
    );

    const option = {
        httpOnly: true,
        secure: true,
    };
    return res
        .status(200)
        .clearCookie("accessToken", option)
        .clearCookie("refreshToken", option)
        .json(new ApiResponse(200, {}, "User LoggedOut Successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    try {
        const incomingRefreshToken =
            req.cookies.refreshToken || req.body.refreshToken;
        if (!incomingRefreshToken)
            throw new ApiError(401, "Unauthorized Access");
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );
        const user = await User.findById(decodedToken?._id);
        if (!user) throw new ApiError(400, "Invalid Refresh Token");

        if (incomingRefreshToken == !user.refreshToken)
            throw new ApiError(400, "Refresh Token is Expired or Used");
        const option = {
            httpOnly: true,
            secure: true,
        };
        const { refreshToken: newRefreshToken, accessToken } =
            await generateAccessAndRefreshToken(user._id);
        return res
            .status(200)
            .cookie("accessToken", accessToken, option)
            .cookie("refreshToken", newRefreshToken, option)
            .json(
                new ApiResponse(200, "Access Token Refreshed", {
                    accessToken,
                    refreshToken: newRefreshToken,
                })
            );
    } catch (error) {
        throw new ApiError(401, error.message || "Invalid Refresh Token");
    }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user?._id);
    if (!user) throw new ApiError(401, "Unauthorized Access");
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
    if (!isPasswordCorrect) throw new ApiError(400, "Invalid Old Password");
    user.password = newPassword;
    await user.save({ validateBeforeSave: false });
    return res
        .status(200)
        .json(new ApiResponse(200, "Password Changed Successfully", {}));
});

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, "User Fetched Successfully", req.user));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body;
    if (!fullName && !email) {
        throw new ApiError(400, "All fields are required");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: { fullName, email },
        },
        { new: true }
    ).select("-password");
    return res
        .status(200)
        .json(new ApiResponse(200, "User Updated Successfully", user));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalFilePath = req.file?.path;
    if (!coverImageLocalFilePath)
        throw new ApiError(400, "Cover Image File Missing");
    const coverImage = await uploadOnCloudinary(coverImageLocalFilePath);
    if (!coverImage.url)
        throw new ApiError(400, "Error While Uploading On Cloudinary");
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        { $set: { coverImage: coverImage.url } },
        { new: true }
    ).select("-password");
    return res
        .status(200)
        .json(new ApiResponse(200, "Updated User Avatar", user));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalFilePath = req.file?.path;
    if (!avatarLocalFilePath) throw new ApiError(400, "Avatar File Missing");
    const avatar = await uploadOnCloudinary(avatarLocalFilePath);
    if (!avatar.url)
        throw new ApiError(400, "Error While Uploading On Cloudinary");
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        { $set: { avatar: avatar.url } },
        { new: true }
    ).select("-password");
    return res
        .status(200)
        .json(new ApiResponse(200, "Updated User Avatar", user));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params;
    if (!username.trim()) throw new ApiError(400, "Username Is Missing");

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase(),
            },
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers",
            },
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo",
            },
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers",
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo",
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false,
                    },
                },
            },
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1,
            },
        },
    ]);
    if (!channel.length) throw new ApiError(400, "Channel Does not Exists");
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "User Channel Fetched Successfully",
                channel[0]
            )
        );
});

const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user?._id),
            },
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
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
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "watchHistory Fetched Successfully",
                user[0].watchHistory
            )
        );
});

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserCoverImage,
    updateUserAvatar,
    getUserChannelProfile,
    getWatchHistory,
};
