import React, { useState } from 'react';
import Modal from '../Modal';
import { useParking } from '../../context/ParkingContext';

interface AssignParkingModalProps {
  isOpen: boolean;
  onClose: () => void;
  flatId: string;
}

export default function AssignParkingModal({ isOpen, onClose, flatId }: AssignParkingModalProps) {
  const { parkingSlots, assignSlotToFlat } = useParking();
  const [selectedSlotId, setSelectedSlotId] = useState('');

  const availableSlots = parkingSlots.filter(s => s.status === 'Available');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSlotId) {
      assignSlotToFlat(selectedSlotId, flatId);
      onClose();
      setSelectedSlotId('');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assign Parking Slot">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Available Slot *</label>
          <select 
            required 
            className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500" 
            value={selectedSlotId} 
            onChange={e => setSelectedSlotId(e.target.value)}
          >
            <option value="">-- Select a slot --</option>
            {availableSlots.map(slot => (
              <option key={slot.id} value={slot.id}>
                {slot.slotNumber} ({slot.zone} - Lvl {slot.level}) - {slot.slotType}
              </option>
            ))}
          </select>
          {availableSlots.length === 0 && (
            <p className="text-sm text-amber-600 mt-2">No available parking slots. Please add slots in the Parking Directory first.</p>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors">Cancel</button>
          <button type="submit" disabled={!selectedSlotId} className="px-4 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-colors disabled:opacity-50">Assign Slot</button>
        </div>
      </form>
    </Modal>
  );
}
