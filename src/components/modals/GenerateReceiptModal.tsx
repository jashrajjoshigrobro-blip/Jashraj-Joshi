import React, { useState } from 'react';
import Modal from '../Modal';
import { useFlats } from '../../context/FlatsContext';
import { PendingDue } from '../../types';

interface GenerateReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  flatId: string;
  due: PendingDue | null;
}

export default function GenerateReceiptModal({ isOpen, onClose, flatId, due }: GenerateReceiptModalProps) {
  const { generateReceipt } = useFlats();
  const [formData, setFormData] = useState({
    mode: 'UPI',
    referenceId: '',
  });

  if (!due) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generateReceipt(flatId, due.id, formData.mode, formData.referenceId);
    onClose();
    setFormData({ mode: 'UPI', referenceId: '' });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Generate Receipt">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-4">
          <p className="text-sm text-gray-500">Charge Title</p>
          <p className="font-medium text-gray-900">{due.title}</p>
          <div className="flex justify-between mt-2">
            <div>
              <p className="text-sm text-gray-500">Amount Due</p>
              <p className="font-bold text-gray-900">₹{due.amount.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Due Date</p>
              <p className="font-medium text-gray-900">{new Date(due.dueDate).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode *</label>
            <select className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500" value={formData.mode} onChange={e => setFormData({...formData, mode: e.target.value})}>
              <option value="UPI">UPI</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cash">Cash</option>
              <option value="Cheque">Cheque</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reference ID</label>
            <input type="text" placeholder="Txn ID / Cheque No" className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500" value={formData.referenceId} onChange={e => setFormData({...formData, referenceId: e.target.value})} />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors">Cancel</button>
          <button type="submit" className="px-4 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-colors">Confirm Payment</button>
        </div>
      </form>
    </Modal>
  );
}
