import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react'; 
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const passwordRules = [
    { regex: /.{6,}/, message: "Password must be at least 6 characters." },
    { regex: /[A-Z]/, message: "Password must contain an uppercase letter." },
    { regex: /[a-z]/, message: "Password must contain a lowercase letter." },
    { regex: /[^A-Za-z0-9]/, message: "Password must contain a special character." },
];

const Login = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [showPassword, setShowPassword] = useState(false);

    // Form state
    const [fields, setFields] = useState({
        email: "",
        username: "",
        password: "",
        confirmPassword: "",
    });
    const [errors, setErrors] = useState({});
    const [submitError, setSubmitError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false); // New state for loading

    const navigate = useNavigate();

    const handleChange = (e) => {
        setFields({ ...fields, [e.target.id]: e.target.value });
        setErrors({ ...errors, [e.target.id]: "" });
        setSubmitError("");
    };

    const validate = () => {
        let newErrors = {};
        if (!fields.email) newErrors.email = "Email is required.";
        if (!isLogin && !fields.username) newErrors.username = "Username is required.";
        if (!fields.password) newErrors.password = "Password is required.";
        if (!isLogin && !fields.confirmPassword) newErrors.confirmPassword = "Confirm Password is required.";

        // Password rules for signup
        if (fields.password && !isLogin) {
            let passwordValidationMessage = "";
            for (const rule of passwordRules) {
                if (!rule.regex.test(fields.password)) {
                    passwordValidationMessage = rule.message;
                    break;
                }
            }
            if (passwordValidationMessage) {
                newErrors.password = passwordValidationMessage;
            }

            if (fields.password !== fields.confirmPassword && !newErrors.password) { // Only check if password itself is valid
                newErrors.confirmPassword = "Passwords do not match.";
            }
        }
        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const newErrors = validate();
        setErrors(newErrors);

        if (Object.keys(newErrors).length === 0) {
            setSubmitError("");
            try {
                if (isLogin) {
                    
                    const res = await axios.post(`${BACKEND_URL}/user/login`, {
                        email: fields.email,
                        password: fields.password,
                    }, { withCredentials: true });

                    localStorage.setItem("accesstoken", res.data.data.accesstoken);
                    localStorage.setItem("refreshtoken", res.data.data.refreshtoken);

                    alert("Login successful!");
                    setFields({ email: "", username: "", password: "", confirmPassword: "" });

                    const redirectUrl = res.data.data.redirectUrl || "/dashboard";
                    navigate(redirectUrl);
                } else {
                    
                    const res = await axios.post(`${BACKEND_URL}/user/signup`, {
                        email: fields.email,
                        name: fields.username,
                        password: fields.password,
                    });
                    alert("Signup successful! Please log in.");
                    setFields({ email: "", username: "", password: "", confirmPassword: "" });
                    setIsLogin(true); // Switch to login form after successful signup
                }
            } catch (err) {
                if (err.response && err.response.data && err.response.data.message) {
                    setSubmitError(err.response.data.message);
                } else {
                    setSubmitError("Network error. Please try again.");
                }
            } finally {
                setIsSubmitting(false);
            }
        } else {
            setSubmitError("Please fix the errors above.");
            setIsSubmitting(false);
        }
    };

    const toggleForm = () => {
        setIsLogin((prev) => !prev);
        setFields({ email: "", username: "", password: "", confirmPassword: "" });
        setErrors({});
        setSubmitError("");
    };

    return (
        <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col items-center justify-center min-h-screen p-4 sm:p-6 md:p-8 font-inter antialiased">
            <div className="relative bg-white/95 backdrop-blur-lg px-6 py-10 rounded-3xl shadow-2xl w-full max-w-md sm:max-w-lg md:max-w-xl transition-all duration-500 mx-auto transform hover:scale-[1.005] animate-fade-in">
                <div className="relative flex flex-col justify-start">
                    {/* Common Header */}
                    <div className="text-center mb-8">
                        <h2 className="text-4xl font-extrabold text-gray-900 leading-tight">
                            {isLogin ? "Welcome Back!" : "Join Us Today!"}
                        </h2>
                        <p className="text-md text-gray-600 mt-2">
                            {isLogin
                                ? "Log in to your account to continue."
                                : "Create your account to get started."}
                        </p>
                    </div>

                    {/* Login Form */}
                    <div
                        className={`absolute inset-0 w-full transition-all duration-500 ease-in-out px-6 py-10 rounded-3xl
                            ${isLogin ? "opacity-100 translate-x-0 z-20 relative" : "opacity-0 -translate-x-10 pointer-events-none absolute"}`}
                    >
                        <form className="space-y-6" onSubmit={handleSubmit} noValidate>
                            <div>
                                <label className="block text-sm font-semibold mb-2 text-gray-700" htmlFor="email">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    value={fields.email}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                                    placeholder="Enter your email"
                                    autoComplete="email"
                                    required
                                />
                                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                            </div>
                            <div className="relative">
                                <label className="block text-sm font-semibold mb-2 text-gray-700" htmlFor="password">
                                    Password
                                </label>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    value={fields.password}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                                    placeholder="Enter your password"
                                    autoComplete="current-password"
                                    required
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    tabIndex={-1}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                                </button>
                                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                            </div>
                            <button
                                type="submit"
                                className="w-full py-3 rounded-lg font-bold text-lg text-white shadow-lg transition-all duration-300 mt-2 bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="animate-spin mr-2" size={20} /> Loading...
                                    </>
                                ) : "Login"}
                            </button>
                            {submitError && <p className="text-red-500 text-center text-sm mt-2">{submitError}</p>}
                            <div className="text-center w-full flex flex-col items-center pt-4 border-t border-gray-100">
                                <span className="text-base font-medium text-gray-700">
                                    Don't have an account?
                                </span>
                                <button
                                    type="button"
                                    className="mt-3 px-6 py-2 rounded-full font-semibold text-base transition-colors duration-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 shadow-sm"
                                    onClick={toggleForm}
                                >
                                    Sign up
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Signup Form */}
                    <div
                        className={`absolute inset-0 w-full transition-all duration-500 ease-in-out px-6 py-10 rounded-3xl
                            ${!isLogin ? "opacity-100 translate-x-0 z-20 relative" : "opacity-0 translate-x-10 pointer-events-none absolute"}`}
                    >
                        <form className="space-y-6" onSubmit={handleSubmit} noValidate>
                            <div>
                                <label className="block text-sm font-semibold mb-2 text-gray-700" htmlFor="email">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    value={fields.email}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                                    placeholder="Enter your email"
                                    autoComplete="email"
                                    required
                                />
                                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-2 text-gray-700" htmlFor="username">
                                    Username
                                </label>
                                <input
                                    type="text"
                                    id="username"
                                    value={fields.username}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                                    placeholder="Choose a username"
                                    autoComplete="username"
                                    required
                                />
                                {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username}</p>}
                            </div>
                            <div className="relative">
                                <label className="block text-sm font-semibold mb-2 text-gray-700" htmlFor="password">
                                    Password
                                </label>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    value={fields.password}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                                    placeholder="Enter your password"
                                    autoComplete="new-password"
                                    required
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    tabIndex={-1}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                                </button>
                                {errors.password && (
                                    <ul className="text-red-500 text-xs mt-1 list-disc list-inside space-y-0.5">
                                        {passwordRules.map((rule, index) => (
                                            <li key={index} className={rule.regex.test(fields.password) ? "text-green-600" : "text-red-500"}>
                                                {rule.message}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            <div className="relative">
                                <label className="block text-sm font-semibold mb-2 text-gray-700" htmlFor="confirmPassword">
                                    Confirm Password
                                </label>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="confirmPassword"
                                    value={fields.confirmPassword}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                                    placeholder="Confirm your password"
                                    autoComplete="new-password"
                                    required
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    tabIndex={-1}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                                </button>
                                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
                            </div>
                            <button
                                type="submit"
                                className="w-full py-3 rounded-lg font-bold text-lg text-white shadow-lg transition-all duration-300 mt-2 bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="animate-spin mr-2" size={20} /> Creating Account...
                                    </>
                                ) : "Signup"}
                            </button>
                            {submitError && <p className="text-red-500 text-center text-sm mt-2">{submitError}</p>}
                            <div className="text-center w-full flex flex-col items-center pt-4 border-t border-gray-100">
                                <span className="text-base font-medium text-gray-700">
                                    Already have an account?
                                </span>
                                <button
                                    type="button"
                                    className="mt-3 px-6 py-2 rounded-full font-semibold text-base transition-colors duration-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 shadow-sm"
                                    onClick={toggleForm}
                                >
                                    Login
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* Custom Styles */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

                .font-inter {
                    font-family: 'Inter', sans-serif;
                }

                .animate-fade-in {
                    animation: fadeIn 0.8s ease-out forwards;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                /* Custom scrollbar for better appearance */
                .scrollbar-hide {
                    -ms-overflow-style: none;  /* IE and Edge */
                    scrollbar-width: none;  /* Firefox */
                }
                .scrollbar-hide::-webkit-scrollbar {
                    display: none; /* Chrome, Safari, Opera*/
                }
            `}</style>
        </div>
    );
};

export default Login;