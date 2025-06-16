import React, { useEffect, useState } from "react";
import { X, Plus, LayoutGrid, Briefcase, List } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {

    const navigate = useNavigate();
    const location = useLocation();
    const [userData, setUserData] = useState("");
    const [error, setError] = useState("");

    const fetchUserData = async () => {

        try {
            const response = await axios.get(`${BACKEND_URL}/user/data`,
            {
                withCredentials: true,
            }
        );
        if (response.data.success) {
            const user = response.data.user;
            setUserData(user);
        }
        } catch (error) {
            setError(error.message);
        }
    }
    useEffect(() => {
        fetchUserData();
    }, [location.pathname]);

    const handleNavigation = (path) => {
        navigate(path);
        setSidebarOpen(false);
    };

    // Menu items with icons
    const menuItems = [
        { name: "Dashboard", path: "/user/dashboard", icon: <LayoutGrid size={18} /> },
        { name: "Projects", path: "/projects", icon: <Briefcase size={18} /> },
        { name: "Tasks", path: "/user/tickets", icon: <List size={18} /> },
    ];


    return (
        <div
            className={`fixed inset-y-0 left-0 z-30 w-64 bg-black text-white transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0 md:block ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
                }`}
        >
            {/* Mobile Close */}
            <div className="md:hidden flex justify-end p-4">
                <button onClick={() => setSidebarOpen(false)}>
                    <X size={24} className="text-white" />
                </button>
            </div>

            {/* Logo/Brand */}
            <div className="p-4 font-bold text-xl border-b border-gray-700 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-orange-600 flex items-center justify-center font-black text-black text-sm">⭘</div>
                Promage
            </div>

            {/* Navigation */}
            <nav className="p-4 space-y-4">
                {/* Create new project button */}
                <div
                    onClick={() => handleNavigation("/project/create")}
                    className="bg-white text-black font-semibold flex items-center justify-center gap-2 px-4 py-3 rounded-full cursor-pointer hover:bg-gray-200 transition"
                >
                    <Plus size={20} className="text-orange-600" />
                    Create new project
                </div>

                {/* Dynamic menu */}
                {menuItems.map((item, i) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <div
                            key={i}
                            onClick={() => handleNavigation(item.path)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-full cursor-pointer transition ${isActive
                                ? "bg-white text-orange-600 font-semibold"
                                : "hover:bg-gray-800 text-white"
                                }`}
                        >
                            {item.icon}
                            {item.name}
                        </div>
                    );
                })}
            </nav>

            {/* Footer */}
            {userData && (<div className="absolute bottom-0 p-4 text-sm text-gray-300">
                <div className="font-semibold">{userData.name}</div>
                <div>{userData.email}</div>
            </div>)}
        </div>
    );
};

export default Sidebar;
