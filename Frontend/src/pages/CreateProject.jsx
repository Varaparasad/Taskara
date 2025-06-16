import React, { useState } from "react";
import Topbar from "../components/Topbar";
import Sidebar from "../components/Sidebar";
import axios from "axios";
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query'; // Import useMutation and useQueryClient
import { Loader2 } from 'lucide-react'; // For loading spinner
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const CreateProject = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [description, setDescription] = useState("");

  const navigate = useNavigate();
  const queryClient = useQueryClient(); // Get the query client instance

  // Define the mutation function for creating a project
  const createProjectMutation = useMutation({
    mutationFn: async (newProjectData) => {
      const response = await axios.post(`${BACKEND_URL}/project/create`, newProjectData, { withCredentials: true });
      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to create project");
      }
      return response.data;
    },
    onSuccess: () => {
      // Invalidate the 'userProjects' query to refetch data on Dashboard/Projects page
      queryClient.invalidateQueries(['userProjects']);
      alert("Project created successfully!");
      // Optionally navigate after success
      navigate('/projects');
    },
    onError: (error) => {
      console.error("Error creating project:", error.response?.data?.message || error.message);
      alert(`Failed to create project: ${error.response?.data?.message || error.message}`);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault(); // Prevent default form submission
    createProjectMutation.mutate({ title, description, startDate, endDate });
  };

  return (
    <div className="flex h-screen bg-gray-50 font-inter">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex-1 overflow-y-auto p-4 md:p-8 transition-all duration-300 ease-in-out">
        <Topbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} title="Create Project" />

        <div className="min-h-screen p-6 md:p-0">
          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8 space-y-8 animate-fade-in-up">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold text-gray-900 animate-fade-in-down">Create New Project</h2>
              <p className="text-md text-gray-600 mt-2">
                Fill out the details below to create a new project.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Project Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">Project Title</label>
                <input
                  id="title"
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                  placeholder="e.g. Website Redesign"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              {/* Start Date & End Date */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input
                    id="startDate"
                    type="date"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                  <input
                    id="endDate"
                    type="date"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Project Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">Project Description</label>
                <textarea
                  id="description"
                  rows="5"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                  placeholder="Add a brief description about the project goals, team, or technologies involved."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                ></textarea>
              </div>

              {/* Buttons and Loading/Message */}
              <div className="flex justify-end items-center gap-4 pt-4">
                {createProjectMutation.isPending && (
                  <Loader2 className="animate-spin-slow text-blue-500 h-6 w-6 mr-2" />
                )}
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700 transition duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={createProjectMutation.isPending}
                >
                  {createProjectMutation.isPending ? "Creating..." : "Create Project"}
                </button>
                <button
                  type="button" // Use type="button" to prevent accidental form submission
                  className="bg-gray-200 text-gray-800 px-8 py-3 rounded-xl hover:bg-gray-300 transition duration-300 shadow-md hover:shadow-lg"
                  onClick={() => {
                    // Reset form fields
                    setTitle("");
                    setStartDate("");
                    setEndDate("");
                    setDescription("");
                    createProjectMutation.reset(); // Clear mutation state (success/error messages)
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Tailwind CSS Customizations and Animations */}
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
      `}</style>
    </div>
  );
};

export default CreateProject;