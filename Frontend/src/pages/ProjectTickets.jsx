import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Kanban, PlusCircle, XCircle, LayoutDashboard, CalendarDays, ChevronRight } from 'lucide-react'; // Added ListChecks for project summary
import { format } from 'date-fns';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;


// Helper functions (reused from InsideProject.jsx)
const getPriorityColorClass = (priority) => {
  switch (priority?.toLowerCase()) {
    case 'high':
      return 'bg-red-100 text-red-800';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800';
    case 'low':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getTicketStatusColorClass = (status) => {
  switch (status?.toLowerCase()) {
    case 'todo':
      return 'bg-red-100 text-red-800';
    case 'in_progress':
      return 'bg-yellow-100 text-yellow-800';
    case 'done':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// Data Fetching Functions
const fetchUserDetailsById = async (userId) => {
  if (!userId) return null;
  try {
    const res = await axios.get(`${BACKEND_URL}/user/${userId}`, { withCredentials: true });
    return res.data.data;
  } catch (err) {
    console.error(`Error fetching user details for ID ${userId}:`, err);
    return null;
  }
};

const fetchProjectDetailsForMembers = async ({ queryKey }) => {
  const [, projectID] = queryKey;
  if (!projectID) return null;

  try {
    const projectRes = await axios.get(`${BACKEND_URL}/project/${projectID}`, { withCredentials: true });
    const project = projectRes.data.data;

    // Fetch details for each member to get their names/emails for assignee suggestions
    const membersWithDetails = await Promise.all(
      (project.Members || []).map(async (member) => {
        const userDetails = await fetchUserDetailsById(member.user);
        return {
          _id: member.user, // Important: keep the user ID for assignment
          userName: userDetails ? (userDetails.name || userDetails.username || userDetails.email) : 'Unknown User',
          userEmail: userDetails ? userDetails.email : 'N/A',
          role: member.role // Also useful to know the role
        };
      })
    );
    return { ...project, Members: membersWithDetails };
  } catch (err) {
    console.error(`Error fetching project details for ID ${projectID}:`, err);
    throw err; // Re-throw to be caught by useQuery
  }
};

const fetchProjectTickets = async ({ queryKey }) => {
  const [, projectID] = queryKey;
  if (!projectID) return [];

  try {
    const ticketRes = await axios.get(`${BACKEND_URL}/project/${projectID}/tickets`, { withCredentials: true });
    const tickets = ticketRes.data.data;

    const ticketsWithAssigneeNames = await Promise.all(
      tickets.map(async (ticket) => {
        let assigneeName = "Unassigned";
        if (ticket.assignee) {
          const assigneeDetails = await fetchUserDetailsById(ticket.assignee);
          assigneeName = assigneeDetails ? (assigneeDetails.name || assigneeDetails.username || assigneeDetails.email) : 'Unknown Assignee';
        }
        return { ...ticket, assigneeName };
      })
    );
    return ticketsWithAssigneeNames;
  } catch (err) {
    console.error(`Error fetching tickets for project ${projectID}:`, err);
    throw err; // Re-throw to be caught by useQuery
  }
};

// Fetch tickets assigned to the current user
const fetchMyTickets = async ({ queryKey }) => {
  const [, projectID] = queryKey;
  if (!projectID) return [];
  try {
    const res = await axios.get(`${BACKEND_URL}/project/${projectID}/mytickets`, { withCredentials: true });
    const myTickets = res.data.data;
    // We still need assigneeName populated on the frontend if the backend doesn't populate it
    const myTicketsWithAssigneeNames = await Promise.all(
      myTickets.map(async (ticket) => {
        let assigneeName = "Unassigned";
        if (ticket.assignee) {
          const assigneeDetails = await fetchUserDetailsById(ticket.assignee);
          assigneeName = assigneeDetails ? (assigneeDetails.name || assigneeDetails.username || assigneeDetails.email) : 'Unknown Assignee';
        }
        return { ...ticket, assigneeName };
      })
    );
    return myTicketsWithAssigneeNames;
  } catch (err) {
    console.error(`Error fetching tickets assigned to current user for project ${projectID}:`, err);
    throw err;
  }
};


const ProjectTickets = () => {
  const { projectID } = useParams();
  const navigate = useNavigate(); // Initialize useNavigate
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCreateTicketModal, setShowCreateTicketModal] = useState(false);

  // Form states for creating a ticket
  const [ticketTitle, setTicketTitle] = useState('');
  const [ticketDescription, setTicketDescription] = useState('');
  const [ticketPriority, setTicketPriority] = useState('low'); // Default priority
  const [ticketDueDate, setTicketDueDate] = useState(''); // New state for DueDate
  const [assigneeSearchInput, setAssigneeSearchInput] = useState('');
  const [assigneeSuggestions, setAssigneeSuggestions] = useState([]);
  const [selectedAssignee, setSelectedAssignee] = useState(null); // Stores { _id, userName, userEmail }

  // State for filtering and sorting
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest', 'oldest', 'assignedToMe', 'all' - Renamed to sortOrder
  const [statusFilter, setStatusFilter] = useState('all'); // New state for status filter

  const queryClient = useQueryClient();

  // Query for all tickets
  const { data: tickets, isLoading: isLoadingTickets, isError: isErrorTickets, error: ticketsError } = useQuery({
    queryKey: ['projectTickets', projectID],
    queryFn: fetchProjectTickets,
    enabled: !!projectID,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true, // Ensures re-fetch on window focus for dynamic updates
  });

  // Query for tickets assigned to current user
  const { data: myTickets, isLoading: isLoadingMyTickets, isError: isErrorMyTickets, error: myTicketsError } = useQuery({
    queryKey: ['myTickets', projectID],
    queryFn: fetchMyTickets,
    enabled: !!projectID && sortOrder === 'assignedToMe', // Enabled if sortOrder is 'assignedToMe'
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  const { data: projectDetails, isLoading: isLoadingProjectDetails, isError: isErrorProjectDetails, error: projectDetailsError } = useQuery({
    queryKey: ['projectDetailsForMembers', projectID], // Separate query key for members
    queryFn: fetchProjectDetailsForMembers,
    enabled: !!projectID,
    staleTime: 5 * 60 * 1000,
  });

  const loading = isLoadingTickets || isLoadingProjectDetails || isLoadingMyTickets;
  const isError = isErrorTickets || isErrorProjectDetails || myTicketsError;
  const errorMessage = ticketsError?.message || projectDetailsError?.message || myTicketsError?.message || "An unknown error occurred.";


  useEffect(() => {
    // Debounce assignee search
    const debounceTimeout = setTimeout(() => {
      if (assigneeSearchInput.trim().length > 0 && projectDetails?.Members) {
        const filteredSuggestions = projectDetails.Members.filter(member =>
          member.userName.toLowerCase().includes(assigneeSearchInput.toLowerCase()) ||
          member.userEmail.toLowerCase().includes(assigneeSearchInput.toLowerCase())
        );
        setAssigneeSuggestions(filteredSuggestions);
      } else {
        setAssigneeSuggestions([]);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(debounceTimeout);
  }, [assigneeSearchInput, projectDetails?.Members]);

  const handleAssigneeSelect = (assignee) => {
    setSelectedAssignee(assignee);
    setAssigneeSearchInput(assignee.userName); // Display name in input
    setAssigneeSuggestions([]); // Clear suggestions
  };

  const closeCreateTicketModal = () => {
    setShowCreateTicketModal(false);
    // Reset form fields
    setTicketTitle('');
    setTicketDescription('');
    setTicketPriority('low');
    setTicketDueDate(''); // Reset DueDate
    setAssigneeSearchInput('');
    setSelectedAssignee(null);
    setAssigneeSuggestions([]);
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!selectedAssignee) {
      alert('Please select an assignee from the suggestions.');
      return;
    }

    try {
      await axios.post(
        `${BACKEND_URL}/project/${projectID}/createticket`,
        {
          title: ticketTitle,
          description: ticketDescription,
          priority: ticketPriority,
          assignee: selectedAssignee._id, // Send the actual user ID
          DueDate: ticketDueDate || undefined, // Include DueDate, send undefined if empty
        },
        { withCredentials: true }
      );
      alert('Ticket created successfully!');
      // Invalidate to refetch tickets dynamically
      queryClient.invalidateQueries(['projectTickets', projectID]);
      queryClient.invalidateQueries(['myTickets', projectID]); // Invalidate myTickets query too
      closeCreateTicketModal();
    } catch (err) {
      console.error('Error creating ticket:', err);
      // More user-friendly error message
      alert('Failed to create ticket. Please ensure all fields are valid and you have permission.');
    }
  };

  // --- Filtering and Sorting Logic ---
  const displayedTickets = React.useMemo(() => {
    let sourceTickets = [];
    if (sortOrder === 'assignedToMe') {
      sourceTickets = myTickets || [];
    } else {
      sourceTickets = tickets || [];
    }

    let filteredByStatus = [...sourceTickets];
    if (statusFilter !== 'all') {
      filteredByStatus = filteredByStatus.filter(ticket => ticket.status === statusFilter);
    }


    let sorted = [...filteredByStatus];
    // Sort based on sortOrder
    if (sortOrder === 'oldest') {
      sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else { // 'newest', 'all', 'assignedToMe' (after filtering for assignedToMe)
      sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return sorted;
  }, [tickets, myTickets, sortOrder, statusFilter]);


  return (
    <div className="flex h-screen bg-gray-50 font-inter">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex-1 overflow-y-auto p-4 md:p-8 transition-all duration-300 ease-in-out">
        <Topbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} title="Project Tickets" />

        {isError ? (
          <div className="flex justify-center items-center h-64">
            <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg shadow-md animate-fadeIn" role="alert">
              <strong className="font-bold text-lg">Error:</strong>
              <span className="block sm:inline ml-2">{errorMessage}</span>
            </div>
          </div>
        ) : loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin-slow text-blue-500 h-16 w-16" />
          </div>
        ) : (
          <>
            {/* Tickets Header and Buttons */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 animate-fadeIn transition-all duration-500">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Kanban className="text-blue-600" /> Tickets for Project: <span className="line-clamp-1">{projectDetails?.title || projectID}</span>
                </h2>
                <div className="flex flex-wrap gap-3"> 
                  <button
                    onClick={() => navigate(`/project/${projectID}`)} 
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
                  >
                   <ChevronRight className="w-5 h-5 -rotate-180" /> Project Summary
                  </button>
                  <button
                    onClick={() => navigate(`/${projectID}/board`)} 
                    className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
                  >
                    <LayoutDashboard className="w-5 h-5" /> Board
                  </button>
                  <button
                    onClick={() => setShowCreateTicketModal(true)}
                    className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
                  >
                    <PlusCircle className="w-5 h-5" /> Create New Ticket
                  </button>
                </div>
              </div>

              {/* Filter Options Dropdowns */}
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <label htmlFor="sort-filter" className="text-gray-700 font-medium">Sort By:</label>
                <select
                  id="sort-filter"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="assignedToMe">
                    Assigned to Me
                  </option>
                  <option value="all">All Tickets</option>
                </select>

                <label htmlFor="status-filter" className="text-gray-700 font-medium ml-4">Status:</label>
                <select
                  id="status-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                >
                  <option value="all">All Statuses</option>
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>

              {/* Display Tickets */}
              {displayedTickets?.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No tickets found matching your criteria.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayedTickets.map((ticket) => ( 
                    <div
                      key={ticket._id} 
                      className="bg-white rounded-xl shadow-lg p-6 space-y-3 border border-gray-200
                                 hover:shadow-xl hover:scale-102 transition-all duration-300 ease-in-out
                                 transform animate-fadeIn relative pb-12" 
                    >
                      <h3 className="text-xl font-bold text-gray-800 border-b-2 border-blue-500 pb-2 mb-2 line-clamp-1">
                        {ticket.title}
                      </h3>
                      <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">{ticket.description}</p>
                      <div className="grid grid-cols-2 gap-y-2 text-sm text-gray-700">
                        <p>
                          <span className="font-semibold text-blue-700">Priority:</span>
                          <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColorClass(ticket.priority)}`}>
                            {ticket.priority}
                          </span>
                        </p>
                        <p>
                          <span className="font-semibold text-blue-700">Status:</span>
                          <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-medium ${getTicketStatusColorClass(ticket.status)}`}>
                            {ticket.status}
                          </span>
                        </p>
                      </div>
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold text-blue-700">Assignee:</span> {ticket.assigneeName}
                      </p>
                      {ticket.DueDate && (
                        <p className="text-sm text-gray-700 flex items-center gap-1">
                          <CalendarDays className="w-4 h-4 text-gray-500" />
                          <span className="font-semibold text-blue-700">Due Date:</span> {format(new Date(ticket.DueDate), 'PPP')}
                        </p>
                      )}
                      <p className="text-sm text-gray-500 mt-2">
                        Created: {ticket.createdAt ? format(new Date(ticket.createdAt), 'PPP') : 'N/A'}
                      </p>

                      {/* View Details Button */}
                      <div className="absolute bottom-4 right-4">
                        <button
                          onClick={() => navigate(`/tickets/${ticket._id}`)}
                          className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg
                                     transition-colors duration-200 flex items-center gap-1 shadow-md
                                     focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75"
                        >
                          View Details <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Create Ticket Modal */}
      {showCreateTicketModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg animate-scaleIn">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <h3 className="text-2xl font-bold text-gray-800">Create New Ticket</h3>
              <button onClick={closeCreateTicketModal} className="text-gray-500 hover:text-gray-700 text-3xl font-bold leading-none">
                <XCircle className="w-8 h-8"/>
              </button>
            </div>
            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label htmlFor="ticket-title" className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  id="ticket-title"
                  value={ticketTitle}
                  onChange={(e) => setTicketTitle(e.target.value)}
                  placeholder="Ticket title (e.g., Bug: Login failed)"
                  className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="ticket-description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  id="ticket-description"
                  value={ticketDescription}
                  onChange={(e) => setTicketDescription(e.target.value)}
                  rows="4"
                  placeholder="Detailed description of the issue or task"
                  className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                  required
                ></textarea>
              </div>
              <div>
                <label htmlFor="ticket-priority" className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  id="ticket-priority"
                  value={ticketPriority}
                  onChange={(e) => setTicketPriority(e.target.value)}
                  className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label htmlFor="ticket-duedate" className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input
                  type="date"
                  id="ticket-duedate"
                  value={ticketDueDate}
                  onChange={(e) => setTicketDueDate(e.target.value)}
                  className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="ticket-assignee" className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
                <input
                  type="text"
                  id="ticket-assignee"
                  value={assigneeSearchInput}
                  onChange={(e) => {
                    setAssigneeSearchInput(e.target.value);
                    setSelectedAssignee(null); // Clear selected assignee if input changes
                  }}
                  placeholder="Search project members by name or email"
                  className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoComplete="off"
                />
                {assigneeSuggestions.length > 0 && !selectedAssignee && assigneeSearchInput.trim().length > 0 && (
                  <ul className="border border-gray-200 rounded-lg bg-white mt-2 max-h-48 overflow-y-auto shadow-md">
                    {assigneeSuggestions.map((member) => (
                      <li
                        key={member._id}
                        onClick={() => handleAssigneeSelect(member)}
                        className="px-4 py-2 cursor-pointer hover:bg-blue-50 text-gray-800 text-sm border-b border-gray-100 last:border-b-0"
                      >
                        {member.userName} ({member.userEmail}) <span className="text-gray-500 capitalize">({member.role})</span>
                      </li>
                    ))}
                  </ul>
                )}
                {selectedAssignee && (
                  <p className="mt-2 text-sm text-gray-600">
                    Assigned to: <strong className="text-blue-700">{selectedAssignee.userName} ({selectedAssignee.userEmail})</strong>
                  </p>
                )}
              </div>
              <div className="mt-6 flex justify-end space-x-3 border-t pt-4">
                <button
                  type="button"
                  onClick={closeCreateTicketModal}
                  className="px-5 py-2.5 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium transition duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!ticketTitle || !ticketDescription || !selectedAssignee}
                >
                  Create Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tailwind CSS Customizations and Animations */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

        .font-inter {
          font-family: 'Inter', sans-serif;
        }

        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }

        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out forwards;
        }

        .animate-spin-slow {
          animation: spin 1.5s linear infinite;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .line-clamp-1 {
            display: -webkit-box;
            -webkit-line-clamp: 1;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }

        .line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }

        .line-clamp-3 {
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default ProjectTickets;