
import React from 'react';

const Input = ({ inputType, title, placeholder, handleClick }) => {
    return (
        <div className="w-full mb-4">
            <label className="text-gray-400 font-medium mb-2 block text-sm uppercase tracking-wide">{title}</label>
            <input
                type={inputType}
                className="w-full bg-paper border border-gray-700 text-text rounded-lg p-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-300 placeholder-gray-600"
                placeholder={placeholder}
                onChange={handleClick}
            />
        </div>
    );
};

export default Input;
