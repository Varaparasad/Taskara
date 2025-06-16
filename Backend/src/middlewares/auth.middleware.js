import jwt from "jsonwebtoken";
import { asynchandler } from "../utils/asynchandler.js";
import { ApiErr } from "../utils/ApiErr.js";
import { User } from "../models/user.model.js";
import { Ticket } from "../models/ticket.model.js";
import axios from "axios";

export const verifyJWT = asynchandler(async (req, res, next) => {
    // Get the token from cookies or Authorization header
    let token = req.cookies?.accesstoken || req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
        throw new ApiErr(401, "Unauthorized request: No token provided");
    }

    try {
        // Verify the token
        const decodedtoken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        // Find the user in the database
        const user = await User.findById(decodedtoken._id).select("-password -refreshtoken");
        if (!user) {
            throw new ApiErr(401, "User not found");
        }

        // Attach the user to the request object
        req.user = user;
        next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            console.log("Access token expired. Attempting to refresh...");

            try {
                // Attempt to refresh the token
                var temp=req.cookies.refreshtoken
                console.log('refreshing token...hhhhhhhhhhhhhhhhhhhhhhhhhhhhhh',temp );
                const refreshResponse = await axios.post("http://localhost:3000/user/refreshaccesstoken",{refreshtoken:req.cookies.refreshtoken}, {
                    withCredentials:true
                });
                // console.log('refreshing token response', temp);
                const data = await refreshResponse.json();
                console.log('refreshing token data', data);
                if (data.data) {
                    console.log("Token refreshed successfully:", data.data.accesstoken);

                    // Set the new token in the cookies
                    console.log("Retrying original request with new token...");
                    const options = {
                        httpOnly: true,
                        secure: true,
                    };
                    res.cookie("accesstoken", data.data.accesstoken, options);

                    // Retry the original request with the new token
                    token = data.data.accesstoken;
                    // Verify the new token
                    const decodedtoken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
                    const user = await User.findById(decodedtoken._id).select("-password -refreshtoken");
                    if (!user) {
                        throw new ApiErr(401, "User not found");
                    }

                    req.user = user;
                    next();
                } else {
                    throw new ApiErr(401, "Failed to refresh token. Please log in again.");
                }
            } catch (refreshError) {
                console.error("Error refreshing token:", refreshError?.response?.data || refreshError.message || refreshError);
                throw new ApiErr(401, "Session expired. Please log in again.");
            }

        } else {
            throw new ApiErr(401, "Invalid token");
        }
    }
});

export const authorizeRoles = (allowedRoles) => {
    return asynchandler(async (req, res, next) => {
        const user = req.user._id;
        const currentuser = await User.findById(user);

        if (!currentuser) {
            throw new ApiErr(404, "User not found");
        }

        let projectID = req.params.projectID;
        if (!projectID && req.params.ticketID) {
            const ticket = await Ticket.findById(req.params.ticketID);
            if (!ticket) {
                throw new ApiErr(404, "Ticket not found");
            }
            projectID = ticket.projectID;
        }

        const currentproject = currentuser.projects.find(
            (project) => project.projectID.toString() === projectID.toString()
        );

        if (!currentproject) {
            throw new ApiErr(404, "Project not found");
        }

        if (!allowedRoles.includes(currentproject.role)) {
            throw new ApiErr(403, "You are not authorized to perform this action. Try contacting the project admin.");
        }

        next();
    });
};
