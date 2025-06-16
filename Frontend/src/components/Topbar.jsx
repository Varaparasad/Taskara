import React,{useState,useEffect} from "react";
import { Menu, X, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";

const BACKEND_URL =import.meta.env.VITE_BACKEND_URL;

const fetchUserData = async () => {
        try {
            const res = await axios.get(`${BACKEND_URL}/user/data`, { withCredentials: true });
            return res.data.user || {};
        } catch (err) {

            return {}; 
        }
    };
    
const Topbar = ({ sidebarOpen, setSidebarOpen, title }) => {

    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    useEffect(() => {
        fetchUserData().then((data) => setUserData(data));
    }, []); 

    const profilePicSrc = userData?.profilePic || 'https://placehold.co/150x150/cbd5e1/1f2937?text=User';

    return (
        <div className="flex items-center justify-between mb-6 p-2 bg-white rounded-lg shadow-sm">
            <div className="flex items-center gap-2">
                <button
                    className="p-2 rounded-full md:hidden text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
                >
                    {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
                <h1 className="text-xl font-semibold md:text-2xl text-gray-800">{title}</h1>
            </div>
            <div className="flex items-center gap-4">
                {/* Notifications Button */}
                <button className="relative p-2 rounded-full hover:bg-gray-100 transition-colors duration-200">
                    <Bell className="w-6 h-6 text-gray-700" />
                    {/* Example notification dot (can be conditional based on unread notifications) */}
                    <span className="absolute top-1 right-1 inline-block w-2.5 h-2.5 bg-red-500 rounded-full border border-white"></span>
                </button>
                {/* User Profile Picture */}
                <button
                    onClick={() => navigate("/user/profile")}
                    className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full transition-all duration-200"
                    aria-label="Go to profile page"
                >
                    <img
                        src={profilePicSrc}
                        alt={userData?.name ? `${userData.name}'s Profile` : 'User profile picture'}
                        className="h-9 w-9 rounded-full object-cover border-2 border-gray-200 hover:border-blue-400 transition-colors duration-200"
                        // Fallback to a placeholder URL instead of base64
                        onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/150x150/cbd5e1/1f2937?text=User'; }}
                    />
                </button>
            </div>
        </div>
    );
};

export default Topbar;
