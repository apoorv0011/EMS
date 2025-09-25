import React from 'react';
import { motion } from 'framer-motion';

const PageHeader = ({ title, subtitle, children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white shadow-md rounded-lg p-6 mb-8"
    >
      <div className="flex flex-col md:flex-row justify-between md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="mt-1 text-md text-gray-600">{subtitle}</p>}
        </div>
        {children && <div className="mt-4 md:mt-0">{children}</div>}
      </div>
    </motion.div>
  );
};

export default PageHeader;
