import React, { useState } from 'react';

const EventForm = ({ event, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: event?.name || '',
    description: event?.description || '',
    date: event?.date ? new Date(event.date).toISOString().split('T')[0] : '',
    price: event?.price || ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-8 w-full max-w-lg shadow-2xl">
        <h2 className="text-2xl font-bold mb-6">{event ? 'Edit Event' : 'Add New Event'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Event Name</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea name="description" value={formData.description} onChange={handleChange} rows="3" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"></textarea>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Date</label>
            <input type="date" name="date" value={formData.date} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Price</label>
            <input type="number" name="price" value={formData.price} onChange={handleChange} step="0.01" min="0" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" required />
          </div>
          <div className="flex justify-end space-x-4 pt-4">
            <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Save Event</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventForm;
