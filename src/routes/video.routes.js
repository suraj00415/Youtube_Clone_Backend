import { Router } from "express";
import {
    deleteVideo,
    getAllVideos,
    getVideoById,
    publishAVideo,
    togglePublishStatus,
    updateVideo,
} from "../controllers/video.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/multer.middleware.js";

const router = Router();
// router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file
router.route("/").post(
    verifyJWT,
    upload.fields([
        {
            name: "videoFile",
            maxCount: 1,
        },
        {
            name: "thumbnail",
            maxCount: 1,
        },
    ]),
    publishAVideo
);
router.route("/").get(getAllVideos);
router.route("/:videoId").get(getVideoById);
router.route("/:videoId").delete(verifyJWT, deleteVideo);
router.route("/:videoId/update-video").patch(verifyJWT, updateVideo);
router.route("/:videoId/toggle-publish").patch(verifyJWT, togglePublishStatus);
export default router;
