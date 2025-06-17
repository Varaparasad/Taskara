import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Kanban, PlusCircle, XCircle, CalendarDays, Pencil, User, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// Helper functions (reused from ProjectTicketsPage.jsx)
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

// Data Fetching Functions (reused and adapted)
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


const fetchCurrentUser = async () => {
  try {
    const res = await axios.get(`${BACKEND_URL}/user/data`, { withCredentials: true });
    // console.log(res.data.user)
    return res.data.user;
  } catch (err) {
    console.error('Error fetching current user:', err);
    throw err;
  }
};


const fetchProjectDetailsForMembers = async ({ queryKey }) => {
  const [, projectID] = queryKey;
  if (!projectID) return null;

  try {
    const projectRes = await axios.get(`${BACKEND_URL}/project/${projectID}`, { withCredentials: true });
    const project = projectRes.data.data;

    const membersWithDetails = await Promise.all(
      (project.Members || []).map(async (member) => {
        const userDetails = await fetchUserDetailsById(member.user);
        return {
          _id: member.user,
          userName: userDetails ? (userDetails.name || userDetails.username || userDetails.email) : 'Unknown User',
          userEmail: userDetails ? userDetails.email : 'N/A',
          role: member.role
        };
      })
    );
    return { ...project, Members: membersWithDetails };
  } catch (err) {
    console.error(`Error fetching project details for ID ${projectID}:`, err);
    throw err;
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
          assigneeName = assigneeDetails ? (assigneeDetails.name || assigneeDetails.username || assigneeDetails.email) : 'Unassigned';
        }
        return { ...ticket, assigneeName };
      })
    );
    return ticketsWithAssigneeNames;
  } catch (err) {
    console.error(`Error fetching tickets for project ${projectID}:`, err);
    throw err;
  }
};


