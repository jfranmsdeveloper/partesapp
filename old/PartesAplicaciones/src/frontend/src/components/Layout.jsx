import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Calendar, BarChart2, LogOut } from 'lucide-react';

const Layout = () => {
    const { logout, user } = useAuth();
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <div className="w-64 bg-white shadow-lg flex flex-col">
                <div className="p-6 border-b border-gray-200">
                    <h1 className="text-2xl font-bold text-primary">Partes App</h1>
                    <p className="text-sm text-gray-500 mt-1">Welcome, {user?.username}</p>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <Link
                        to="/"
                        className={`flex items-center px-4 py-3 rounded-lg transition-colors ${isActive('/')
                                ? 'bg-primary/10 text-primary font-semibold'
                                : 'text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        <Calendar className="w-5 h-5 mr-3" />
                        Calendar
                    </Link>

                    <Link
                        to="/dashboard"
                        className={`flex items-center px-4 py-3 rounded-lg transition-colors ${isActive('/dashboard')
                                ? 'bg-primary/10 text-primary font-semibold'
                                : 'text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        <BarChart2 className="w-5 h-5 mr-3" />
                        Dashboard
                    </Link>
                </nav>

                <div className="p-4 border-t border-gray-200">
                    <button
                        onClick={logout}
                        className="flex items-center w-full px-4 py-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <LogOut className="w-5 h-5 mr-3" />
                        Logout
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto">
                <Outlet />
            </div>
        </div>
    );
};

export default Layout;
