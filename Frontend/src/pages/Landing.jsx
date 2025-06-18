import React, { useEffect, useRef } from 'react';
const ProjectIcon = () => (
  <svg className="w-8 h-8 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
  </svg>
);

const KanbanIcon = () => (
  <svg className="w-8 h-8 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12V4m1 12H3m12 0a1 1 0 011-1h1a1 1 0 011 1v1a1 1 0 01-1 1h-1a1 1 0 01-1-1zm-6 0a1 1 0 011-1h1a1 1 0 011 1v1a1 1 0 01-1 1h-1a1 1 0 01-1-1z"></path>
  </svg>
);

const CollaborateIcon = () => (
  <svg className="w-8 h-8 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2m3-2v-2c0-.552.448-1 1-1h6c.552 0 1 .448 1 1v2m-3-10a4 4 0 11-8 0 4 4 0 018 0zM12 9a4 4 0 11-8 0 4 4 0 018 0zm6 0a6 6 0 100 12 6 6 0 000-12z"></path>
  </svg>
);

const ProfileIcon = () => (
  <svg className="w-8 h-8 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
  </svg>
);

const DiscussionIcon = () => (
  <svg className="w-8 h-8 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
  </svg>
);


function Landing() {

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-inter antialiased">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
          body {
            font-family: 'Inter', sans-serif;
          }

          /* Custom CSS for subtle background animation in Hero */
          .animated-blob-1 {
            animation: moveBlob 15s infinite alternate ease-in-out;
          }
          .animated-blob-2 {
            animation: moveBlob 18s infinite alternate-reverse ease-in-out;
            animation-delay: 2s;
          }
          .animated-blob-3 {
            animation: moveBlob 12s infinite alternate ease-in-out;
            animation-delay: 4s;
          }

          @keyframes moveBlob {
            0% {
              transform: translate(0, 0) scale(1);
              opacity: 0.6;
            }
            25% {
              transform: translate(20px, -30px) scale(1.05);
              opacity: 0.7;
            }
            50% {
              transform: translate(-10px, 50px) scale(0.95);
              opacity: 0.5;
            }
            75% {
              transform: translate(30px, 10px) scale(1.1);
              opacity: 0.8;
            }
            100% {
              transform: translate(0, 0) scale(1);
              opacity: 0.6;
            }
          }

          /* General styling for rounded corners */
          .rounded-xl { border-radius: 0.75rem; }
          .rounded-lg { border-radius: 0.5rem; }
          .rounded-full { border-radius: 9999px; }

          /* New Animations */
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes scaleIn {
            from {
              opacity: 0;
              transform: scale(0.95);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }

          /* Apply animations with delays */
          .animate-fade-in-1s { animation: fadeIn 1s ease-out forwards; }
          .animate-fade-in-up-05s { animation: fadeInUp 0.5s ease-out forwards; }
          .animate-fade-in-up-07s { animation: fadeInUp 0.7s ease-out forwards; }
          .animate-fade-in-up-09s { animation: fadeInUp 0.9s ease-out forwards; }
          .animate-scale-in-1s { animation: scaleIn 1s ease-out forwards; }
          .animate-fade-in-up-delay-01 { animation-delay: 0.1s; }
          .animate-fade-in-up-delay-02 { animation-delay: 0.2s; }
          .animate-fade-in-up-delay-03 { animation-delay: 0.3s; }
          .animate-fade-in-up-delay-04 { animation-delay: 0.4s; }
          .animate-fade-in-up-delay-05 { animation-delay: 0.5s; }
          .animate-fade-in-up-delay-06 { animation-delay: 0.6s; }

          /* Feature card hover animation (more prominent shadow) */
          .feature-card-hover:hover {
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05),
                        0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            transform: translateY(-5px) scale(1.01); /* Slightly more lift and scale */
          }
        `}
      </style>

      {/* Header */}
      <header className="relative z-10 p-4 sm:p-6 flex items-center bg-transparent opacity-0 animate-fade-in-1s">
            <img className='m-1' src='/logo.png' alt="" width='35px' />
        <div className="text-2xl sm:text-3xl font-bold text-indigo-600 dark:text-indigo-400">
          Taskara
        </div>
        {/* Login/Signup buttons removed from header */}
      </header>

      {/* Hero Section */}
      <section className="relative h-[calc(100vh-6rem)] flex items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-50 dark:from-gray-800 to-white dark:to-gray-900 p-4 sm:p-8 md:p-12">
        {/* Animated Background Shapes */}
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-indigo-200 dark:bg-indigo-800 rounded-full mix-blend-multiply filter blur-xl opacity-60 animated-blob-1"></div>
        <div className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-purple-200 dark:bg-purple-800 rounded-full mix-blend-multiply filter blur-xl opacity-60 animated-blob-2"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-pink-200 dark:bg-pink-800 rounded-full mix-blend-multiply filter blur-xl opacity-60 animated-blob-3"></div>

        <div className="relative z-10 max-w-4xl text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 opacity-0 animate-fade-in-up-07s">
            Streamline Your Projects, Elevate Your Team
          </h1>
          <p className="text-lg sm:text-xl text-gray-700 dark:text-gray-300 mb-8 max-w-2xl mx-auto opacity-0 animate-fade-in-up-09s">
            Taskara is an intuitive project management platform designed to simplify collaboration, track progress, and empower your team to achieve more.
          </p>
          <a href="/user/auth" className="px-8 py-3 sm:px-10 sm:py-4 bg-indigo-600 text-white text-lg font-semibold rounded-lg hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition duration-300 shadow-xl transform hover:scale-105 inline-block opacity-0 animate-scale-in-1s">
            Get Started - It's Free!
          </a>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-20 bg-white dark:bg-gray-900 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto text-center mb-12 opacity-0 animate-fade-in-up-05s">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-gray-200 mb-4">
            Powerful Features for Productive Teams
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Taskara brings all your project needs into one clean, responsive interface.
          </p>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-xl shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700 feature-card-hover opacity-0 animate-fade-in-up-05s animate-fade-in-up-delay-01">
            <div className="flex justify-center items-center mb-4">
              <ProjectIcon />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
              Effortless Project Management
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Create, organize, and oversee all your projects from a centralized dashboard. Add members and define roles with ease.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-xl shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700 feature-card-hover opacity-0 animate-fade-in-up-05s animate-fade-in-up-delay-02">
            <div className="flex justify-center items-center mb-4">
              <KanbanIcon />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
              Intuitive Kanban Boards
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Visualize your workflow. Drag and drop tickets to update their status and keep everyone aligned on progress.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-xl shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700 feature-card-hover opacity-0 animate-fade-in-up-05s animate-fade-in-up-delay-03">
            <div className="flex justify-center items-center mb-4">
              <CollaborateIcon />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
              Seamless Team Collaboration
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Invite team members via email, assign tasks, and set deadlines for crystal-clear accountability.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-xl shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700 feature-card-hover opacity-0 animate-fade-in-up-05s animate-fade-in-up-delay-04">
            <div className="flex justify-center items-center mb-4">
              <DiscussionIcon />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
              Dedicated Ticket Discussions
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Each ticket gets its own page for detailed discussions, ensuring all context is captured and accessible.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-xl shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700 feature-card-hover opacity-0 animate-fade-in-up-05s animate-fade-in-up-delay-05">
            <div className="flex justify-center items-center mb-4">
              <ProfileIcon />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
              Personalized User Profiles
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Members can easily update their profile details, including name, email, and profile pictures.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-xl shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700 feature-card-hover opacity-0 animate-fade-in-up-05s animate-fade-in-up-delay-06">
            <div className="flex justify-center items-center mb-4">
              <svg className="w-8 h-8 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-6a2 2 0 012-2h2a2 2 0 012 2v6m-3-10V7m0 4h.01M12 21v-7a2 2 0 012-2h2a2 2 0 012 2v7m-6 0h6m-9-2a2 2 0 00-2-2H5a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2zM9 10a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
              Comprehensive Project Tracking
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Keep a close eye on all your projects' progress, deadlines, and team contributions from a unified view.
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-16 sm:py-20 bg-indigo-600 dark:bg-indigo-800 text-white px-4 sm:px-8 opacity-0 animate-scale-in-1s animate-fade-in-up-delay-06">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to Transform Your Workflow?
          </h2>
          <p className="text-lg sm:text-xl mb-8 opacity-90">
            Join Taskara today and experience the difference a truly intuitive project management platform can make.
          </p>
          <a href="/user/auth" className="px-8 py-3 sm:px-10 sm:py-4 bg-white text-indigo-600 text-lg font-semibold rounded-lg hover:bg-gray-100 dark:bg-gray-200 dark:text-indigo-900 transition duration-300 shadow-xl transform hover:scale-105 inline-block">
            Start Your Free Trial Now!
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-gray-800 dark:bg-gray-950 text-gray-400 text-center text-sm px-4 sm:px-8 opacity-0 animate-fade-in-1s">
        <div className="max-w-6xl mx-auto">
          <p className="mb-2">&copy; {new Date().getFullYear()} Taskara. All rights reserved.</p>
          <p>Built with ❤️</p>
        </div>
      </footer>
    </div>
  );
}

export default Landing;
