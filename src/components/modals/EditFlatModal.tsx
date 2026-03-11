import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import { useFlats } from '../../context/FlatsContext';
import { Flat, OccupancyStatus } from '../../types';

interface EditFlatModalProps {
  isOpen: boolean;
  onClose: () => void;
  flat: Flat;
}

export default function EditFlatModal({ isOpen, onClose, flat }: EditFlatModalProps) {
  const { updateFlat } = useFlats();
  const [formData, setFormData] = useState({
    block: flat.block,
    floor: flat.floor,
    area: flat.area.toString(),
    occupancyStatus: flat.occupancyStatus,
    tenantName: flat.tenant?.name || '',
    tenantPhone: flat.tenant?.phone || '',
    tenantMoveIn: flat.tenant?.moveInDate || new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        block: flat.block,
        floor: flat.floor,
        area: flat.area.toString(),
        occupancyStatus: flat.occupancyStatus,
        tenantName: flat.tenant?.name || '',
        tenantPhone: flat.tenant?.phone || '',
        tenantMoveIn: flat.tenant?.moveInDate || new Date().toISOString().split('T')[0],
      });
    }
  }, [isOpen, flat]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updates: Partial<Flat> = {
      block: formData.block,
      floor: formData.floor,
      area: Number(formData.area) || 0,
      occupancyStatus: formData.occupancyStatus,
    };

    if (formData.occupancyStatus === 'Tenant Occupied') {
      updates.tenant = {
        name: formData.tenantName,
        phone: formData.tenantPhone,
        moveInDate: formData.tenantMoveIn,
      };
    } else {
      updates.tenant = undefined;
    }

    // Handle occupancy history logic
    if (formData.occupancyStatus !== flat.occupancyStatus) {
      const now = new Date().toISOString();
      const newHistory = [...flat.occupancyHistory];
      
      // Close current occupant
      const currentOccupantIndex = newHistory.findIndex(h => !h.endDate);
      if (currentOccupantIndex !== -1) {
        newHistory[currentOccupantIndex] = {
          ...newHistory[currentOccupantIndex],
          endDate: now
        };
      }

      // Add new occupant if not vacant
      if (formData.occupancyStatus === 'Owner Occupied') {
        newHistory.push({
          id: Math.random().toString(36).substr(2, 9),
          type: 'Owner',
          name: flat.ownerName,
          startDate: now,
        });
      } else if (formData.occupancyStatus === 'Tenant Occupied') {
        newHistory.push({
          id: Math.random().toString(36).substr(2, 9),
          type: 'Tenant',
          name: formData.tenantName,
          startDate: formData.tenantMoveIn,
        });
      }
      updates.occupancyHistory = newHistory;
    }

    updateFlat(flat.id, updates);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit Flat ${flat.flatNumber}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Block / Tower</label>
            <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500" value={formData.block} onChange={e => setFormData({...formData, block: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Floor</label>
            <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500" value={formData.floor} onChange={e => setFormData({...formData, floor: e.target.value})} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Area (sq.ft)</label>
          <input type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500" value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} />
        </div>

        <div className="border-t border-gray-200 pt-4 mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Occupancy Status *</label>
          <select className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500" value={formData.occupancyStatus} onChange={e => setFormData({...formData, occupancyStatus: e.target.value as OccupancyStatus})}>
            <option value="Owner Occupied">Owner Occupied</option>
            <option value="Tenant Occupied">Tenant Occupied</option>
            <option value="Vacant">Vacant</option>
          </select>
        </div>

        {formData.occupancyStatus === 'Tenant Occupied' && (
          <div className="space-y-3 bg-blue-50 p-4 rounded-xl border border-blue-100">
            <h4 className="font-semibold text-blue-900">Tenant Details</h4>
            <div>
              <label className="block text-sm font-medium text-blue-800 mb-1">Tenant Name *</label>
              <input required type="text" className="w-full border border-blue-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500" value={formData.tenantName} onChange={e => setFormData({...formData, tenantName: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-blue-800 mb-1">Tenant Phone *</label>
                <input required type="tel" pattern="[0-9]{10}" title="10-digit phone number" className="w-full border border-blue-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500" value={formData.tenantPhone} onChange={e => setFormData({...formData, tenantPhone: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-800 mb-1">Move-in Date *</label>
                <input required type="date" className="w-full border border-blue-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500" value={formData.tenantMoveIn.split('T')[0]} onChange={e => setFormData({...formData, tenantMoveIn: e.target.value})} />
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors">Cancel</button>
          <button type="submit" className="px-4 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-colors">Save Changes</button>
        </div>
      </form>
    </Modal>
  );
}
