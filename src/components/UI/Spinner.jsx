import React from 'react';

const Spinner = ({ size = 'h-12 w-12', color = 'border-blue-600' }) => {
  return (
    <div className={`animate-spin rounded-full border-b-2 ${size} ${color}`}></div>
  );
};

export default Spinner;
