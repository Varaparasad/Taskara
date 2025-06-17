import React, { useState, useMemo } from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { useNavigate } from 'react-router-dom';
import { FaClipboardList, FaUserTie, FaTasks, FaProjectDiagram } from 'react-icons/fa';
import { AiOutlineSearch } from 'react-icons/ai';
import { useQuery, useQueries } from '@tanstack/react-query';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const fetchUserProjects = async () => {
  // Update this line to use BACKEND_URL
  const res = await axios.get(`${BACKEND_URL}/user/data`, { withCredentials: true });
  return res.data.user.projects || [];
};

const fetchProjectDetails = async (projectId) => {
  const res = await axios.get(`${BACKEND_URL}/project/${projectId}`, { withCredentials: true });
  return res.data.data;
};

const fetchProjectTickets = async (projectId) => {
  const res = await axios.get(`${BACKEND_URL}/project/${projectId}/tickets`, { withCredentials: true });
  // console.log(res.data.data,"in fetchProjectTickets");
  return res.data.data || [];
};

const fetchUserName = async (userId) => {
  if (!userId) return 'N/A';
  const res = await axios.get(`${BACKEND_URL}/user/${userId}`, { withCredentials: true });
  return res.data.data ? (res.data.data.name || res.data.data.username) : "Unknown User";
};

