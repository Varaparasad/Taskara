import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import CreateProject from './pages/CreateProject.jsx';
import Tickets from './pages/Tickets.jsx';
import Projects from './pages/Projects.jsx';
import InsideProject from './pages/InsideProject.jsx';
import ProjectTickets from './pages/ProjectTickets.jsx';
import Board from './pages/Board.jsx';
import AcceptInvitation from './pages/AcceptInvitation.jsx';
import TicketDetails from './pages/TicketDetails.jsx';
import Profile from './pages/Profile.jsx';



const App = () => {
    return (
        <Router>
                <Routes>
                    <Route path="/" element={<Login />} />
                    <Route path="/user/dashboard" element={<Dashboard />} />
                    <Route path="/user/profile" element={<Profile />} />
                    <Route path="/projects" element={<Projects />} />
                    <Route path="/project/create" element={<CreateProject />} />
                    <Route path="/user/tickets" element={<Tickets />} />
                    <Route path="/project/:id" element={<InsideProject />} />
                    <Route path="/:projectID/tickets" element={<ProjectTickets />} />
                    <Route path="/:projectID/board" element={<Board />} />
                    <Route path="/project/accept-invitation/:projectID/:token" element={<AcceptInvitation />} />
                    <Route path="/tickets/:ticketID" element={<TicketDetails />} />
                </Routes>
        </Router>
    );
}
export default App;
