import { asynchandler } from "../utils/asynchandler.js"
import { User } from "../models/user.model.js"
import { ApiErr } from "../utils/ApiErr.js"
import { ApiRes } from "../utils/ApiRes.js"
import { Ticket } from "../models/ticket.model.js"

const generate = async (userid) => {
    try {
        const currentuser = await User.findById(userid)
        const accesstoken = currentuser.generateaccesstoken()
        const refreshtoken = currentuser.generaterefreshtoken()
        currentuser.refreshtoken = refreshtoken
        await currentuser.save({ validateBeforeSave: false })
        return { accesstoken, refreshtoken }

    } catch (error) {
        console.log(error)
        throw new ApiErr(500, "Something went wrong while generating token");

    }
}

const registeruser = asynchandler(async (req, res) => {
    const { name, email, password } = req.body
    if (
        [name, email, password].some((value) => value?.trim() === "")
    ) {
        throw new ApiErr(400, "Name, email and password are required")
    }
    const olduser = await User.findOne({ email })
    if (olduser) {
        throw new ApiErr(409, "User already exists Try logging in instead")
    }
    const newuser = await User.create({
        name,
        email,
        password
    })
    const creatednewuser = await User.findById(newuser._id).select("-password -refreshtoken")
    if (creatednewuser) {
        return res.status(201).json(
            new ApiRes(200, creatednewuser, "Successfully created user")
        )
    }
    else {
        throw new ApiErr(500, "Something went wrong while registering the user please try after sometime")
    }
})

const loginuser = asynchandler(async (req, res) => {
    const { email, password } = req.body
    if (
        [email, password].some((value) => value?.trim() === "")
    ) {
        throw new ApiErr(400, "Email and password are required")
    }
    const currentuser = await User.findOne({ email })
    if (!currentuser) {
        throw new ApiErr(404, "User not found Try registering first")
    }
    const isPasswordCorrect = await currentuser.isPasswordcorrect(password)
    if (!isPasswordCorrect) {
        throw new ApiErr(401, "Invalid credentials")
    }
    const tokens = await generate(currentuser._id)
    const options = {
        httpOnly: true,
        secure: true
    }
    return res.status(200)
        .cookie("refreshtoken", tokens.refreshtoken, options)
        .cookie("accesstoken", tokens.accesstoken, options)
        .json(
            new ApiRes(200, { 
                currentuser, 
                accesstoken: tokens.accesstoken, 
                refreshtoken: tokens.refreshtoken,
                redirectUrl: '/user/dashboard'
            }, "Successfully logged in")
        )
})

const updateuser=asynchandler(async (req,res) => {
    const {email,password,name,profilePic} =req.body 
    const user=await User.findById(req.user._id)
    if(!user) throw new ApiErr(res, 400, "User not found")
    if(email) user.email=email
    if(name) user.name=name
    if(password) user.password=password
    if(profilePic) user.profilePic=profilePic
    await user.save()
    res.status(200).json(new ApiRes(200, user, "User updated successfully"))
})


const logoutuser = asynchandler(async (req, res) => {
    const { refreshtoken, accesstoken } = req.cookies
    if (!refreshtoken || !accesstoken) {
        throw new ApiErr(400, "You are not logged in")
    }
    const currentuser = await User.findOne({ refreshtoken })
    if (!currentuser) {
        throw new ApiErr(404, "User not found")
    }
    currentuser.refreshtoken = null
    await currentuser.save({ validateBeforeSave: false })
    return res.status(200)
        .clearCookie("refreshtoken")
        .clearCookie("accesstoken")
        .json(new ApiRes(200, {}, "Successfully logged out"))
})

const refreshaccesstoken = asynchandler(async (req, res) => {
    console.log("Cookies received:", req.body.refreshtoken);
    const { refreshtoken } = req.body
    if (!refreshtoken) {
        throw new ApiErr(400, "You are not logged in")
    }
    console.log(refreshtoken,"in refreshaccesstoken")
    const currentuser = await User.findOne({ refreshtoken })
    if (!currentuser) {
        throw new ApiErr(404, "User not found")
    }
    console.log(currentuser,'in refreshaccesstoken')
    const newaccesstoken = await currentuser.generateaccesstoken()
    const newrefreshtoken = await currentuser.generaterefreshtoken()
    const options = {
        httpOnly: true,
        secure: true
    }
    console.log(newaccesstoken,"in refreshaccesstoken")
    return res.status(200)
        .cookie("accesstoken", newaccesstoken, options)
        .cookie("refreshtoken", newrefreshtoken, options)
        .json(
            new ApiRes(200, { accesstoken: newaccesstoken, refreshtoken: refreshtoken }, "Successfully refreshed access token")
        )
})


const getpendingInvitations = asynchandler(async (req, res) => {
    const currentuser = await User.findById(req.user._id)
    if (!currentuser) {
        throw new ApiErr(404, "User not found")
    }
    const pendingInvitations = currentuser.projects.filter(proj => proj.status === 'unseen')
    return res.status(200).json(
        new ApiRes(200, pendingInvitations, "Successfully fetched pending invitations")
    )
})

// get tickets assigned to user
const gettickets_assigned = asynchandler(async (req, res) => {
    const user = await User.findById(req.user._id)
    if (!user) throw new ApiErr(res, 400, "User not found")
    const tickets = await Ticket.find({ assignee: user._id })
 const totalTickets = tickets.length;
  const resolvedTickets = tickets.filter((ticket) => ticket.status === "resolved").length;
    res.status(200).json(new ApiRes(200,tickets, "Tickets assigned to user fetched successfully"))
})

const get_length_of_tickets = asynchandler(async (req, res) => {
    const user = await User.findById(req.user._id)
    if (!user) throw new ApiErr(res, 400, "User not found")
    const tickets = await Ticket.find({ assignee: user._id })
    const totalTickets = tickets.length;
    const resolvedTickets = tickets.filter((ticket) => ticket.status === "done").length;
    const in_progressTickets = tickets.filter((ticket) => ticket.status === "in_progress").length;
    const todoTickets = tickets.filter((ticket) => ticket.status === "todo").length;
    res.status(200).json(new ApiRes(200, { totalTickets,resolvedTickets,todoTickets,in_progressTickets }, "Length of tickets fetched successfully"))
})

const get_alluser_emails = asynchandler(async (req, res) => {
    const users = await User.find({})
    const emails = users.map((user) => user.email)
    res.status(200).json(new ApiRes(200, emails, "All users' emails fetched successfully"))
})

const getuser= asynchandler(async (req, res) => {
    const user = await User.findById(req.params.userID)
    if (!user) throw new ApiErr(res, 400, "User not found")
    res.status(200).json(new ApiRes(200, user, "User fetched successfully"))
})

const getprojects_user=asynchandler(async (req,res) => {
    const user=await User.findById(req.user._id)
    if(!user){ throw new ApiErr(res, 400, "User not found")}
    const projects=user.projects
    // console.log(projects,"in getprojects_user")
    res.status(200).json(new ApiRes(200, projects, "Projects fetched successfully"))
})


export {
    registeruser,
    loginuser,
    logoutuser,
    refreshaccesstoken,
    getpendingInvitations,
    gettickets_assigned,
    get_length_of_tickets,
    get_alluser_emails,
    getuser,
    getprojects_user,
    updateuser
}