const Projects = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filterRole, setFilterRole] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const navigate = useNavigate();

  const {
    data: userProjects = [],
    isLoading: isLoadingUserProjects,
    isError: isErrorUserProjects,
    error: userProjectsError,
  } = useQuery({
    queryKey: ['userProjects'],
    queryFn: fetchUserProjects,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  const projectQueries = useQueries({
    queries: userProjects.map(userProject => ({
      queryKey: ['projectData', userProject.projectID],
      queryFn: async () => {
        const projectDetails = await fetchProjectDetails(userProject.projectID);
        const tickets = await fetchProjectTickets(userProject.projectID);
        const managerName = await fetchUserName(projectDetails.CreatedBy);

        return {
          ...userProject, // Keep user's role and projectID from the initial fetch
          details: projectDetails,
          tickets: {
            total: tickets.length,
            resolved: tickets.filter(t => t.status === 'done').length,
          },
          manager: managerName,
        };
      },
      enabled: !!userProject.projectID,
      staleTime: 10 * 60 * 1000,
      refetchOnWindowFocus: true,
      refetchOnMount: true,
    })),
  });

  const combinedProjectsData = useMemo(() => {
    return projectQueries.map(query => ({
      data: query.data,
      isLoading: query.isLoading,
      isError: query.isError,
      error: query.error,
    }));
  }, [projectQueries]);

  const isLoadingProjectDetails = combinedProjectsData.some(q => q.isLoading);
  const isErrorProjectDetails = combinedProjectsData.some(q => q.isError);
  const projectDetailsErrors = combinedProjectsData
    .filter(q => q.isError)
    .map(q => q.error?.message || 'Unknown error');

  const isLoading = isLoadingUserProjects || isLoadingProjectDetails;
  const isError = isErrorUserProjects || isErrorProjectDetails;
  const combinedError = userProjectsError ? userProjectsError.message : (projectDetailsErrors.length > 0 ? projectDetailsErrors.join(', ') : null);

  const allProjectsLoadedSuccessfully = useMemo(() => {
    return !isLoading && !isError && combinedProjectsData.every(q => q.data !== undefined);
  }, [isLoading, isError, combinedProjectsData]);


  const filteredProjects = useMemo(() => {
    if (!allProjectsLoadedSuccessfully) {
      return [];
    }

    let result = combinedProjectsData
      .filter(p => !p.isError && p.data && p.data.details) // Filter out projects that failed to load details
      .map(p => p.data) // Extract the actual data from the query result
      .filter(project => {
        const roleMatch = filterRole === "all" || project.role === filterRole;
        const searchMatch = searchQuery.trim() === "" ||
          (project.details.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            project.details.description?.toLowerCase().includes(searchQuery.toLowerCase()));

        return roleMatch && searchMatch;
      });

    return result;
  }, [filterRole, searchQuery, allProjectsLoadedSuccessfully, combinedProjectsData]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    try {
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch {
      return 'Invalid Date';
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-80">
          <div className="animate-spin-fast rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
        </div>
      );
    }

    if (isError) {
      return (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md relative" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline ml-2">{combinedError}</span>
        </div>
      );
    }

    if (userProjects.length === 0 && filteredProjects.length === 0) {
      return (
        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded-md" role="alert">
          <p className="font-bold">No Projects Assigned</p>
          <p className="text-sm">It looks like you haven't been assigned to any projects yet.</p>
        </div>
      );
    }

    if (filteredProjects.length === 0 && userProjects.length > 0) {
      return (
        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded-md" role="alert">
          <p className="font-bold">No Matching Projects</p>
          <p className="text-sm">No projects were found matching your current filter and search criteria. Try adjusting them.</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
        {filteredProjects.map((project) => {

          return (
            <div
              key={project.projectID}
              className={`rounded-2xl shadow-lg p-6 space-y-3 border border-gray-200
                        transition-all duration-300 ease-in-out transform animate-fade-in
                        ${"bg-white hover:shadow-xl hover:-translate-y-1 cursor-pointer"}`}
              onClick={() => {
                  navigate(`/project/${project.projectID}`);
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <FaProjectDiagram className="text-blue-600 text-2xl" />
                <h2 className="text-xl font-bold text-gray-800 line-clamp-1">{project.details.title || project.name || "Untitled Project"}</h2>
              </div>
              <p className="text-sm text-gray-600 mb-3 line-clamp-3">{project.details.description || "No description available."}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 text-sm text-gray-700 border-t pt-3 border-gray-100">
                <p><FaUserTie className="inline mr-2 text-gray-500" /> <span className="font-semibold">Manager:</span> {project.manager}</p>
                <p><FaClipboardList className="inline mr-2 text-gray-500" /> <span className="font-semibold">My Role:</span> <span className="capitalize">{project.role}</span></p>
                <p><FaTasks className="inline mr-2 text-gray-500" /> <span className="font-semibold">Tickets:</span> {project.tickets.resolved} / {project.tickets.total}</p>
                <p>
                  <span className="font-semibold">Status:</span>
                  <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-medium
                      ${project.details.status && project.details.status.toLowerCase() === 'accepted' ? 'bg-green-100 text-green-800' :
                        project.details.status && project.details.status.toLowerCase() === 'unseen' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'}`}>
                    {project.details.status || 'N/A'}
                  </span>
                </p>
                <p><span className="font-semibold">Deadline:</span> {formatDate(project.details.endDate)}</p>
                <p><span className="font-semibold">Members:</span> {project.details.Members ? project.details.Members.length : '0'}</p>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50 font-inter">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex-1 overflow-y-auto p-4 md:p-8 transition-all duration-300 ease-in-out">
        <Topbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <div className="min-h-screen p-6 md:p-0">
          <h1 className="text-3xl font-extrabold mb-8 text-center text-gray-900 animate-fade-in-down">Your Projects</h1>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-8 animate-fade-in-down">
            <div className="w-full sm:w-auto relative">
              <label htmlFor="roleFilter" className="sr-only">Filter by Role:</label>
              <select
                id="roleFilter"
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm
                           text-gray-800 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500
                           hover:border-blue-400 transition duration-200 ease-in-out cursor-pointer"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="developer">Developer</option>
                <option value="viewer">Viewer</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9z" />
                </svg>
              </div>
            </div>
            <div className="flex items-center border border-gray-300 rounded-lg px-4 py-2 bg-white shadow-sm w-full sm:w-64 focus-within:ring-2 focus-within:ring-blue-500 transition duration-200">
              <AiOutlineSearch className="text-gray-500 mr-2 text-lg" />
              <input
                type="text"
                placeholder="Search by title or description"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full outline-none bg-transparent text-gray-800 placeholder-gray-500"
              />
            </div>
          </div>

          {renderContent()}
        </div>
      </div>

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

        @media (max-width: 768px) {
          .md\\:p-8 {
            padding: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Projects;