import React, { useState } from 'react';
import Modal from '../Modal';
import { useFlats } from '../../context/FlatsContext';
import { Flat } from '../../types';

interface TransferOwnershipModalProps {
  isOpen: boolean;
  onClose: () => void;
  flat: Flat;
}

export default function TransferOwnershipModal({ isOpen, onClose, flat }: TransferOwnershipModalProps) {
  const { transferOwnership } = useFlats();
  const [formData, setFormData] = useState({
    newOwnerName: '',
    newOwnerPhone: '',
    newOwnerEmail: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await transferOwnership(flat.id, formData.newOwnerName, formData.newOwnerPhone, formData.newOwnerEmail);
      onClose();
    } catch (error) {
      console.error('Error transferring ownership:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Transfer Ownership - Flat ${flat.flatNumber}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl mb-4">
          <p className="text-sm text-amber-800 font-medium">Current Owner: {flat.ownerName}</p>
          <p className="text-xs text-amber-700 mt-1">Transferring ownership will archive the current owner and record the transfer in history.</p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Owner Name *</label>
            <input required type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500" value={formData.newOwnerName} onChange={e => setFormData({...formData, newOwnerName: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Owner Phone *</label>
              <input required type="tel" pattern="[0-9]{10}" title="10-digit phone number" className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500" value={formData.newOwnerPhone} onChange={e => setFormData({...formData, newOwnerPhone: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Owner Email *</label>
              <input required type="email" className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500" value={formData.newOwnerEmail} onChange={e => setFormData({...formData, newOwnerEmail: e.target.value})} />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button type="button" onClick={onClose} disabled={isSubmitting} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50">Cancel</button>
          <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-colors disabled:opacity-50">
            {isSubmitting ? 'Transferring...' : 'Confirm Transfer'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
