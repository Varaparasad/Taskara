import {
    createProject,
    addMember,
    removeMember,
    deleteProject,
    updateProject,
    acceptInvitation,
    getproject
} from "../controllers/Projects.controller.js";
import {
    gettickets_project,
    createticket,
    gettickets_user
} from "../controllers/Ticket.controller.js";
import { Router } from "express";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";
const route = Router();


route.get('/:projectID', verifyJWT, getproject);
route.post('/create', verifyJWT, createProject);
route.put('/:projectID/addmember', verifyJWT, authorizeRoles(['admin']), addMember);

route.put('/accept-invitation/:projectID/:token', acceptInvitation);
route.delete('/:projectID/removemember', verifyJWT, authorizeRoles(['admin']), removeMember);

route.delete('/:projectID', verifyJWT, authorizeRoles(['admin']), deleteProject);
route.put('/:projectID', verifyJWT, authorizeRoles(['admin']), updateProject);

//tickets
route.get('/:projectID/tickets',verifyJWT, gettickets_project)
route.get('/:projectID/mytickets',verifyJWT, gettickets_user)
route.post('/:projectID/createticket', verifyJWT, authorizeRoles(['admin','developer']), createticket)

export default route;
