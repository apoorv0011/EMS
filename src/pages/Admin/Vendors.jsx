import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { db } from '../../lib/supabase';
import PageHeader from '../../components/UI/PageHeader';
import Spinner from '../../components/UI/Spinner';
import { Store } from 'lucide-react';

const ApprovalToggle = ({ vendor, onToggle }) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggle = async () => {
    setIsUpdating(true);
    await onToggle(vendor.vendor_id, !vendor.is_approved);
    setIsUpdating(false);
  };

  const toggleClasses = vendor.is_approved ? 'bg-blue-600' : 'bg-gray-200';
  const knobClasses = vendor.is_approved ? 'translate-x-5' : 'translate-x-0';

  return (
    <button
      onClick={handleToggle}
      disabled={isUpdating}
      className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${toggleClasses}`}
    >
      <span
        className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${knobClasses}`}
      />
    </button>
  );
};

const AdminVendors = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await db.adminGetAllVendors();
      if (error) throw error;
      setVendors(data || []);
    } catch (error) {
      toast.error('Failed to fetch vendors.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const handleApprovalToggle = async (vendorId, isApproved) => {
    try {
      const { error } = await db.adminUpdateVendorApproval(vendorId, isApproved);
      if (error) throw error;
      toast.success(`Vendor status updated successfully!`);
      // Update local state for immediate feedback
      setVendors(prevVendors =>
        prevVendors.map(v =>
          v.vendor_id === vendorId ? { ...v, is_approved: isApproved } : v
        )
      );
    } catch (error) {
      toast.error('Failed to update vendor status.');
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spinner />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Vendor Management" subtitle={`Found ${vendors.length} registered vendors`} />
      <div className="bg-white p-6 rounded-lg shadow-md">
        {vendors.length === 0 ? (
          <div className="text-center py-12">
            <Store className="w-16 h-16 mx-auto text-gray-400" />
            <h3 className="text-xl font-semibold mt-4">No vendors found.</h3>
            <p className="text-gray-500 mt-2">When users sign up as vendors, they will appear here for approval.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Business Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registered</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Approve</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vendors.map((vendor) => (
                  <tr key={vendor.vendor_id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{vendor.business_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>{vendor.full_name}</div>
                      <div>{vendor.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{format(new Date(vendor.vendor_created_at), 'PP')}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${vendor.is_approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {vendor.is_approved ? 'Approved' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <ApprovalToggle vendor={vendor} onToggle={handleApprovalToggle} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminVendors;