const Board = () => {
  const { projectID } = useParams();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCreateTicketModal, setShowCreateTicketModal] = useState(false);
  const [showEditTicketModal, setShowEditTicketModal] = useState(false);
  const [editingTicket, setEditingTicket] = useState(null); // Stores the ticket being edited
  const [ticketFilter, setTicketFilter] = useState('all'); // **NEW: State for ticket filter**

  // Form states for creating a ticket
  const [ticketTitle, setTicketTitle] = useState('');
  const [ticketDescription, setTicketDescription] = useState('');
  const [ticketPriority, setTicketPriority] = useState('low');
  const [ticketDueDate, setTicketDueDate] = useState('');
  const [assigneeSearchInput, setAssigneeSearchInput] = useState('');
  const [assigneeSuggestions, setAssigneeSuggestions] = useState([]);
  const [selectedAssignee, setSelectedAssignee] = useState(null);

  const queryClient = useQueryClient();

  const { data: tickets, isLoading: isLoadingTickets, isError: isErrorTickets, error: ticketsError } = useQuery({
    queryKey: ['projectTickets', projectID],
    queryFn: fetchProjectTickets,
    enabled: !!projectID,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  const { data: projectDetails, isLoading: isLoadingProjectDetails, isError: isErrorProjectDetails, error: projectDetailsError } = useQuery({
    queryKey: ['projectDetailsForMembers', projectID],
    queryFn: fetchProjectDetailsForMembers,
    enabled: !!projectID,
    staleTime: 5 * 60 * 1000,
  });

  // **NEW: Query for current user**
  const { data: currentUser, isLoading: isLoadingCurrentUser, isError: isErrorCurrentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: fetchCurrentUser,
    staleTime: Infinity,
  });

  const loading = isLoadingTickets || isLoadingProjectDetails || isLoadingCurrentUser;
  const isError = isErrorTickets || isErrorProjectDetails || isErrorCurrentUser;
  const errorMessage = ticketsError?.message || projectDetailsError?.message || "An unknown error occurred.";


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
    }, 300);

    return () => clearTimeout(debounceTimeout);
  }, [assigneeSearchInput, projectDetails?.Members]);

  const handleAssigneeSelect = (assignee) => {
    setSelectedAssignee(assignee);
    setAssigneeSearchInput(assignee.userName);
    setAssigneeSuggestions([]);
  };

  const closeCreateTicketModal = () => {
    setShowCreateTicketModal(false);
    setTicketTitle('');
    setTicketDescription('');
    setTicketPriority('low');
    setTicketDueDate('');
    setAssigneeSearchInput('');
    setSelectedAssignee(null);
    setAssigneeSuggestions([]);
  };

  const closeEditTicketModal = () => {
    setShowEditTicketModal(false);
    setEditingTicket(null);
    // Reset form fields after closing
    setTicketTitle('');
    setTicketDescription('');
    setTicketPriority('low');
    setTicketDueDate('');
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
          assignee: selectedAssignee._id,
          DueDate: ticketDueDate || undefined,
        },
        { withCredentials: true }
      );
      alert('Ticket created successfully!');
      queryClient.invalidateQueries(['projectTickets', projectID]); // Invalidate to refetch tickets
      closeCreateTicketModal();
    } catch (err) {
      console.error('Error creating ticket:', err);
      alert('Failed to create ticket. Please ensure all fields are valid and you have permission.');
    }
  };

  const handleEditTicket = async (e) => {
    e.preventDefault();
    if (!editingTicket || !selectedAssignee) {
      alert('Ticket or assignee not selected.');
      return;
    }

    try {
      await axios.put(
        `${BACKEND_URL}/ticket/${editingTicket._id}`, // Endpoint for updating ticket
        {
          title: ticketTitle,
          description: ticketDescription,
          priority: ticketPriority,
          assignee: selectedAssignee._id,
          DueDate: ticketDueDate || undefined,
        },
        { withCredentials: true }
      );
      alert('Ticket updated successfully!');
      queryClient.invalidateQueries(['projectTickets', projectID]); // Invalidate to refetch tickets
      closeEditTicketModal();
    } catch (err) {
      console.error('Error updating ticket:', err);
      alert('Failed to update ticket. Please ensure all fields are valid and you have permission.');
    }
  };

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    // Dropped outside the list
    if (!destination) {
      return;
    }

    // If dropped in the same place
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Find the draggable ticket
    const draggedTicket = tickets.find(ticket => ticket._id === draggableId);
    if (!draggedTicket) return;

    const newStatus = destination.droppableId; // 'todo', 'in_progress', 'done'

    // Optimistically update UI
    const prevTickets = queryClient.getQueryData(['projectTickets', projectID]);
    const updatedTickets = prevTickets.map(ticket =>
      ticket._id === draggableId ? { ...ticket, status: newStatus } : ticket
    );
    queryClient.setQueryData(['projectTickets', projectID], updatedTickets);

    try {

      await axios.put(
        `${BACKEND_URL}/ticket/${draggableId}/changestatus`,
        { status: newStatus },
        { withCredentials: true }
      );

    } catch (err) {
      //   console.error('Error changing ticket status:', err);
      alert('Please check whether ticket is assigned to you and Please try again.');
      // UI on error
      queryClient.setQueryData(['projectTickets', projectID], prevTickets);
    }
  };

  // Organize tickets by status for columns
  // **MODIFIED: Filter tickets based on selectedTicketFilter**
  const columns = React.useMemo(() => {
    const filteredTickets = tickets?.filter(ticket => {
      if (ticketFilter === 'assignedToMe') {
        return ticket.assignee === currentUser?._id;
      }
      return true; // 'all' tickets
    }) || [];

    const todoTickets = filteredTickets.filter(ticket => ticket.status === 'todo');
    const inProgressTickets = filteredTickets.filter(ticket => ticket.status === 'in_progress');
    const doneTickets = filteredTickets.filter(ticket => ticket.status === 'done');

    return {
      todo: {
        id: 'todo',
        title: 'To Do',
        items: todoTickets.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
      },
      in_progress: {
        id: 'in_progress',
        title: 'In Progress',
        items: inProgressTickets.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
      },
      done: {
        id: 'done',
        title: 'Done',
        items: doneTickets.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
      },
    };
  }, [tickets, ticketFilter, currentUser?._id]);


  const openEditModal = (ticket) => {
    setEditingTicket(ticket);
    setTicketTitle(ticket.title);
    setTicketDescription(ticket.description);
    setTicketPriority(ticket.priority);
    setTicketDueDate(ticket.DueDate ? format(new Date(ticket.DueDate), 'yyyy-MM-dd') : ''); // Format for input type="date"
    // Find the full assignee details from projectMembers to pre-fill search and selection
    const currentAssignee = projectDetails?.Members.find(member => member._id === ticket.assignee);
    setSelectedAssignee(currentAssignee || null);
    setAssigneeSearchInput(currentAssignee ? currentAssignee.userName : '');
    setShowEditTicketModal(true);
  };


  return (
    <div className="flex h-screen bg-gray-50 font-inter">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex-1 overflow-y-auto p-4 md:p-8 transition-all duration-300 ease-in-out">
        <Topbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} title="Project Board" />

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
            {/* Board Header and Buttons */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 animate-fadeIn transition-all duration-500">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
                {/* Adjusted h2 for better alignment and controlled wrapping */}
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2 flex-wrap min-w-0">
                  <Kanban className="text-blue-600 flex-shrink-0" /> {/* flex-shrink-0 to keep icon from shrinking */}
                  <span className="flex-shrink-0">Kanban Board for:</span> {/* Ensure "Kanban Board for:" doesn't wrap oddly */}
                  <span className="ml-1 flex-auto line-clamp-1">{projectDetails?.title || projectID}</span> {/* flex-auto allows it to grow/shrink, line-clamp for ellipsis */}
                </h2>
                {/* **NEW: Filter Dropdown** */}
                <div className="relative">
                  <select
                    value={ticketFilter}
                    onChange={(e) => setTicketFilter(e.target.value)}
                    className="appearance-none bg-white border border-gray-300 text-gray-700 py-2 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-blue-500"
                  >
                    <option value="all">All Tickets</option>
                    <option value="assignedToMe">Assigned to Me</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/${projectID}/tickets`)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
                >
                  <ChevronRight className="w-5 h-5 -rotate-180" /> Back to Tickets
                </button>
                <button
                  onClick={() => setShowCreateTicketModal(true)}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
                >
                  <PlusCircle className="w-5 h-5" /> Create New Ticket
                </button>
              </div>
            </div>

        {/* Kanban Board Layout */}
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-200px)] overflow-x-auto pb-4">
            {Object.values(columns).map(column => (
              <Droppable key={column.id} droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 min-w-[280px] bg-gray-100 rounded-xl shadow-inner p-4 flex flex-col transition-all duration-200 ease-in-out
                          ${snapshot.isDraggingOver ? 'bg-blue-50 ring-2 ring-blue-400' : 'bg-gray-100'}`
                    }
                  >
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center justify-between">
                      {column.title}
                      <span className="text-gray-500 text-sm font-normal bg-gray-200 px-2 py-0.5 rounded-full">
                        {column.items.length}
                      </span>
                    </h3>
                    <div className="flex-grow overflow-y-auto space-y-4 pr-1"> {/* pr-1 for scrollbar */}
                      {column.items.length === 0 ? (
                        <p className="text-gray-500 text-sm italic text-center py-4">No tickets here.</p>
                      ) : (
                        column.items.map((ticket, index) => (
                          <Draggable key={ticket._id} draggableId={ticket._id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`bg-white rounded-lg shadow-md p-4 space-y-2 border border-gray-200 cursor-grab
                                      ${snapshot.isDragging ? 'shadow-xl ring-2 ring-blue-300' : 'hover:shadow-lg transition-shadow duration-200'}
                                    `}
                              >
                                <div className="flex items-center justify-between">
                                  <h4 className="font-semibold text-gray-900 line-clamp-1">{ticket.title}</h4>
                                  <button
                                    onClick={() => openEditModal(ticket)}
                                    className="text-gray-400 hover:text-blue-600 transition-colors duration-200"
                                    title="Edit Ticket"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                </div>
                                <p className="text-sm text-gray-600 line-clamp-2">{ticket.description}</p>
                                <div className="flex flex-wrap items-center gap-2 text-xs">
                                  <span className={`px-2 py-0.5 rounded-full font-medium ${getPriorityColorClass(ticket.priority)}`}>
                                    {ticket.priority}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded-full font-medium ${getTicketStatusColorClass(ticket.status)}`}>
                                    {ticket.status}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 text-sm text-gray-700">
                                  <User className="w-4 h-4 text-gray-500" />
                                  <span>{ticket.assigneeName}</span>
                                </div>
                                {ticket.DueDate && (
                                  <div className="flex items-center gap-1 text-sm text-gray-700">
                                    <CalendarDays className="w-4 h-4 text-gray-500" />
                                    <span>{format(new Date(ticket.DueDate), 'MMM dd, yyyy')}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </Draggable>
                        ))
                      )}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </DragDropContext>
      </>
        )}
    </div>

      {/* Create Ticket Modal (Same as ProjectTicketsPage) */ }
  {
    showCreateTicketModal && (
      <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
        <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg animate-scaleIn">
          <div className="flex justify-between items-center mb-4 border-b pb-3">
            <h3 className="text-2xl font-bold text-gray-800">Create New Ticket</h3>
            <button onClick={closeCreateTicketModal} className="text-gray-500 hover:text-gray-700 text-3xl font-bold leading-none">
              <XCircle className="w-8 h-8" />
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
    )
  }

  {/* Edit Ticket Modal (New) */ }
  {
    showEditTicketModal && editingTicket && (
      <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
        <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg animate-scaleIn">
          <div className="flex justify-between items-center mb-4 border-b pb-3">
            <h3 className="text-2xl font-bold text-gray-800">Edit Ticket</h3>
            <button onClick={closeEditTicketModal} className="text-gray-500 hover:text-gray-700 text-3xl font-bold leading-none">
              <XCircle className="w-8 h-8" />
            </button>
          </div>
          <form onSubmit={handleEditTicket} className="space-y-4">
            <div>
              <label htmlFor="edit-ticket-title" className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                id="edit-ticket-title"
                value={ticketTitle}
                onChange={(e) => setTicketTitle(e.target.value)}
                placeholder="Ticket title"
                className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="edit-ticket-description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                id="edit-ticket-description"
                value={ticketDescription}
                onChange={(e) => setTicketDescription(e.target.value)}
                rows="4"
                placeholder="Detailed description"
                className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                required
              ></textarea>
            </div>
            <div>
              <label htmlFor="edit-ticket-priority" className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                id="edit-ticket-priority"
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
              <label htmlFor="edit-ticket-duedate" className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input
                type="date"
                id="edit-ticket-duedate"
                value={ticketDueDate}
                onChange={(e) => setTicketDueDate(e.target.value)}
                className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="edit-ticket-assignee" className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
              <input
                type="text"
                id="edit-ticket-assignee"
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
                onClick={closeEditTicketModal}
                className="px-5 py-2.5 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium transition duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!ticketTitle || !ticketDescription || !selectedAssignee}
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  {/* Tailwind CSS Customizations and Animations */ }
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

        /* Custom scrollbar for better aesthetics */
        .overflow-y-auto::-webkit-scrollbar {
          width: 8px;
        }
        .overflow-y-auto::-webkit-scrollbar-track {
          background: #e0e0e0;
          border-radius: 10px;
        }
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: #a0a0a0;
          border-radius: 10px;
        }
        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: #707070;
        }
      `}</style>
    </div >
  );
};

export default Board;




