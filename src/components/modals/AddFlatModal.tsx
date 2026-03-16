import React, { useState } from 'react';
import Modal from '../Modal';
import { useFlats } from '../../context/FlatsContext';
import { OccupancyStatus } from '../../types';

interface AddFlatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddFlatModal({ isOpen, onClose }: AddFlatModalProps) {
  const { addFlat } = useFlats();
  const [formData, setFormData] = useState({
    flatNumber: '',
    block: '',
    floor: '',
    area: '',
    ownerName: '',
    ownerPhone: '',
    ownerEmail: '',
    occupancyStatus: 'Owner Occupied' as OccupancyStatus,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await addFlat({
        ...formData,
        area: Number(formData.area) || 0,
      });
      onClose();
    } catch (err: any) {
      console.error('Error adding flat:', err);
      setError(err.message || 'Failed to add flat. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Flat">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Flat Number *</label>
            <input required type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500" value={formData.flatNumber} onChange={e => setFormData({...formData, flatNumber: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Block / Tower</label>
            <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500" value={formData.block} onChange={e => setFormData({...formData, block: e.target.value})} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Floor</label>
            <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500" value={formData.floor} onChange={e => setFormData({...formData, floor: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Area (sq.ft)</label>
            <input type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500" value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} />
          </div>
        </div>
        
        <div className="border-t border-gray-200 pt-4 mt-4">
          <h4 className="font-semibold text-gray-900 mb-3">Owner Details</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name *</label>
              <input required type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500" value={formData.ownerName} onChange={e => setFormData({...formData, ownerName: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Owner Phone *</label>
                <input required type="tel" pattern="[0-9]{10}" title="10-digit phone number" className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500" value={formData.ownerPhone} onChange={e => setFormData({...formData, ownerPhone: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Owner Email *</label>
                <input required type="email" className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500" value={formData.ownerEmail} onChange={e => setFormData({...formData, ownerEmail: e.target.value})} />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4 mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Occupancy Status *</label>
          <select className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500" value={formData.occupancyStatus} onChange={e => setFormData({...formData, occupancyStatus: e.target.value as OccupancyStatus})}>
            <option value="Owner Occupied">Owner Occupied</option>
            <option value="Tenant Occupied">Tenant Occupied</option>
            <option value="Vacant">Vacant</option>
          </select>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button type="button" onClick={onClose} disabled={isSubmitting} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50">Cancel</button>
          <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-colors disabled:opacity-50">
            {isSubmitting ? 'Adding...' : 'Add Flat'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
