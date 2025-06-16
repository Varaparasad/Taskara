import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { Loader2, ArrowLeft, CalendarDays, User, Folder, ClipboardCopy, MessageSquare, Send, Paperclip, XCircle } from 'lucide-react';
import { format } from 'date-fns';

// Helper functions (reused from other components for consistency)
const getPriorityColorClass = (priority) => {
  switch (priority?.toLowerCase()) {
    case 'high':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
    case 'low':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  }
};

const getTicketStatusColorClass = (status) => {
  switch (status?.toLowerCase()) {
    case 'todo':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
    case 'in_progress':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
    case 'done':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  }
};

// Data fetching function for a single ticket
const fetchSingleTicketDetails = async ({ queryKey }) => {
  const [, ticketID] = queryKey;
  if (!ticketID) throw new Error("Ticket ID is required");
  try {
    const res = await axios.get(`http://localhost:3000/ticket/${ticketID}`, { withCredentials: true });
    return res.data.data;
  } catch (err) {
    console.error(`Error fetching ticket details for ID ${ticketID}:`, err);
    throw err;
  }
};

// Data fetching function for user details
const fetchUserDetails = async ({ queryKey }) => {
  const [, userID] = queryKey;
  if (!userID) throw new Error("User ID is required");
  try {
    const res = await axios.get(`http://localhost:3000/user/${userID}`, { withCredentials: true });
    return res.data.data; // Assuming your API returns user data under `data.data`
  } catch (err) {
    console.error(`Error fetching user details for ID ${userID}:`, err);
    throw err;
  }
};

