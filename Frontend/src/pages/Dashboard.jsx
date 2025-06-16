import React, { useState, useMemo, useEffect } from "react";
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import axios from "axios";
import { User, Loader2, Users, Briefcase, ClipboardList } from "lucide-react";
import { FaTasks, FaProjectDiagram } from 'react-icons/fa';
import { useQuery, useQueries, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from "react-router-dom";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// Import Chart.js components
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

const statusColor = {
  Completed: "bg-green-100 text-green-700",
  Delayed: "bg-yellow-100 text-yellow-800",
  Active: "bg-blue-100 text-blue-700",
  "At risk": "bg-red-100 text-red-700",
  "Not Started": "bg-gray-100 text-gray-700",
  "On Hold": "bg-orange-100 text-orange-700",
  accepted: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  unseen: "bg-yellow-100 text-yellow-800",
};

// --- Data Fetching Functions ---

const fetchUserData = async () => {
  const resp = await axios.get(`${BACKEND_URL}/user/data`, { withCredentials: true });
  if (!resp.data.success) throw new Error("Failed to fetch user data");
  return resp.data.user;
};

const fetchTicketsSummary = async () => {
  const resp = await axios.get(`${BACKEND_URL}/user/myticketslength`, { withCredentials: true });
  if (!resp.data.success) throw new Error("Failed to fetch ticket summary");
  return resp.data.data;
};

const fetchProjectAndManagerDetails = async ({ queryKey }) => {
  const [_, projectData] = queryKey;
  const projectId = projectData.projectID;
  const userProjectStatus = projectData.status;

  const projectRes = await axios.get(`${BACKEND_URL}/project/${projectId}`, { withCredentials: true });
  const project = projectRes.data.data;

  let managerName = "Unknown";
  if (project.CreatedBy) {
    const managerRes = await axios.get(`${BACKEND_URL}/user/${project.CreatedBy}`, { withCredentials: true });
    const manager = managerRes.data.data;
    managerName = manager.name || manager.username || "Unknown";
  }

  const membersCount = project.Members ? project.Members.length : 0;

  const overallStatus = project.overallStatus || "Not Started";

  return {
    projectID: projectId,
    title: project.title,
    description: project.description,
    userProjectStatus: userProjectStatus,
    overallStatus: overallStatus,
    managerName: managerName,
    membersCount: membersCount,
  };
};

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [managerFilter, setManagerFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const {
    data: userData,
    isLoading: isLoadingUserData,
    isError: isErrorUserData,
    error: userDataError,
  } = useQuery({
    queryKey: ['userData'],
    queryFn: fetchUserData,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  const {
    data: ticketsSummary = { totalTickets: 0, resolvedTickets: 0, todoTickets: 0, in_progressTickets: 0 },
    isLoading: isLoadingTickets,
    isError: isErrorTickets,
    error: ticketsError,
  } = useQuery({
    queryKey: ['ticketsSummary'],
    queryFn: fetchTicketsSummary,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });


  const userProjectsAccepted = useMemo(() => {
    return userData?.projects?.filter(p => p.status !== "rejected") || [];
  }, [userData]);

  const projectDetailsQueries = useQueries({
    queries: userProjectsAccepted.map(projectData => ({
      queryKey: ['projectDetails', projectData],
      queryFn: fetchProjectAndManagerDetails,
      enabled: !!projectData.projectID,
      staleTime: 10 * 60 * 1000,
      refetchOnWindowFocus: true,
      refetchOnMount: true,
    })),
  });

  const combinedProjectDetails = useMemo(() => {
    return projectDetailsQueries.map(query => query.data).filter(Boolean);
  }, [projectDetailsQueries]);

  const projectsSummaryByStatus = useMemo(() => {
    const projectStatuses = ['Not Started', 'Active', 'On Hold', 'Completed', 'Delayed', 'At risk', 'Rejected'];
    const counts = {};
    projectStatuses.forEach(status => {
      counts[status] = 0;
    });

    combinedProjectDetails.forEach(p => {
      if (counts.hasOwnProperty(p.overallStatus)) {
        counts[p.overallStatus]++;
      } else {
        console.warn("Unexpected project status encountered:", p.overallStatus);
      }
    });

    projectStatuses.forEach(status => {
      if (counts[status] === undefined) {
        counts[status] = 0;
      }
    });

    return counts;
  }, [combinedProjectDetails]);


  // --- Chart Data Preparation ---
  const ticketsPieChartData = useMemo(() => {
    const todo = ticketsSummary.todoTickets || 0;
    const inProgress = ticketsSummary.in_progressTickets || 0;
    const done = ticketsSummary.resolvedTickets || 0;
    const totalTickets = todo + inProgress + done;

    const labels = [];
    const data = [];
    const backgroundColors = [];
    const borderColors = [];
    const hoverBackgroundColors = [];
    const hoverBorderColors = [];

    // Define a palette of colors
    const palette = {
      'To Do': { bg: 'rgba(255, 99, 132, 0.8)', border: 'rgba(255, 99, 132, 1)', hoverBg: 'rgba(255, 99, 132, 1)', hoverBorder: 'rgba(255, 99, 132, 1.2)' }, // A vibrant red
      'In Progress': { bg: 'rgba(255, 205, 86, 0.8)', border: 'rgba(255, 205, 86, 1)', hoverBg: 'rgba(255, 205, 86, 1)', hoverBorder: 'rgba(255, 205, 86, 1.2)' }, // A vibrant yellow
      'Done': { bg: 'rgba(75, 192, 192, 0.8)', border: 'rgba(75, 192, 192, 1)', hoverBg: 'rgba(75, 192, 192, 1)', hoverBorder: 'rgba(75, 192, 192, 1.2)' }, // A vibrant green
    };


    if (todo > 0) {
      labels.push('To Do');
      data.push(todo);
      backgroundColors.push(palette['To Do'].bg);
      borderColors.push(palette['To Do'].border);
      hoverBackgroundColors.push(palette['To Do'].hoverBg);
      hoverBorderColors.push(palette['To Do'].hoverBorder);
    }
    if (inProgress > 0) {
      labels.push('In Progress');
      data.push(inProgress);
      backgroundColors.push(palette['In Progress'].bg);
      borderColors.push(palette['In Progress'].border);
      hoverBackgroundColors.push(palette['In Progress'].hoverBg);
      hoverBorderColors.push(palette['In Progress'].hoverBorder);
    }
    if (done > 0) {
      labels.push('Done');
      data.push(done);
      backgroundColors.push(palette['Done'].bg);
      borderColors.push(palette['Done'].border);
      hoverBackgroundColors.push(palette['Done'].hoverBg);
      hoverBorderColors.push(palette['Done'].hoverBorder);
    }

    return {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 2,
          hoverBackgroundColor: hoverBackgroundColors,
          hoverBorderColor: hoverBorderColors,
        },
      ],
      totalTickets: totalTickets,
    };
  }, [ticketsSummary]);

  const projectsPieChartData = useMemo(() => {
    const chartLabels = ['Not Started', 'Active', 'On Hold', 'Completed', 'Delayed', 'At risk'];
    const palette = {
      "Completed": { bg: 'rgba(54, 162, 235, 0.8)', border: 'rgba(54, 162, 235, 1)', hoverBg: 'rgba(54, 162, 235, 1)', hoverBorder: 'rgba(54, 162, 235, 1.2)' }, // Blue
      "Active": { bg: 'rgba(255, 159, 64, 0.8)', border: 'rgba(255, 159, 64, 1)', hoverBg: 'rgba(255, 159, 64, 1)', hoverBorder: 'rgba(255, 159, 64, 1.2)' },    // Orange
      "Delayed": { bg: 'rgba(153, 102, 255, 0.8)', border: 'rgba(153, 102, 255, 1)', hoverBg: 'rgba(153, 102, 255, 1)', hoverBorder: 'rgba(153, 102, 255, 1.2)' }, // Purple
      "At risk": { bg: 'rgba(255, 99, 132, 0.8)', border: 'rgba(255, 99, 132, 1)', hoverBg: 'rgba(255, 99, 132, 1)', hoverBorder: 'rgba(255, 99, 132, 1.2)' },   // Red
      "Not Started": { bg: 'rgba(201, 203, 207, 0.8)', border: 'rgba(201, 203, 207, 1)', hoverBg: 'rgba(201, 203, 207, 1)', hoverBorder: 'rgba(201, 203, 207, 1.2)' },// Gray
      "On Hold": { bg: 'rgba(255, 205, 86, 0.8)', border: 'rgba(255, 205, 86, 1)', hoverBg: 'rgba(255, 205, 86, 1)', hoverBorder: 'rgba(255, 205, 86, 1.2)' }, // Yellow
    };

    const data = [];
    const finalLabels = [];
    const finalBackgroundColors = [];
    const finalBorderColors = [];
    const finalHoverBackgroundColors = [];
    const finalHoverBorderColors = [];
    let totalProjects = 0;

    chartLabels.forEach(status => {
      const count = projectsSummaryByStatus[status] || 0;
      if (count > 0) {
        finalLabels.push(status);
        data.push(count);
        finalBackgroundColors.push(palette[status].bg);
        finalBorderColors.push(palette[status].border);
        finalHoverBackgroundColors.push(palette[status].hoverBg);
        finalHoverBorderColors.push(palette[status].hoverBorder);
        totalProjects += count;
      }
    });

    return {
      labels: finalLabels,
      datasets: [
        {
          data: data,
          backgroundColor: finalBackgroundColors,
          borderColor: finalBorderColors,
          borderWidth: 2,
          hoverBackgroundColor: finalHoverBackgroundColors,
          hoverBorderColor: finalHoverBorderColors,
        },
      ],
      totalProjects: totalProjects,
    };
  }, [projectsSummaryByStatus]);


  // Common Chart Options for both Pie Charts
  const commonPieChartOptions = (totalCount) => ({
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%', // Make it a donut chart
    plugins: {
      legend: {
        position: 'right', // Position legend to the right
        labels: {
          font: {
            size: 14, // Larger font for legend labels
            family: 'Inter, sans-serif',
          },
          color: '#333',
          boxWidth: 20, // Size of the color box
          padding: 15, // Padding between legend items
        },
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw;
            const percentage = ((value / totalCount) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          }
        },
        backgroundColor: 'rgba(0,0,0,0.7)',
        bodyFont: {
          family: 'Inter, sans-serif',
          size: 14,
        },
        titleFont: {
          family: 'Inter, sans-serif',
          size: 14,
          weight: 'bold'
        },
        padding: 10,
        cornerRadius: 4,
        displayColors: true,
      },
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 1000,
      easing: 'easeOutQuart',
    },
    elements: {
      arc: {
        hoverOffset: 10,
      }
    },
    rotation: -0.5 * Math.PI, // Start from top
  });


  const isLoadingProjects = isLoadingUserData || projectDetailsQueries.some(q => q.isLoading);
  const isAnyError = isErrorUserData || isErrorTickets || projectDetailsQueries.some(q => q.isError);

  const errorMessage = isErrorUserData ? userDataError.message :
    isErrorTickets ? ticketsError.message :
        projectDetailsQueries.map(q => q.error?.message).filter(Boolean).join(', ');

  const filteredProjects = useMemo(() => {
    return combinedProjectDetails.filter(p => {
      const isNotRejected = p.overallStatus.toLowerCase() !== "rejected";
      const matchesManager = !managerFilter || p.managerName === managerFilter;
      const matchesStatus = !statusFilter || p.overallStatus === statusFilter;

      return isNotRejected && matchesManager && matchesStatus;
    });
  }, [combinedProjectDetails, managerFilter, statusFilter]);

  const uniqueManagers = useMemo(() => {
    return [...new Set(combinedProjectDetails.map(p => p.managerName))].filter(Boolean);
  }, [combinedProjectDetails]);

  const uniqueStatuses = useMemo(() => {
    const allStatuses = [...new Set(combinedProjectDetails.map(p => p.overallStatus))].filter(Boolean);
    const preferredOrder = ["Completed", "Active", "Delayed", "At risk", "Not Started", "On Hold"];

    const filteredAllStatuses = allStatuses.filter(s => s.toLowerCase() !== "rejected");

    const sortedStatuses = preferredOrder.filter(status => filteredAllStatuses.includes(status));
    const otherStatuses = filteredAllStatuses.filter(status => !preferredOrder.includes(status) && !sortedStatuses.includes(status));
    return [...sortedStatuses, ...otherStatuses];
  }, [combinedProjectDetails]);

  return (
    <>

      {isAnyError ? (
        <div className="flex justify-center items-center h-screen bg-gray-50 font-inter">
          <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg shadow-md animate-fade-in" role="alert">
            <strong className="font-bold text-lg">Error:</strong>
            <span className="block sm:inline ml-2">{errorMessage}</span>
          </div>
        </div>
      ) : (
        <div className={`flex h-screen bg-gray-50 font-inter`}>
          <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} userData={userData} />
          <div className="flex-1 overflow-y-auto p-4 md:p-8 transition-all duration-300 ease-in-out">
            <Topbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} title="Dashboard" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 animate-fade-in-down">
              {/* Tasks Pie Chart */}
              <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 flex flex-col items-center justify-center animate-fade-in hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center justify-between w-full mb-4">
                  <h3 className="text-xl font-semibold text-gray-800">Tasks Summary</h3>
                  <FaTasks className="text-purple-600 text-2xl" />
                </div>
                {isLoadingTickets ? (
                  <div className="flex justify-center items-center h-48 w-full">
                    <Loader2 className="animate-spin-slow text-blue-500 h-12 w-12" />
                  </div>
                ) : ticketsPieChartData.totalTickets > 0 ? (
                  <div className="relative w-full max-w-xs h-64 md:h-72 flex items-center justify-center">
                    <Pie
                      data={ticketsPieChartData}
                      options={commonPieChartOptions(ticketsPieChartData.totalTickets)}
                    />
                   
                    <div className="absolute w-[39%] left-[86%] top-[94%] -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                      <p className="text-3xl font-extrabold text-gray-900">{ticketsPieChartData.totalTickets}</p>
                      <p className="text-sm text-gray-600">Total Tasks</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No tasks to display.</p>
                )}
              </div>

              {/* Projects Pie Chart */}
              <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 flex flex-col items-center justify-center animate-fade-in hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center justify-between w-full mb-4">
                  <h3 className="text-xl font-semibold text-gray-800">Projects Summary</h3>
                  <FaProjectDiagram className="text-green-600 text-2xl" />
                </div>
                {isLoadingProjects ? (
                  <div className="flex justify-center items-center h-48 w-full">
                    <Loader2 className="animate-spin-slow text-blue-500 h-12 w-12" />
                  </div>
                ) : projectsPieChartData.totalProjects > 0 ? (
                  <div className="relative w-full max-w-xs h-64 md:h-72 flex items-center justify-center">
                    <Pie
                      data={projectsPieChartData}
                      options={commonPieChartOptions(projectsPieChartData.totalProjects)}
                    />
                    
                    <div className="absolute w-[39%] left-[86%] top-[94%]  -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                      <p className="text-3xl font-extrabold text-gray-900">{projectsPieChartData.totalProjects}</p>
                      <p className="text-sm text-gray-600">Total Projects</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No projects to display.</p>
                )}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg mb-6 animate-fade-in-up">
              <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold text-gray-900">Your Projects Overview</h2>
                <div className="flex flex-wrap gap-4">
                  <div className="relative w-full md:w-48">
                    <select
                      className="w-full pl-4 pr-10 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm
                                          text-gray-800 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500
                                          hover:border-blue-400 transition duration-200 ease-in-out cursor-pointer"
                      onChange={e => setManagerFilter(e.target.value)}
                      value={managerFilter}
                    >
                      <option value="">All Managers</option>
                      {uniqueManagers.map((name, idx) => (
                        <option key={idx} value={name}>{name}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9z" />
                      </svg>
                    </div>
                  </div>
                  <div className="relative w-full md:w-48">
                    <select
                      className="w-full pl-4 pr-10 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm
                                          text-gray-800 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500
                                          hover:border-blue-400 transition duration-200 ease-in-out cursor-pointer"
                      onChange={e => setStatusFilter(e.target.value)}
                      value={statusFilter}
                    >
                      <option value="">All Statuses</option>
                      {uniqueStatuses.map((st, idx) => (
                        <option key={idx} value={st}>{st}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {isLoadingProjects ? (
                <div className="flex justify-center items-center h-48">
                  <Loader2 className="animate-spin-slow text-blue-500 h-16 w-16" />
                </div>
              ) : filteredProjects.length === 0 && userProjectsAccepted.length === 0 ? (
                <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded-md" role="alert">
                  <p className="font-bold">No Projects Assigned</p>
                  <p className="text-sm">It looks like you haven't been assigned to any projects yet.</p>
                </div>
              ) : filteredProjects.length === 0 ? (
                <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded-md" role="alert">
                  <p className="font-bold">No Matching Projects</p>
                  <p className="text-sm">No projects match the selected filters.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProjects.map((p) => (
                    <div
                      key={p.projectID}
                      className={`rounded-2xl shadow-lg p-6 space-y-3 border border-gray-200
                                          transition-all duration-300 ease-in-out transform animate-fade-in
                                          bg-white hover:shadow-xl hover:-translate-y-1 cursor-pointer`}
                      onClick={() => {
                        navigate(`/project/${p.projectID}`);
                      }}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <FaProjectDiagram className="text-blue-600 text-2xl" />
                        <h3 className="text-xl font-bold text-gray-800 line-clamp-1">{p.title}</h3>
                      </div>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-3">{p.description}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 text-sm text-gray-700 border-t pt-3 border-gray-100">
                        <p><User className="inline-block w-4 h-4 mr-2 text-gray-500" /> <span className="font-semibold">Manager:</span> {p.managerName}</p>
                        <p><Users className="inline-block w-4 h-4 mr-2 text-gray-500" /> <span className="font-semibold">Members:</span> {p.membersCount}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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

                .animate-fade-in-up {
                    animation: fadeInUp 0.6s ease-out forwards;
                    opacity: 0;
                    transform: translateY(20px);
                }

                .animate-spin-slow {
                    animation: spin 1.5s linear infinite;
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes fadeInDown {
                    from { opacity: 0; transform: translateY(-20px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
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

                .line-clamp-1 {
                    display: -webkit-box;
                    -webkit-line-clamp: 1;
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
    </>
  );
}