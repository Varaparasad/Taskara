import { Router } from "express";
import {
    updateticket,
    deleteticket,
    getticket,
    changestatus
} from "../controllers/Ticket.controller.js";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";
const route = Router()


route.put('/:ticketID',verifyJWT, authorizeRoles(['admin','developer']), updateticket)
route.delete('/:ticketID',verifyJWT, authorizeRoles(['admin','developer']), deleteticket)

route.get('/:ticketID', verifyJWT, getticket)

route.put('/:ticketID/changestatus',verifyJWT,authorizeRoles(['admin','developer']),changestatus)



export default route