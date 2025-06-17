import { asynchandler } from "../utils/asynchandler.js"
import { User } from "../models/user.model.js"
import { ApiErr } from "../utils/ApiErr.js"
import { ApiRes } from "../utils/ApiRes.js"
import { Project } from "../models/project.model.js"
import { console } from "inspector"
import sendEmail from "../utils/Sendemail.js"
import crypto from 'crypto'; // Node.js built-in module for cryptographic functions

const createProject = asynchandler(async (req, res) => {
    const { title, description,startDate,endDate } = req.body
    const currentuser = await User.findById(req.user._id)
    if (!currentuser) {
        throw new ApiErr(404, "User not found")
    }
    const CreatedBy = currentuser._id;
    const newProject = await Project.create({
        title,
        description,
        CreatedBy,
        startDate,
        endDate,
        Members: [
            {
                user: CreatedBy,
                role: "admin",
                status:"created"
            }
        ] // The creator as the first member and role Admin and status created
    })
    currentuser.projects.push({
        projectID: newProject._id,
        role: "admin",
        status: "created"
    })
    await currentuser.save()
    if (newProject) {
        return res.status(201).json(
            new ApiRes(200, newProject, "Successfully created project")
        )
    } else {
        throw new ApiErr(500, "Something went wrong while creating the project")
    }
})

const addMember = asynchandler(async (req, res) => {
    const { useremail, role } = req.body;
    const projectID = req.params.projectID;

    if (!useremail || !projectID) {
        throw new ApiErr(400, "User email and project ID are required");
    }

    const project = await Project.findById(projectID);
    if (!project) {
        throw new ApiErr(404, "Project not found");
    }

    const user = await User.findOne({ email: useremail });

    if (!user) {
        throw new ApiErr(404, "User not found");
    }

    const userID = user._id;

    // Check if the user is already a member of the project (excluding rejected status)
    const isMember = project.Members.some(
        (member) => member.user.toString() === userID.toString() && member.status !== "rejected"
    );

    if (isMember) {
        throw new ApiErr(409, "User is already a member of the project or has a pending/accepted invitation");
    }

    try {
        // Generate a unique invitation token
        const invitationToken = crypto.randomBytes(32).toString('hex');
        const hashedInvitationToken = crypto.createHash('sha256').update(invitationToken).digest('hex');
        const invitationTokenExpires = Date.now() + 3600000 * 24 * 7; // Token valid for 7 days (adjust as needed)

        // Add user to the project with 'unseen' status and the invitation token details
        project.Members.push({
            user: userID,
            role: role,
            status: "unseen", // Explicitly set status to unseen
            invitationToken: hashedInvitationToken, // Store the hashed token
            invitationTokenExpires: invitationTokenExpires
        });
        await project.save();

        // Add project to the user's projects with 'unseen' status
        // We don't necessarily need to store the token here, as the source of truth for acceptance will be the project's member list
        user.projects.push({
            projectID: projectID,
            role: role,
            status: "unseen"
        });
        await user.save();

        // **Construct the invitation link with the raw token**
        // The token needs to be raw in the URL for the frontend to read it
        const invitationLink = `${process.env.FRONTEND_ORIGIN}/project/accept-invitation/${projectID}/${invitationToken}`; // IMPORTANT: Include the token

        // **Send the invitation email**
        const emailSubject = `Project Invitation: You've been invited to ${project.title}`;
        const emailMessage = `
            <p>Dear ${user.name},</p>
            <p>You have been invited to join the project: <strong>${project.title}</strong> as a <strong>${role}</strong>.</p>
            <p>To accept the invitation, please click on the link below:</p>
            <p><a href="${invitationLink}">Accept Invitation</a></p>
            <p>This link is valid for 7 days.</p>
            <p>If you did not expect this invitation, you can ignore this email.</p>
            <p>Thanks,</p>
            <p>The Project Team</p>
        `;

        await sendEmail({
            email: useremail,
            subject: emailSubject,
            message: emailMessage,
        });

        return res.status(200).json(
            new ApiRes(200, project, "Successfully added member to the project and sent invitation email")
        );
    } catch (error) {
        console.error("Error in addMember controller:", error);
        if (error.name === 'ValidationError') {
            throw new ApiErr(400, error.message);
        }
        throw new ApiErr(500, error.message || "Something went wrong while adding member to the project");
    }
});
const removeMember = asynchandler(async (req, res) => {
    // Correctly destructure 'userId' from req.body
    const { userId } = req.body; 
    console.log(userId, "in removeMember"); // Log userId directly

    const projectID = req.params.projectID;

    // Use userId for validation
    if (!userId || !projectID) {
        throw new ApiErr(400, "User ID and project ID are required");
    }

    const project = await Project.findById(projectID);
    if (!project) {
        throw new ApiErr(404, "Project not found");
    }

    // Find the user by the correctly extracted userId
    const user = await User.findById(userId);

    if (!user) {
        throw new ApiErr(404, "User not found");
    }

    const memberIndex = project.Members.findIndex(
        (member) => member.user.toString() === userId.toString() // Use userId here
    );

    if (memberIndex === -1) {
        throw new ApiErr(404, "Member not found in the project");
    }

    try {
        project.Members.splice(memberIndex, 1);
        await project.save();

        const userProjectIndex = user.projects.findIndex(
            (proj) => proj.projectID.toString() === projectID
        );
        if (userProjectIndex !== -1) {
            user.projects.splice(userProjectIndex, 1);
            await user.save();
        }

        return res.status(200).json(
            new ApiRes(200, project, "Successfully removed member from the project")
        );
    } catch (error) {
        // Log the actual error for debugging on the server side
        console.error("Error during member removal:", error); 
        throw new ApiErr(500, "Something went wrong while removing member from the project");
    }
});


