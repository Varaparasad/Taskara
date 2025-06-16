import { Router } from "express";
const route = Router()
import {
    loginuser,
    registeruser,
    logoutuser,
    refreshaccesstoken,
    getpendingInvitations,
    gettickets_assigned,
    get_length_of_tickets,
    get_alluser_emails,
    getuser,
    getprojects_user,
    updateuser
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

route.post('/signup', registeruser)
route.post('/login', loginuser)
route.put('/update',verifyJWT, updateuser)
route.get('/logout', verifyJWT, logoutuser)
route.post('/refreshaccesstoken', refreshaccesstoken)


route.get('/pendingrequests', verifyJWT, getpendingInvitations);
route.get('/data',verifyJWT,(req,res)=>{res.json({success:true,user:req.user})})

route.get('/mytickets',verifyJWT,gettickets_assigned)
route.get('/myticketslength',verifyJWT,get_length_of_tickets)

route.get('/allemails', verifyJWT, get_alluser_emails)
route.get('/myprojects', verifyJWT, getprojects_user)





route.get('/:userID',getuser) 

export default route;