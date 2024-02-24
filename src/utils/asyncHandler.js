import { ApiError } from "./ApiError.js";

const asyncHandler = (requestHandler) => {
    return async (req, res, next) => {
        try {
            await requestHandler(req, res, next);
        } catch (err) {
            if (err instanceof ApiError) {
                res.status(err.statusCode).json({ error: err.message });
            } else {
                // For non-ApiError errors, provide a generic error message
                res.status(500).json({ error: "Internal Server Error" });
            }
        }
    };
};
export { asyncHandler };
