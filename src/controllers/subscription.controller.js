import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const userId = req.user?._id;
    const isValidChannelId = isValidObjectId(channelId);
    if (!isValidChannelId) throw new ApiError(400, "Invalid ChannelId ");
    if (!userId) throw new ApiError(401, "Invalid User");
    const channel = await User.findById(channelId);
    if (!channel) throw new ApiError(404, "Channel Not Found");
    // for subscribing
    const isSubscribed = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId),
                subscriber: new mongoose.Types.ObjectId(userId),
            },
        },
    ]);
    if (isSubscribed.length) {
        const deleteId = isSubscribed[0]?._id;
        await Subscription.findByIdAndDelete(deleteId);
        return res
            .status(200)
            .json(new ApiResponse(200, "UnSubscribed Successfully"));
    } else {
        const newSubscription = await Subscription.create({
            channel: channelId,
            subscriber: userId,
        });
        const subscription = await Subscription.findById(newSubscription?._id);
        if (!subscription)
            throw new ApiError(500, "Subscription Unsuccessfully");
        return res
            .status(201)
            .json(
                new ApiResponse(201, "Subscribed Successfully", subscription)
            );
    }
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const isValidChannelId = isValidObjectId(channelId);
    if (!isValidChannelId) throw new ApiError(400, "Invalid ChannelId");
    const channel = await User.findById(channelId);
    if (!channel) throw new ApiError(404, "Channel Not Found");
    const listofSubscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId),
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channel",
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
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriber",
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
        {
            $addFields: {
                channel: {
                    $first: "$channel",
                },
                subscriber: {
                    $first: "$subscriber",
                },
                channelName: {
                    $first: "$channel.fullName",
                },
                subscriberName: {
                    $first: "$subscriber.fullName",
                },
            },
        },
        {
            $project: {
                subscriber: 1,
                channel: 1,
                subscriberName: 1,
                channelName: 1,
            },
        },
    ]);

    if (!listofSubscribers) throw new ApiError(400, "Invalid Channel Id");
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "User Channel Subscriber List Fetched Succesfully",
                listofSubscribers
            )
        );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const isValidSubscriberId = isValidObjectId(channelId);
    if (!isValidSubscriberId) throw new ApiError(400, "Invalid SubscriberId");
    const subscriber = await User.findById(channelId);
    if (!subscriber) throw new ApiError(404, "Subscriber Not Found");
    const subscribedChannels = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(channelId),
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "subscribedTo",
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
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriber",
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
        {
            $addFields: {
                subscribedTo: {
                    $first: "$subscribedTo",
                },
                subscriber: {
                    $first: "$subscriber",
                },
                subscribedToName: {
                    $first: "$subscribedTo.fullName",
                },
                subscriberName: {
                    $first: "$subscriber.fullName",
                },
            },
        },
        {
            $project: {
                subscriber: 1,
                subscribedTo: 1,
                subscriberName: 1,
                subscribedToName: 1,
            },
        },
    ]);
    if (!subscribedChannels) throw new ApiError(400, "Invalid SubscriberId");
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "User Subscribed Channels Fetched",
                subscribedChannels
            )
        );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
