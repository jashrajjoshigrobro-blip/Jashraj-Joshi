import React, { useState } from 'react';
import Modal from '../Modal';
import { useFlats } from '../../context/FlatsContext';
import { Flat } from '../../types';
import { AlertTriangle } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  flat: Flat;
  onConfirm: () => Promise<void>;
}

export default function DeleteConfirmationModal({ isOpen, onClose, flat, onConfirm }: DeleteConfirmationModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasFinancialRecords = flat.payments.length > 0 || flat.pendingDues.length > 0;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm();
    } catch (error) {
      console.error('Error deleting flat:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Flat">
      <div className="space-y-4">
        {hasFinancialRecords ? (
          <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-start gap-3">
            <AlertTriangle className="text-red-500 shrink-0" size={20} />
            <div>
              <h4 className="text-red-800 font-semibold">Cannot Delete Flat</h4>
              <p className="text-red-700 text-sm mt-1">
                This flat has existing financial records (payments or pending dues). Deletion is not allowed to maintain financial integrity.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
            <AlertTriangle className="text-amber-500 shrink-0" size={20} />
            <div>
              <h4 className="text-amber-800 font-semibold">Confirm Deletion</h4>
              <p className="text-amber-700 text-sm mt-1">
                Are you sure you want to delete Flat {flat.flatNumber}? This action cannot be undone.
              </p>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <button onClick={onClose} disabled={isSubmitting} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50">
            {hasFinancialRecords ? 'Close' : 'Cancel'}
          </button>
          {!hasFinancialRecords && (
            <button onClick={handleConfirm} disabled={isSubmitting} className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors disabled:opacity-50">
              {isSubmitting ? 'Deleting...' : 'Delete Flat'}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
