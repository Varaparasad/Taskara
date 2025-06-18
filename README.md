# Taskara - Your Intuitive Project Management Solution

## Overview

Taskara is a full-stack project management web application inspired by popular tools like Jira and Linear. It provides a seamless and efficient platform for teams to collaborate, track projects, and manage tasks with ease. With its clean user interface, responsive design, and robust features, Taskara aims to streamline your project workflows and boost productivity.

## Live Demo

Experience Taskara live at: [https://taskara-1-9gnl.onrender.com/](https://taskara-1-9gnl.onrender.com/)

## Features

Taskara offers a comprehensive set of features designed to enhance team collaboration and project management:

* **User Authentication:** Secure login and signup functionalities for individual users.
* **User Based roles and permissions**.
* **Project Creation & Management:**
    * Create new projects with customizable details.
    * Add and manage project members.
    * Edit and delete projects.
* **Team Collaboration:**
    * **Invitation System:** Send email invitations to prospective project members.
    * **Accept/Decline Invitations:** Members can accept invitations to join projects.
* **Ticket Management:**
    * **Ticket Assignment:** Assign tickets to specific project members.
    * **Deadlines:** Set deadlines for tickets to ensure timely completion.
    * **Kanban Board:** Visually track ticket status with a drag-and-drop Kanban board (e.g., To Do, In Progress, Done).
    * **Ticket Editing:** Members can edit ticket details and change their status.
    * **Ticket Deletion:** Delete tickets when no longer needed.
* **Dedicated Ticket Discussion Page:** A separate page for each ticket to facilitate focused discussions among team members.
* **User Profile Management:**
    * Edit profile details, including name and email.
    * Update profile pictures.
* **Project Tracking:** Easily monitor the progress and status of all your projects.
* **Clean and Intuitive UI/UX:** A simple, modern, and user-friendly interface designed for optimal usability.
* **Responsive Design:** Optimized for seamless viewing and interaction across all screen ratios and devices (desktops, tablets, mobile phones).

## Tech Stack

Taskara is built using a modern and powerful tech stack:

* **Frontend:**
    * **React.js:** A declarative, efficient, and flexible JavaScript library for building user interfaces.
* **Backend:**
    * **Node.js:** A JavaScript runtime built on Chrome's V8 JavaScript engine, enabling fast and scalable network applications.
* **Database:**
    * **MongoDB:** A NoSQL document database known for its flexibility and scalability, ideal for handling various data structures.

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

Make sure you have the following installed on your system:

* Node.js (LTS version recommended)
* npm (comes with Node.js) or Yarn
* MongoDB (local instance or a cloud-hosted service like MongoDB Atlas)

### Installation

1.  **Clone the repository:**

    ```bash
    git clone [https://github.com/Varaparasad/Taskara.git]
    cd Taskara
    ```

2.  **Install Frontend Dependencies:**

    ```bash
    cd Frontend
    npm install
    # or yarn install
    ```

3.  **Install Backend Dependencies:**

    ```bash
    cd Backend
    npm install
    # or yarn install
    ```

### Running the Application

1.  **Start the Backend Server:**

    From the `backend` directory:

    ```bash
    npm run dev
    # or yarn run dev
    ```

    The backend server will typically run on `http://localhost:3000`.

2.  **Start the Frontend Development Server:**

    From the `frontend` directory:

    ```bash
    npm run dev
    # or yarn run dev
    ```

    The frontend application will typically open in your browser at `http://localhost:5173`.
