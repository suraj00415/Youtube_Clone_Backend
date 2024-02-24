import { Router } from "express";
import {
    getLikedVideos,
    toggleCommentLike,
    toggleVideoLike,
    toggleTweetLike,
    getLikesByVideoId,
    getVideosLikedByUser,
} from "../controllers/like.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();
router.route("/toggle/v/:videoId").post(verifyJWT, toggleVideoLike);
router.route("/toggle/c/:commentId").post(verifyJWT, toggleCommentLike);
router.route("/toggle/t/:tweetId").post(verifyJWT, toggleTweetLike);
router.route("/user").get(verifyJWT, getVideosLikedByUser);

router.route("/videos").get(getLikedVideos);
router.route("/video/:videoId").get(getLikesByVideoId);

export default router;