const TicketDetails = () => {
  const { ticketID } = useParams();
  const navigate = useNavigate();
  const [commentText, setCommentText] = useState('');
  const [attachedFile, setAttachedFile] = useState(null);
  const commentsEndRef = useRef(null);

  // Initial comments with a very long word to test text wrapping properly
  const [comments, setComments] = useState([
    { id: 1, user: 'User1', time: '2025-06-14T10:00:00Z', text: 'This is the first comment on this ticket. It is a bit longer to test how text wrapping works within the comment bubble. Let\'s see if it wraps correctly without causing horizontal scrollbars. We are adding more content here to truly stress test the wrapping feature. Hopefully, it behaves as expected. Here is a verylongwordwithoutspacesthatshouldwrapcorrectlyinsteadofoverflowing.' },
    { id: 2, user: 'User2', time: '2025-06-14T10:15:00Z', text: 'We should prioritize this fix soon. This comment is medium length.' },
    { id: 3, user: 'User3', time: '2025-06-14T10:30:00Z', text: 'I agree, it seems critical. Anotherverylongwordwithoutspacesshouldwrapaswell.' },
  ]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['ticketDetails', ticketID],
    queryFn: fetchSingleTicketDetails,
    enabled: !!ticketID,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const ticket = data?.ticket;
  
  const project = data?.project;

  // useQuery for fetching assignee's full details
  const { data: assigneeData, isLoading: isLoadingAssignee, isError: isErrorAssignee, error: assigneeError } = useQuery({
    queryKey: ['assigneeDetails', ticket?.assignee], 
    queryFn: fetchUserDetails,
    enabled: !!ticket?.assignee,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  
  const assignee = assigneeData;
  const assigneeProjectsCount = assigneeData?.projects?.length || 0;

  // Effect to scroll to bottom when comments update
  useEffect(() => {
    if (commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments]);

  // Function to copy text to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy: ', err);
    });
  };

  const handleAddComment = () => {
    if (commentText.trim() || attachedFile) {
      setComments([
        ...comments,
        {
          id: comments.length + 1,
          user: 'Current User', // In a real app, this would be the logged-in user's name
          time: new Date().toISOString(),
          text: commentText.trim(),
          attachment: attachedFile ? { name: attachedFile.name, url: URL.createObjectURL(attachedFile) } : null,
        },
      ]);
      setCommentText('');
      setAttachedFile(null); // Clear attached file after sending
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setAttachedFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setAttachedFile(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
        <Loader2 className="animate-spin-slow text-blue-500 h-20 w-20" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
        <div className="bg-red-900 border border-red-700 text-red-200 px-6 py-4 rounded-lg shadow-md animate-fadeIn" role="alert">
          <strong className="font-bold text-lg">Error:</strong>
          <span className="block sm:inline ml-2">{error?.message || "Failed to load ticket details."}</span>
          <div className="mt-4 flex justify-center">
            <button
              onClick={() => navigate(-1)}
              className="bg-red-700 hover:bg-red-800 text-white font-medium px-4 py-2 rounded-lg transition-colors duration-200"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
        <div className="bg-gray-800 rounded-2xl shadow-xl p-6 text-center animate-fadeIn">
          <h3 className="text-xl font-bold text-gray-200 mb-4">Ticket Not Found</h3>
          <p className="text-gray-400 mb-6">The ticket you are looking for does not exist or you do not have permission to view it.</p>
          <button
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition duration-200"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-inter p-4 sm:p-6 lg:p-8 animate-fadeIn">
      <div className="max-w-6xl mx-auto bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 lg:p-10 relative">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-6 left-6 text-gray-400 hover:text-gray-200 transition-colors duration-200 flex items-center gap-1 z-10"
          title="Go Back"
        >
          <ArrowLeft className="w-8 h-8" />
        </button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 border-b border-gray-700 pb-6 sm:pl-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-50 leading-tight mb-4 sm:mb-0">
            {ticket.title}
          </h1>
          <div className="flex flex-wrap gap-3 sm:mt-0 mt-3">
            <span className={`px-4 py-1.5 rounded-full font-semibold text-sm ${getPriorityColorClass(ticket.priority)}`}>
              Priority: {ticket.priority}
            </span>
            <span className={`px-4 py-1.5 rounded-full font-semibold text-sm ${getTicketStatusColorClass(ticket.status)}`}>
              Status: {ticket.status}
            </span>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          {/* Left Column: Ticket Details */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-gray-50 mb-5">Ticket Information</h2>

            <div className="bg-gray-700 p-6 rounded-xl shadow-sm space-y-6">
              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold text-gray-200 mb-2 flex items-center gap-2">
                  Description
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  {ticket.description}
                </p>
              </div>

              {/* Due Date */}
              <div>
                <h3 className="text-lg font-semibold text-gray-200 mb-2 flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-gray-400" /> Due Date
                </h3>
                <p className="text-gray-300">
                  {ticket.DueDate ? format(new Date(ticket.DueDate), 'EEEE, MMM dd, yyyy') : 'N/A'}
                </p>
              </div>

              {/* Created At */}
              <div>
                <h3 className="text-lg font-semibold text-gray-200 mb-2 flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-gray-400" /> Created On
                </h3>
                <p className="text-gray-300">
                  {ticket.createdAt ? format(new Date(ticket.createdAt), 'EEEE, MMM dd, yyyy - hh:mm a') : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Assignee and Project Details */}
          <div className="lg:col-span-1 space-y-8">
            {/* Assignee Details */}
            <div>
              <h2 className="text-2xl font-bold text-gray-50 mb-5">Assignee</h2>
              <div className="bg-gray-700 p-6 rounded-xl shadow-sm space-y-4">
                {isLoadingAssignee ? (
                  <p className="text-gray-400">Loading assignee details...</p>
                ) : isErrorAssignee ? (
                  <p className="text-red-400">Error loading assignee: {assigneeError?.message}</p>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <User className="w-6 h-6 text-blue-400" />
                      <p className="text-gray-200 text-lg font-semibold">
                        {assignee?.name || 'N/A'}
                      </p>
                    </div>
                    {assignee?.email && (
                      <p className="text-gray-400 text-sm flex items-center gap-2">
                        <span className="font-medium">Email:</span> {assignee.email}
                      </p>
                    )}
                    {/* Assuming you might get a count of projects from the user endpoint */}
                    {assigneeProjectsCount !== undefined && (
                      <p className="text-gray-400 text-sm flex items-center gap-2">
                        <span className="font-medium">Projects Assigned:</span> {assigneeProjectsCount}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Project Details */}
            <div>
              <h2 className="text-2xl font-bold text-gray-50 mb-5">Project</h2>
              <div className="bg-gray-700 p-6 rounded-xl shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                  <Folder className="w-6 h-6 text-green-400" />
                  <p className="text-gray-200 text-lg font-semibold">
                    {project?.title || 'N/A'}
                  </p>
                </div>
                {project?.description && (
                  <p className="text-gray-400 text-sm">
                    <span className="font-medium">Description:</span> {project.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="mt-10 border-t border-gray-700 pt-8">
          <h2 className="text-2xl font-bold text-gray-50 mb-6 flex items-center gap-3">
            <MessageSquare className="w-7 h-7 text-purple-400" /> Comments ({comments.length})
          </h2>

          <div className="bg-gray-700 rounded-xl p-6 shadow-sm max-h-[400px] overflow-y-auto custom-scrollbar animate-fadeInUp">
            {comments.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No comments yet. Be the first to comment!</p>
            ) : (
              <div className="space-y-6">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex items-start gap-4 animate-slideInFromLeft">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
                      {comment.user.charAt(0)}
                    </div>
                    <div className="flex-grow bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-600 min-w-0"> {/* Added min-w-0 */}
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-gray-50">{comment.user}</span>
                        <span className="text-xs text-gray-400">
                          {format(new Date(comment.time), 'MMM dd, yyyy HH:mm')}
                        </span>
                      </div>
                      {/* Added 'break-words' to p tag for text wrapping */}
                      <p className="text-gray-300 leading-relaxed break-words">
                        {comment.text}
                      </p>
                      {comment.attachment && (
                        <div className="mt-2 flex items-center gap-2 text-blue-400 text-sm">
                          <Paperclip className="w-4 h-4" />
                          <a
                            href={comment.attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline truncate" // Added truncate for file name
                          >
                            {comment.attachment.name}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={commentsEndRef} />
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 animate-fadeIn">
            {/* Attachment Button */}
            <label htmlFor="file-upload" className="flex-shrink-0 bg-gray-700 hover:bg-gray-600 text-gray-300 p-3 rounded-full shadow-lg cursor-pointer transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800">
              <input
                id="file-upload"
                type="file"
                className="hidden"
                onChange={handleFileChange}
              />
              <Paperclip className="w-6 h-6" />
            </label>
            {attachedFile && (
              <div className="flex items-center gap-2 bg-gray-700 p-2 rounded-lg text-sm text-gray-300">
                <span className="truncate max-w-[150px]">{attachedFile.name}</span> {/* Added truncate to filename preview */}
                <button
                  onClick={handleRemoveFile}
                  className="text-red-400 hover:text-red-200"
                  title="Remove attachment"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            )}

            <textarea
              placeholder="Write a comment..."
              className="flex-grow px-5 py-3 rounded-xl border border-gray-600 bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-base resize-y min-h-[60px] max-h-[150px]"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAddComment();
                }
              }}
              rows={2}
            />
            <button
              onClick={handleAddComment}
              className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 self-end sm:self-center"
              title="Add Comment"
            >
              <Send className="w-6 h-6" />
            </button>
          </div>
        </div>
        </div>

        {/* Styles are kept the same, ensuring Inter font and animations */}
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

          .animate-fadeInUp {
            animation: fadeInUp 0.6s ease-out forwards;
          }

          .animate-slideInFromLeft {
              animation: slideInFromLeft 0.5s ease-out forwards;
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

          @keyframes fadeInUp {
              from { opacity: 0; transform: translateY(20px); }
              to { opacity: 1; transform: translateY(0); }
          }

          @keyframes slideInFromLeft {
              from { opacity: 0; transform: translateX(-20px); }
              to { opacity: 1; transform: translateX(0); }
          }

          /* Custom Scrollbar for comments */
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }

          .custom-scrollbar::-webkit-scrollbar-track {
            background: #374151; /* gray-700 */
            border-radius: 10px;
          }

          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #6b7280; /* gray-500 */
            border-radius: 10px;
          }

          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #4b5563; /* gray-600 */
          }
        `}</style>
    </div>
  );
};

export default TicketDetails;