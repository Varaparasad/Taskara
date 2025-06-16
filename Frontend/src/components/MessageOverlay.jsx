import React, { useEffect } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

const MessageOverlay = ({ message, type, onClose, duration = 3000 }) => {
  // Automatically close the message after a set duration
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  let bgColor, textColor, icon;
  switch (type) {
    case 'success':
      bgColor = 'bg-green-100 border-green-400';
      textColor = 'text-green-700';
      icon = <CheckCircle className="w-6 h-6" />;
      break;
    case 'error':
      bgColor = 'bg-red-100 border-red-400';
      textColor = 'text-red-700';
      icon = <XCircle className="w-6 h-6" />;
      break;
    case 'info':
    default:
      bgColor = 'bg-blue-100 border-blue-400';
      textColor = 'text-blue-700';
      icon = <Info className="w-6 h-6" />;
      break;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fadeIn">
      <div className={`relative ${bgColor} border ${textColor} px-6 py-4 rounded-lg shadow-xl animate-scaleIn flex items-center gap-4 w-full max-w-sm sm:max-w-md`}>
        {icon}
        <span className="block sm:inline text-sm sm:text-base font-medium flex-grow">{message}</span>
        <button
          onClick={onClose}
          className={`absolute top-2 right-2 p-1 rounded-full ${textColor} hover:bg-opacity-80 transition-colors duration-200`}
          title="Close message"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default MessageOverlay;
