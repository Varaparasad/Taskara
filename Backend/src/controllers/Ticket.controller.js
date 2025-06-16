import { asynchandler } from "../utils/asynchandler.js"
import { User } from "../models/user.model.js"
import { ApiErr } from "../utils/ApiErr.js"
import { ApiRes } from "../utils/ApiRes.js"
import { Project } from '../models/project.model.js'
import { Ticket } from '../models/ticket.model.js'

const createticket = asynchandler(async (req, res) => {
    const { title, description, priority, assignee ,DueDate} = req.body
    const projectID = req.params.projectID
    const project = await Project.findById(projectID)
    if (!project) throw new ApiErr(res, 400, "Project not found")

    const user = await User.findById(assignee.toString())
    if (!user) throw new ApiErr(res, 400, "The assigned user not found")

    const ticket = new Ticket({
        title: title,
        description: description,
        assignee: assignee,
        projectID: projectID,
        priority: priority,
        DueDate:DueDate
    })
    await ticket.save()
    res.status(201).json(new ApiRes(200,ticket, "Ticket created successfully"))
})

const updateticket = asynchandler(async (req, res) => {
    const { title, description, priority } = req.body
    const ticketID = req.params.ticketID
    const ticket = await Ticket.findById(ticketID)
    if (!ticket) throw new ApiErr(res, 400, "Ticket not found")
    
    if (title) ticket.title = title
    if (description) ticket.description = description
    if (priority) ticket.priority = priority
    await ticket.save()
    res.status(200).json(new ApiRes(200,ticket, "Ticket updated successfully"))
})

const deleteticket = asynchandler(async (req, res) => {
    const ticketID = req.params.ticketID
    const ticket = await Ticket.findByIdAndDelete(ticketID)
    if (!ticket) throw new ApiErr(res, 400, "Ticket not found")

    await ticket.deleteOne()

    res.status(200).json(new ApiRes({}, "Ticket deleted successfully"))
})

const getticket = asynchandler(async (req, res) => {
    const ticketID = req.params.ticketID
    const ticket = await Ticket.findById(ticketID)
    if (!ticket) throw new ApiErr(res, 400, "Ticket not found")
    const assignee=ticket?.assignee
    const project=await Project.findById(ticket?.projectID)
    res.status(200).json(new ApiRes(200,{ticket,assignee,project}, "Ticket fetched successfully"))
})


//get all tickets of a project
const gettickets_project = asynchandler(async (req, res) => {
    const projectID = req.params.projectID
    const tickets = await Ticket.find({ projectID: projectID })
    res.status(200).json(new ApiRes(200,tickets, "Tickets of project fetched successfully"))
})

//change status of the ticket
const changestatus = asynchandler(async (req, res) => {
    const ticketID = req.params.ticketID
    const { status } = req.body
    const ticket = await Ticket.findById(ticketID)
    if (!ticket) throw new ApiErr(res, 400, "Ticket not found")
    if (ticket.assignee.toString() != req.user._id.toString()) {
        throw new ApiErr(res, 400, "You are not assigned to this ticket")
    }
    if(status)ticket.status = status
    await ticket.save()
    res.status(200).json(new ApiRes(ticket, "Ticket status updated successfully"))

})


//get all tickets assigned to a user
const gettickets_user = asynchandler(async (req, res) => {
    const userID = req.user._id
    const projectID = req.params.projectID
    if(!projectID) throw new ApiErr(res, 400, "Project ID is required"  )
    if (!userID) throw new ApiErr(res, 400, "User not found")
    const tickets = await Ticket.find({ assignee: userID, projectID: projectID })
    res.status(200).json(new ApiRes(200,tickets, "Tickets assigned to user fetched successfully"))
})


export {
    createticket,
    updateticket,
    deleteticket,
    getticket,
    gettickets_project,
    changestatus,
    gettickets_user
}