import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
    const { fullName, username, email, password } = req.body;
    if (
        [fullName, username, email, password].some(
            (field) => field?.trim() === ""
        )
    ) {
        throw new ApiError(400, "All Field Are Required");
    }
    const existedUser = User.findOne({
        $or: [username, email],
    });
    console.log(existedUser);
    if (existedUser) {
        throw new ApiError(409, "User with username or email already exists");
    }
    const avatarfilePath = req.files?.avatar[0].path;
    const coverImagefilePath = req.files?.coverImage[0].path;
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

    const userCreated = User.findById(user._id).select(
        "-password -refreshToken"
    );

    if (!userCreated) {
        throw new ApiError(500, "Something Went Wrong While Regestering User");
    }
    res.status(201).json(
        new ApiResponse(201, "User Registerd Successfully", userCreated)
    );
});

export { registerUser };
