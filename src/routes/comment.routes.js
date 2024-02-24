import { Router } from "express";
import {
    addComment,
    deleteComment,
    getUserCommentOnVideoID,
    getVideoComments,
    updateComment,
} from "../controllers/comment.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router.route("/:videoId").get(getVideoComments).post(verifyJWT, addComment);
router
    .route("/c/:commentId")
    .delete(verifyJWT, deleteComment)
    .patch(verifyJWT, updateComment);
router.route("/isComment/:videoId").get(verifyJWT, getUserCommentOnVideoID);

export default router;
