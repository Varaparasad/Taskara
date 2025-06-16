import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar.jsx'; 
import Topbar from '../components/Topbar.jsx';   
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { User, Loader2, Calendar, ListChecks, Kanban, Edit, Trash2, UserMinus } from 'lucide-react';
import { format } from 'date-fns';
import { Pie, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
const BACKEND_URL =import.meta.env.VITE_BACKEND_URL;

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

// --- Helper Functions for Styling Badges ---
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
  // Updated to match the backend enum: "todo", "in_progress", "done"
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

// --- Data Fetching Functions ---

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

const fetchProjectDetails = async ({ queryKey }) => {
  const [, projectID] = queryKey;
  if (!projectID) return null;

  const projectRes = await axios.get(`${BACKEND_URL}/project/${projectID}`, { withCredentials: true });
  const project = projectRes.data.data;

  let managerDetails = null;
  if (project.CreatedBy) {
    managerDetails = await fetchUserDetailsById(project.CreatedBy);
  }
  const managerName = managerDetails ? (managerDetails.name || managerDetails.username) : "Unknown";

  const membersWithDetails = await Promise.all(
    (project.Members || []).map(async (member) => {
      const userDetails = await fetchUserDetailsById(member.user);
      return {
        ...member,
        userName: userDetails ? (userDetails.name || userDetails.username || userDetails.email) : 'Unknown User',
        userEmail: userDetails ? userDetails.email : 'N/A'
      };
    })
  );

  return { ...project, managerName, Members: membersWithDetails };
};

const fetchProjectTickets = async ({ queryKey }) => {
  const [, projectID] = queryKey;
  if (!projectID) return [];

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
};

const InsideProject = () => {
  const { id: projectID } = useParams();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [showAddMember, setShowAddMember] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [emailSuggestions, setEmailSuggestions] = useState([]);
  const [selectedUserEmail, setSelectedUserEmail] = useState(null);
  const [selectedRole, setSelectedRole] = useState('developer');
  const [editOverallStatus, setEditOverallStatus] = useState('');

  // State for Edit Project Overlay
  const [showEditProject, setShowEditProject] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editEndDate, setEditEndDate] = useState('');

  // State for Delete Project Overlay
  const [showDeleteProject, setShowDeleteProject] = useState(false);
  const [confirmDeleteTitle, setConfirmDeleteTitle] = useState('');

  // State for Remove Member Confirmation Overlay
  const [showRemoveMemberConfirm, setShowRemoveMemberConfirm] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null); // Stores the member object to be removed

  const queryClient = useQueryClient();

  const { data: project, isLoading: isLoadingProject, isError: isErrorProject, error: projectError } = useQuery({
    queryKey: ['projectDetails', projectID],
    queryFn: fetchProjectDetails,
    enabled: !!projectID,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  const { data: tickets, isLoading: isLoadingTickets, isError: isErrorTickets, error: ticketsError } = useQuery({
    queryKey: ['projectTickets', projectID],
    queryFn: fetchProjectTickets,
    enabled: !!projectID,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  const loading = isLoadingProject || isLoadingTickets;
  const isError = isErrorProject || isErrorTickets;
  const errorMessage = projectError?.message || ticketsError?.message || "An unknown error occurred.";

  // Effect to pre-fill edit form when project data is loaded
  useEffect(() => {
    if (project) {
      setEditTitle(project.title || '');
      setEditDescription(project.description || '');
      setEditEndDate(project.endDate ? format(new Date(project.endDate), 'yyyy-MM-dd') : '');
      setEditOverallStatus(project.overallStatus || 'Not Started');
    }
  }, [project]);


  useEffect(() => {
    const fetchEmails = async () => {
      if (searchInput.trim().length === 0) {
        setEmailSuggestions([]);
        return;
      }
      try {
        const res = await axios.get(`${BACKEND_URL}/user/allemails`, { withCredentials: true });
        const filtered = res.data.data.filter(email =>
          email.toLowerCase().includes(searchInput.toLowerCase())
        );
        setEmailSuggestions(filtered);
      } catch (err) {
        console.error('Error fetching emails', err);
      }
    };
    const debounce = setTimeout(fetchEmails, 300);
    return () => clearTimeout(debounce);
  }, [searchInput]);

  const handleUserSelect = email => {
    setSelectedUserEmail(email);
    setSearchInput(email);
    setEmailSuggestions([]);
  };

  const closeAddMemberOverlay = () => {
    setShowAddMember(false);
    setSearchInput('');
    setSelectedUserEmail(null);
    setSelectedRole('developer');
  };

  const closeEditProjectOverlay = () => {
    setShowEditProject(false);
    setEditTitle(project?.title || '');
    setEditDescription(project?.description || '');
    setEditEndDate(project?.endDate ? format(new Date(project.endDate), 'yyyy-MM-dd') : '');
    setEditOverallStatus(project?.overallStatus || 'Not Started');
  };

  const closeDeleteProjectOverlay = () => {
    setShowDeleteProject(false);
    setConfirmDeleteTitle('');
  };

  const closeRemoveMemberConfirm = () => {
    setShowRemoveMemberConfirm(false);
    setMemberToRemove(null);
  };

  const handleAddMember = async () => {
    if (!selectedUserEmail) {
      // Use custom message box instead of alert
      console.log('Please select a user first');
      return;
    }
    try {
      await axios.put(
        `${BACKEND_URL}/project/${projectID}/addmember`,
        { useremail: selectedUserEmail, role: selectedRole },
        { withCredentials: true }
      );
      // Use custom message box instead of alert
      console.log('Member added successfully!');
      // Invalidate projectDetails query to refetch members with updated status/new member
      queryClient.invalidateQueries(['projectDetails', projectID]);
      closeAddMemberOverlay();
    } catch (err) {
      console.error(err);
      // Use custom message box instead of alert
      console.log('There was a problem adding the member. Please check if the user is already a member or to check your permissions contact your project manager');
    }
  };

  const handleUpdateProject = async () => {
    if (!projectID) return;
    try {
      const updatedData = {
        title: editTitle,
        description: editDescription,
        endDate: editEndDate || null,
        overallStatus: editOverallStatus,
      };
      await axios.put(`${BACKEND_URL}/project/${projectID}`, updatedData, { withCredentials: true });
      // Use custom message box instead of alert
      console.log('Project updated successfully!');
      queryClient.invalidateQueries(['projectDetails', projectID]);
      closeEditProjectOverlay();
    } catch (err) {
      console.error('Error updating project:', err);
      // Use custom message box instead of alert
      console.log('Failed to update project. Please ensure you have the correct permissions.');
    }
  };

  const handleDeleteProject = async () => {
    if (!projectID) return;
    if (confirmDeleteTitle !== project?.title) {
      // Use custom message box instead of alert
      console.log('Project title does not match. Please type the project title correctly to confirm.');
      return;
    }
    try {
      await axios.delete(`${BACKEND_URL}/project/${projectID}`, { withCredentials: true });
      // Use custom message box instead of alert
      console.log('Project deleted successfully!');
      queryClient.invalidateQueries(['projectList']); // Invalidate list of projects
      navigate('/projects'); // Navigate to projects list after deletion
    } catch (err) {
      console.error('Error deleting project:', err);
      // Use custom message box instead of alert
      alert('Failed to delete project. Please ensure you have the correct permissions.');
    }
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove || !projectID) return;
    try {
      await axios.delete(`${BACKEND_URL}/project/${projectID}/removemember`, {
        data: { userId: memberToRemove.user }, // Send userId in data for DELETE request body
        withCredentials: true
      });
      alert(`${memberToRemove.userName} removed successfully!`);
      queryClient.invalidateQueries(['projectDetails', projectID]); // Refetch project details to update member list
      closeRemoveMemberConfirm();
    } catch (err) {
      console.error('Error removing member:', err);
      alert('Failed to remove member. Please ensure you have the correct permissions.');
    }
  };

  // --- Chart Data Preparation (Updated for 'todo', 'in_progress', 'done') ---
  const ticketStatusData = {
    labels: ['To Do', 'In Progress', 'Done'],
    datasets: [
      {
        data: [
          tickets?.filter(t => t.status?.toLowerCase() === 'todo').length || 0,
          tickets?.filter(t => t.status?.toLowerCase() === 'in_progress').length || 0,
          tickets?.filter(t => t.status?.toLowerCase() === 'done').length || 0,
        ],
        backgroundColor: ['#ef4444', '#f59e0b', '#22c55e'], // Red, Yellow, Green
        borderColor: ['#dc2626', '#d97706', '#16a34a'],
        borderWidth: 1,
      },
    ],
  };

  const ticketPriorityData = {
    labels: ['Low', 'Medium', 'High'],
    datasets: [
      {
        label: 'Number of Tickets',
        data: [
          tickets?.filter(t => t.priority?.toLowerCase() === 'low').length || 0,
          tickets?.filter(t => t.priority?.toLowerCase() === 'medium').length || 0,
          tickets?.filter(t => t.priority?.toLowerCase() === 'high').length || 0,
        ],
        backgroundColor: ['#3b82f6', '#f59e0b', '#ef4444'], // Blue, Yellow, Red
        borderColor: ['#2563eb', '#d97706', '#dc2626'],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="flex h-screen bg-gray-50 font-inter">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex-1 overflow-y-auto p-4 md:p-8 transition-all duration-300 ease-in-out">
        <Topbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} title={project?.title || "Project Details"} />

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
            {/* Project Details Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 animate-fadeIn transition-all duration-500">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-3">
                <div className="flex items-center gap-3 flex-grow min-w-0"> {/* flex-grow and min-w-0 for title wrapping */}
                  <ListChecks className="text-blue-600 text-2xl sm:text-3xl flex-shrink-0" />
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 line-clamp-1 flex-grow break-words">{project?.title}</h1>
                  <button
                    onClick={() => setShowEditProject(true)}
                    className="flex-shrink-0 text-gray-500 hover:text-blue-600 transition-colors duration-200 p-1 rounded-full hover:bg-gray-100"
                    title="Edit Project"
                  >
                    <Edit className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </div>
                {/* Project Tasks & Delete Button */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2"> {/* Use items-stretch for full width buttons on mobile */}
                  <button
                    onClick={() => navigate(`/${projectID}/tickets`)}
                    className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white text-sm sm:text-base font-medium px-3 py-2 sm:px-4 sm:py-2 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                  >
                    <Kanban className="w-4 h-4 sm:w-5 sm:h-5" /> <span className="whitespace-nowrap">Project Tasks</span>
                  </button>
                  <button
                    onClick={() => setShowDeleteProject(true)}
                    className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white text-sm sm:text-base font-medium px-3 py-2 sm:px-4 sm:py-2 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                    title="Delete Project"
                  >
                    <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" /> <span className="whitespace-nowrap">Delete</span>
                  </button>
                </div>
              </div>
              <p className="text-gray-700 mb-4 text-sm sm:text-md leading-relaxed">{project?.description}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs sm:text-sm text-gray-700 border-t pt-4 border-gray-100">
  <p className="flex items-center gap-2">
    <User className="inline-block w-4 h-4 text-gray-500" />
    <span className="font-semibold">Project Manager:</span> {project?.managerName || "N/A"}
  </p>
  <p className="flex items-center gap-2">
    <Calendar className="inline-block w-4 h-4 text-gray-500" />
    <span className="font-semibold">Start Date:</span> {project?.startDate ? format(new Date(project.startDate), 'PPP') : 'N/A'}
  </p>
  <p className="flex items-center gap-2">
    <Calendar className="inline-block w-4 h-4 text-gray-500" />
    <span className="font-semibold">End Date:</span> {project?.endDate ? format(new Date(project.endDate), 'PPP') : 'N/A'}
  </p>
  {/* Updated Overall Status with Icon */}
  <p className="flex items-center gap-2">
    <ListChecks className="inline-block w-4 h-4 text-gray-500" /> {/* Icon added here */}
    <span className="font-semibold">Overall Status:</span> <span className="capitalize">{project?.overallStatus || 'N/A'}</span>
  </p>
</div>
            </div>

            {/* Project Summary Section with Charts */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 animate-fadeIn transition-all duration-500">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Project Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="chart-container flex flex-col items-center">
                  <h3 className="text-md sm:text-lg font-semibold text-gray-800 mb-4">Tickets by Status</h3>
                  <div className="w-full max-w-xs">
                    {tickets?.length > 0 ? (
                      <Pie data={ticketStatusData} options={{ responsive: true, maintainAspectRatio: false }} />
                    ) : (
                      <p className="text-gray-500 text-center text-sm">No tickets to display status.</p>
                    )}
                  </div>
                </div>
                <div className="chart-container flex flex-col items-center">
                  <h3 className="text-md sm:text-lg font-semibold text-gray-800 mb-4">Tickets by Priority</h3>
                  <div className="w-full max-w-xs md:max-w-md">
                    {tickets?.length > 0 ? (
                      <Bar
                        data={ticketPriorityData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          scales: {
                            y: {
                              beginAtZero: true,
                              ticks: {
                                precision: 0
                              }
                            }
                          }
                        }}
                      />
                    ) : (
                      <p className="text-gray-500 text-center text-sm">No tickets to display priority.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Team Members Section */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 animate-fadeIn transition-all duration-500">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Team Members</h2>
                <button
                  onClick={() => setShowAddMember(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base font-medium px-3 py-2 sm:px-4 sm:py-2 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
                >
                  + Add Member
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {project?.Members?.length === 0 ? (
                  <p className="text-gray-500 col-span-full text-sm">No members assigned to this project yet.</p>
                ) : (
                  project.Members.map((member, idx) => (
                    <div
                      key={idx}
                      className="bg-gray-50 border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col justify-between"
                    >
                      <div>
                        <p className="font-semibold text-gray-900 line-clamp-1">{member.userName}</p>
                        <p className="text-xs text-gray-600 line-clamp-1 mb-1">{member.userEmail}</p>
                        <p className="text-xs text-gray-500 mb-2">Role: <span className="capitalize">{member.role}</span></p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${member.status === 'accepted' ? 'bg-green-100 text-green-800' :
                            member.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              member.status === 'unseen' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                          }`}>
                          {member.status}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setMemberToRemove(member);
                          setShowRemoveMemberConfirm(true);
                        }}
                        className="mt-3 self-end text-red-500 hover:text-red-700 transition-colors duration-200 p-1 rounded-full hover:bg-red-50 flex items-center gap-1 text-sm"
                        title={`Remove ${member.userName}`}
                      >
                        <UserMinus className="w-4 h-4" /> Remove
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add Member Overlay */}
      {showAddMember && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg animate-scaleIn">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800">Add Project Member</h3>
              <button onClick={closeAddMemberOverlay} className="text-gray-500 hover:text-gray-700 text-3xl font-bold leading-none">×</button>
            </div>
            <label htmlFor="member-email" className="block text-sm font-medium text-gray-700 mb-2">
              Search User by Email
            </label>
            <input
              id="member-email"
              type="text"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setSelectedUserEmail(null);
              }}
              placeholder="e.g., user@example.com"
              className="w-full border border-gray-300 px-4 py-2 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-sm"
              autoComplete="off"
            />
            {emailSuggestions.length > 0 && !selectedUserEmail && searchInput.trim().length > 0 && (
              <ul className="border border-gray-200 rounded-lg bg-white mb-3 max-h-48 overflow-y-auto shadow-md">
                {emailSuggestions.map((email, i) => (
                  <li
                    key={i}
                    onClick={() => handleUserSelect(email)}
                    className="px-4 py-2 cursor-pointer hover:bg-blue-50 text-gray-800 text-sm border-b border-gray-100 last:border-b-0"
                  >
                    {email}
                  </li>
                ))}
              </ul>
            )}
            {selectedUserEmail && (
              <div className="space-y-4 pt-3">
                <p className="text-sm text-gray-700">Selected User: <strong className="text-blue-600">{selectedUserEmail}</strong></p>
                <div>
                  <label htmlFor="member-role" className="block text-sm font-medium text-gray-700 mb-2">
                    Assign Role
                  </label>
                  <select
                    id="member-role"
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-sm"
                  >
                    <option value="developer">Developer</option>
                    <option value="admin">Admin</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>
              </div>
            )}
            <div className="mt-6 flex justify-end space-x-3 border-t pt-4">
              <button
                onClick={closeAddMemberOverlay}
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium transition duration-200 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMember}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                disabled={!selectedUserEmail}
              >
                Add Member
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Project Overlay */}
      {showEditProject && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg animate-scaleIn">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800">Edit Project Details</h3>
              <button onClick={closeEditProjectOverlay} className="text-gray-500 hover:text-gray-700 text-3xl font-bold leading-none">×</button>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700 mb-2">
                  Project Title
                </label>
                <input
                  id="edit-title"
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-sm"
                  placeholder="Enter project title"
                />
              </div>
              <div>
                <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  id="edit-description"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows="4"
                  className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-sm"
                  placeholder="Enter project description"
                ></textarea>
              </div>
              <div>
                <label htmlFor="edit-end-date" className="block text-sm font-medium text-gray-700 mb-2">
                  End Date 
                </label>
                <input
                  id="edit-end-date"
                  type="date"
                  value={editEndDate}
                  onChange={(e) => setEditEndDate(e.target.value)}
                  className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-sm"
                />
              </div>
              <div>
                <label htmlFor="edit-overall-status" className="block text-sm font-medium text-gray-700 mb-2">
                  Overall Status
                </label>
                <select
                  id="edit-overall-status"
                  value={editOverallStatus}
                  onChange={(e) => setEditOverallStatus(e.target.value)}
                  className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-sm"
                >
                  <option value="Not Started">Not Started</option>
                  <option value="Active">Active</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Completed">Completed</option>
                  <option value="Delayed">Delayed</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3 border-t pt-4">
              <button
                onClick={closeEditProjectOverlay}
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium transition duration-200 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateProject}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                disabled={!editTitle.trim()} // Disable if title is empty
              >
                Update Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Project Confirmation Overlay */}
      {showDeleteProject && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg animate-scaleIn">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800">Confirm Project Deletion</h3>
              <button onClick={closeDeleteProjectOverlay} className="text-gray-500 hover:text-gray-700 text-3xl font-bold leading-none">×</button>
            </div>
            <div className="space-y-4">
              <p className="text-red-700 font-semibold text-sm">
                Are you sure you want to delete the project "<span className="italic">{project?.title}</span>"?
              </p>
              <p className="text-gray-700 text-sm">This action cannot be undone. To confirm, please type the project title below:</p>
              <div>
                <label htmlFor="confirm-delete-title" className="sr-only">Confirm Project Title</label>
                <input
                  id="confirm-delete-title"
                  type="text"
                  value={confirmDeleteTitle}
                  onChange={(e) => setConfirmDeleteTitle(e.target.value)}
                  className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition duration-200 text-sm"
                  placeholder="Enter project title to confirm"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3 border-t pt-4">
              <button
                onClick={closeDeleteProjectOverlay}
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium transition duration-200 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProject}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                disabled={confirmDeleteTitle !== project?.title}
              >
                Delete Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Member Confirmation Overlay */}
      {showRemoveMemberConfirm && memberToRemove && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg animate-scaleIn">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800">Confirm Member Removal</h3>
              <button onClick={closeRemoveMemberConfirm} className="text-gray-500 hover:text-gray-700 text-3xl font-bold leading-none">×</button>
            </div>
            <div className="space-y-4">
              <p className="text-gray-700 text-sm">
                Are you sure you want to remove <strong className="text-blue-600">{memberToRemove.userName}</strong> from this project?
              </p>
              <p className="text-red-700 text-xs">This action cannot be undone.</p>
            </div>
            <div className="mt-6 flex justify-end space-x-3 border-t pt-4">
              <button
                onClick={closeRemoveMemberConfirm}
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium transition duration-200 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveMember}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition duration-200 text-sm"
              >
                Remove Member
              </button>
            </div>
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

export default InsideProject;