const deleteProject = asynchandler(async (req, res) => {
    const projectID = req.params.projectID
    if (!projectID) {
        throw new ApiErr(400, "Error fetching project try again after some time")
    }
    const project = await Project.findByIdAndDelete(projectID)
    if (!project) {
        throw new ApiErr(404, "Project not found")
    }
    const members = project.Members.map(member => member.user)
    await User.updateMany(
        { _id: { $in: members } },
        { $pull: { projects: { projectID: projectID } } }
    )
    project.deleteOne()
    return res.status(200).json(
        new ApiRes(200, null, "Successfully deleted the project")
    )
})

const updateProject = asynchandler(async (req, res) => {
    const { title, description,endDate,overallStatus } = req.body
    const projectID = req.params.projectID
    if (!projectID) {
        throw new ApiErr(400, "Error fetching project try again after some time")
    }
    const project = await Project.findById(projectID)
    if (!project) {
        throw new ApiErr(404, "Project not found")
    }
    console.log(description, title)
    if (title) project.title = title
    if (endDate) project.endDate = endDate
    if (description) project.description = description
    if (overallStatus) project.overallStatus = overallStatus
    await project.save()
    return res.status(200).json(
        new ApiRes(200, project, "Successfully updated the project")
    )
})

const acceptInvitation= asynchandler(async (req, res) => {
    const { projectID, token } = req.params; 

    if (!projectID || !token) {
        throw new ApiErr(400, "Project ID and invitation token are required");
    }

    // Hash the incoming token to compare with the stored hashed token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const project = await Project.findById(projectID);
    if (!project) {
        throw new ApiErr(404, "Project not found or invitation invalid.");
    }

    // Find the member using the hashed token and check expiry
    const memberIndex = project.Members.findIndex(
        (member) =>
            member.invitationToken === hashedToken &&
            member.status === 'unseen' && 
            member.invitationTokenExpires > Date.now()
    );

    if (memberIndex === -1) {
        throw new ApiErr(400, "Invitation is invalid, expired, or already accepted/rejected.");
    }

    const memberToUpdate = project.Members[memberIndex];
    const userID = memberToUpdate.user;

    const user = await User.findById(userID);
    if (!user) {
        
        throw new ApiErr(404, "Associated user for this invitation not found.");
    }

    // Update status in Project model
    memberToUpdate.status = 'accepted';
    memberToUpdate.invitationToken = undefined; // Clear the token after use
    memberToUpdate.invitationTokenExpires = undefined; // Clear the expiry after use
    await project.save();

    // Update status in User model
    const userProjectIndex = user.projects.findIndex(
        (proj) => proj.projectID.toString() === projectID && proj.status === 'unseen'
    );

    if (userProjectIndex !== -1) {
        user.projects[userProjectIndex].status = 'accepted';
        await user.save();
    } else {
        console.warn(`User ${user._id} did not have a pending invitation for project ${projectID} in their projects array.`);
    }

    // After successfully accepting, redirecting the user to a login page
    // Frontend will handle this redirection based on the response.
    return res.status(200).json(
        new ApiRes(200, { projectTitle: project.title }, "Successfully accepted the invitation. Please login to continue.")
    );
});




const getproject=asynchandler(async (req, res) => {
    const projectID = req.params.projectID
    if (!projectID) {
        throw new ApiErr(400, "Project ID is required")
    }
    const project = await Project.findById(projectID)
    if (!project) {
        throw new ApiErr(404, "Project not found")
    }
    return res.status(200).json(
        new ApiRes(200, project, "Successfully fetched project details")
    )
})

export {
    createProject,
    addMember,
    removeMember,
    deleteProject,
    updateProject,
    acceptInvitation,
    getproject
}