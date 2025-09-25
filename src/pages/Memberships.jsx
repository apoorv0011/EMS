import React from 'react';
import PageHeader from '../components/UI/PageHeader';

const Memberships = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader title="Memberships" subtitle="Unlock exclusive benefits" />
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold">Membership plans are not yet implemented.</h2>
        <p className="text-gray-600 mt-2">This feature is coming soon!</p>
      </div>
    </div>
  );
};

export default Memberships;
