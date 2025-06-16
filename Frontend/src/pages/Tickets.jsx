import React, { useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { useQuery, useQueries, useQueryClient } from '@tanstack/react-query'; 

const fetchMyTickets = async () => {
  const res = await axios.get('http://localhost:3000/user/mytickets', { withCredentials: true });
  return res.data.data;
};

const fetchProjectById = async (projectId) => {
  if (!projectId) {
   
    return null;
  }

  const res = await axios.get(`http://localhost:3000/project/${projectId}`, { withCredentials: true });
  return res.data.data;
};

// --- TicketCard Component ---
const TicketCard = React.memo(({ ticket, projectDetails, projectError }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-3 border border-gray-200
                 hover:shadow-xl hover:scale-102 transition-all duration-300 ease-in-out
                 transform animate-fade-in">
      <h3 className="text-xl font-bold text-gray-800 border-b-2 border-blue-500 pb-2 mb-2">
        {ticket.title}
      </h3>
      <p className="text-sm text-gray-600 leading-relaxed">{ticket.description}</p>
      <div className="grid grid-cols-2 gap-y-2 text-sm text-gray-700">
        <p><span className="font-semibold text-blue-700">Priority:</span> {ticket.priority}</p>
        <p><span className="font-semibold text-blue-700">Status:</span>
          <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-medium
            ${ticket.status === 'Open' ? 'bg-red-100 text-red-800' :
              ticket.status === 'In Process' ? 'bg-yellow-100 text-yellow-800' :
              'bg-green-100 text-green-800'}`}>
            {ticket.status}
          </span>
        </p>
      </div>

      {/* Project Details Section */}
      {projectError ? (
        <p className="text-red-500 text-xs py-2">{projectError}</p>
      ) : projectDetails ? (
        <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
          <p className="text-sm">
            <span className="font-semibold text-blue-700">Project:</span> {projectDetails.title || 'N/A'}
          </p>
          <p className="text-sm">
            <span className="font-semibold text-blue-700">Members:</span> {projectDetails.Members ? projectDetails.Members.length : '0'}
          </p>
          <p className="text-sm">
            <span className="font-semibold text-blue-700">End Date:</span> {formatDate(projectDetails.endDate)}
          </p>
        </div>
      ) : (

        <p className="text-sm text-gray-500 mt-3 pt-3 border-t border-gray-200">
          Project details not available.
        </p>
      )}
    </div>
  );
});


const Tickets = () => {
  
  const [statusFilter, setStatusFilter] = useState('All');
  const [sidebarOpen, setSidebarOpen] = useState(false); // State for sidebar visibility

  // 1. Fetch Tickets using useQuery
  // The 'tickets' data will be automatically cached and refetched based on staleTime/refetch settings
  const {
    data: tickets = [], 
    isLoading: isLoadingTickets,
    isError: isErrorTickets,
    error: ticketsError,
  } = useQuery({
    queryKey: ['myTickets'], // Unique key for caching this data
    queryFn: fetchMyTickets,
    staleTime: 5 * 60 * 1000, // Data considered fresh for 5 minutes
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnMount: true,       // Refetch when component mounts (if stale)
  });

  
  const uniqueProjectIds = useMemo(() => {
    return [...new Set(tickets.map(ticket => ticket.projectID).filter(Boolean))];
  }, [tickets]);

  
  const projectQueries = useQueries({
    queries: uniqueProjectIds.map(projectId => ({
      queryKey: ['project', projectId], // Key for individual project data
      queryFn: () => fetchProjectById(projectId),
      staleTime: 10 * 60 * 1000, // Projects might not change as often, longer stale time
      enabled: !!projectId, // Only enable query if projectId is valid
      // `gcTime` (garbage collection time) defaults to 5 minutes.
      // If a project is not used for 5 min, it will be garbage collected from cache.
    })),
  });

  // --- Aggregate Loading and Error States ---
  const isLoadingProjects = projectQueries.some(query => query.isLoading);
  const isErrorProjects = projectQueries.some(query => query.isError);
  const projectsErrors = projectQueries
    .filter(query => query.isError)
    .map(query => `Project ${query.queryKey[1]}: ${query.error?.message || 'Unknown error'}`);

  const isLoading = isLoadingTickets || isLoadingProjects;
  const isError = isErrorTickets || isErrorProjects;
  const combinedError = ticketsError ? ticketsError.message : (projectsErrors.length > 0 ? projectsErrors.join(', ') : null);

  // --- Prepare Project Map for TicketCard ---
  // Create a map from projectId to its details or error status
  const projectMap = useMemo(() => {
    const map = {};
    projectQueries.forEach((query, index) => {
      const projectId = uniqueProjectIds[index];
      if (query.status === 'success') {
        map[projectId] = query.data;
      } else if (query.status === 'error') {
        map[projectId] = { error: query.error?.message || "Failed to load project." };
      }
     
    });
    return map;
  }, [projectQueries, uniqueProjectIds]);


  // --- Filter Tickets based on statusFilter ---
  // useMemo prevents recalculating filteredTickets on every render unless dependencies change
  const filteredTickets = useMemo(() => {
    if (statusFilter === 'All') {
      return tickets;
    } else {
      return tickets.filter(ticket =>
        ticket.status.toLowerCase().includes(statusFilter.toLowerCase())
      );
    }
  }, [statusFilter, tickets]);


  return (
    <div className="flex h-screen bg-gray-50 font-inter">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex-1 overflow-y-auto p-4 md:p-8 transition-all duration-300 ease-in-out">
        <Topbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        {/* Header and Filter for Tickets */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 animate-fade-in-down">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-4 md:mb-0">Your Tickets</h1>
          <div className="relative w-full md:w-60">
            <select
              className="w-full pl-4 pr-10 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm
                         text-gray-800 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500
                         hover:border-blue-400 transition duration-200 ease-in-out cursor-pointer"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="todo">Todo</option>
              <option value="In_progress">In_Progress</option>
              <option value="done">Done</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Loading, Error, or Ticket Display */}
        {isLoading ? (
          <div className="flex justify-center items-center h-80">
            <div className="animate-spin-fast rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
          </div>
        ) : isError ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md relative" role="alert">
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline ml-2">{combinedError}</span>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded-md" role="alert">
            <p className="font-bold">No Tickets Found</p>
            <p className="text-sm">It looks like you don't have any tickets matching your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in">
            {filteredTickets.map((ticket) => (
              <TicketCard
                key={ticket._id || ticket.id} 
                ticket={ticket}
                projectDetails={projectMap[ticket.projectID]}
                projectError={projectMap[ticket.projectID]?.error}
              />
            ))}
          </div>
        )}
      </div>

      {/* Tailwind CSS Customizations (can be moved to a CSS file) */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

        .font-inter {
          font-family: 'Inter', sans-serif;
        }

        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }

        .animate-fade-in-down {
          animation: fadeInDown 0.6s ease-out forwards;
          opacity: 0;
          transform: translateY(-20px);
        }

        .animate-spin-fast {
          animation: spin 0.8s linear infinite;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Responsive adjustments for overall layout */
        @media (max-width: 768px) {
          .md:p-8 {
            padding: 1rem; /* Smaller padding on mobile */
          }
        }
      `}</style>
    </div>
  );
};

export default Tickets;