// Modal.jsx
import React from 'react';

const Modal = ({ message, onDismiss }) => {
  return (
    <div
      onClick={onDismiss}
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 cursor-pointer"
    >
      <div className="bg-white rounded-lg shadow-xl p-8">
        <h1 className="text-5xl font-extrabold text-gray-800">{message}</h1>
        <p className="mt-4 text-lg text-gray-600">Click anywhere to dismiss</p>
      </div>
    </div>
  );
};

export default Modal;
