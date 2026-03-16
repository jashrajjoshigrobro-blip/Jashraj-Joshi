import React, { useState, useMemo } from 'react';
import { useParking } from '../context/ParkingContext';
import { useFlats } from '../context/FlatsContext';
import { ParkingSlot, ParkingSlotType, ParkingAllocationStatus } from '../types';
import { Plus, Search, Edit3, Trash2, Link, Unlink, Car, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { format, parseISO } from 'date-fns';
import Modal from '../components/Modal';

export default function ParkingManagement() {
  const { parkingSlots, isLoading, addParkingSlot, updateParkingSlot, assignSlotToFlat, reassignSlot, removeAllocation } = useParking();
  const { flats } = useFlats();

  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<ParkingSlot | null>(null);

  const filteredSlots = useMemo(() => {
    return parkingSlots.filter(slot => {
      const searchLower = searchQuery.toLowerCase();
      const flat = flats.find(f => f.id === slot.allocatedToFlatId);
      const occupantName = flat?.occupancyStatus === 'Tenant Occupied' ? flat.tenant?.name : flat?.ownerName;
      
      return (
        slot.slotNumber.toLowerCase().includes(searchLower) ||
        slot.zone.toLowerCase().includes(searchLower) ||
        (flat?.flatNumber || '').toLowerCase().includes(searchLower) ||
        (occupantName || '').toLowerCase().includes(searchLower)
      );
    });
  }, [parkingSlots, searchQuery, flats]);

  const getFlatDetails = (flatId?: string) => {
    if (!flatId) return null;
    const flat = flats.find(f => f.id === flatId);
    if (!flat) return null;
    const occupantName = flat.occupancyStatus === 'Tenant Occupied' ? flat.tenant?.name : flat.ownerName;
    return { flatNumber: flat.flatNumber, occupantName };
  };

  const openEditModal = (slot: ParkingSlot) => {
    setSelectedSlot(slot);
    setIsEditModalOpen(true);
  };

  const openAssignModal = (slot: ParkingSlot) => {
    setSelectedSlot(slot);
    setIsAssignModalOpen(true);
  };

  const openReassignModal = (slot: ParkingSlot) => {
    setSelectedSlot(slot);
    setIsReassignModalOpen(true);
  };

  const handleRemoveAllocation = async (slotId: string) => {
    if (window.confirm('Are you sure you want to remove the allocation for this slot?')) {
      await removeAllocation(slotId);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Parking Directory</h2>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm"
        >
          <Plus size={20} />
          Add Parking Slot
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by slot, zone, flat, or occupant..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 font-medium">Sr No</th>
                <th className="px-6 py-3 font-medium">Zone / Area</th>
                <th className="px-6 py-3 font-medium">Level</th>
                <th className="px-6 py-3 font-medium">Slot Number</th>
                <th className="px-6 py-3 font-medium">Type</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Allocated To</th>
                <th className="px-6 py-3 font-medium">Assigned Date</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                    <div className="flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                    </div>
                  </td>
                </tr>
              ) : filteredSlots.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                    No parking slots found.
                  </td>
                </tr>
              ) : (
                filteredSlots.map((slot, index) => {
                  const flatDetails = getFlatDetails(slot.allocatedToFlatId);
                  return (
                    <tr key={slot.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-gray-500">{index + 1}</td>
                      <td className="px-6 py-4 text-gray-900 font-medium">{slot.zone}</td>
                      <td className="px-6 py-4 text-gray-700">{slot.level}</td>
                      <td className="px-6 py-4 text-gray-900 font-bold">{slot.slotNumber}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                          <Car size={14} />
                          {slot.slotType}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={clsx(
                          "px-2.5 py-1 rounded-md text-xs font-medium",
                          slot.status === 'Available' && "bg-emerald-100 text-emerald-800",
                          slot.status === 'Allocated' && "bg-blue-100 text-blue-800",
                          slot.status === 'Reserved' && "bg-purple-100 text-purple-800",
                          slot.status === 'Under Maintenance' && "bg-amber-100 text-amber-800"
                        )}>
                          {slot.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {flatDetails ? (
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900">{flatDetails.flatNumber}</span>
                            <span className="text-xs text-gray-500">{flatDetails.occupantName}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {slot.assignedDate ? format(parseISO(slot.assignedDate), 'dd-MMM-yyyy') : '—'}
                      </td>
                      <td className="px-6 py-4 text-right space-x-3">
                        <button
                          onClick={() => openEditModal(slot)}
                          className="text-gray-400 hover:text-indigo-600 transition-colors"
                          title="Edit Slot"
                        >
                          <Edit3 size={18} />
                        </button>
                        
                        {slot.status === 'Available' ? (
                          <button
                            onClick={() => openAssignModal(slot)}
                            className="text-gray-400 hover:text-emerald-600 transition-colors"
                            title="Assign to Flat"
                          >
                            <Link size={18} />
                          </button>
                        ) : slot.status === 'Allocated' ? (
                          <>
                            <button
                              onClick={() => openReassignModal(slot)}
                              className="text-gray-400 hover:text-blue-600 transition-colors"
                              title="Reassign Slot"
                            >
                              <Link size={18} />
                            </button>
                            <button
                              onClick={() => handleRemoveAllocation(slot.id)}
                              className="text-gray-400 hover:text-red-600 transition-colors"
                              title="Remove Allocation"
                            >
                              <Unlink size={18} />
                            </button>
                          </>
                        ) : null}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {isAddModalOpen && (
        <AddEditSlotModal
          onClose={() => setIsAddModalOpen(false)}
          onSave={async (data) => {
            await addParkingSlot(data);
            setIsAddModalOpen(false);
          }}
        />
      )}

      {isEditModalOpen && selectedSlot && (
        <AddEditSlotModal
          slot={selectedSlot}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedSlot(null);
          }}
          onSave={async (data) => {
            await updateParkingSlot(selectedSlot.id, data);
            setIsEditModalOpen(false);
            setSelectedSlot(null);
          }}
        />
      )}

      {isAssignModalOpen && selectedSlot && (
        <AssignReassignModal
          title="Assign Slot to Flat"
          slot={selectedSlot}
          flats={flats}
          onClose={() => {
            setIsAssignModalOpen(false);
            setSelectedSlot(null);
          }}
          onSave={async (flatId) => {
            await assignSlotToFlat(selectedSlot.id, flatId);
            setIsAssignModalOpen(false);
            setSelectedSlot(null);
          }}
        />
      )}

      {isReassignModalOpen && selectedSlot && (
        <AssignReassignModal
          title="Reassign Slot"
          slot={selectedSlot}
          flats={flats}
          onClose={() => {
            setIsReassignModalOpen(false);
            setSelectedSlot(null);
          }}
          onSave={async (flatId) => {
            await reassignSlot(selectedSlot.id, flatId);
            setIsReassignModalOpen(false);
            setSelectedSlot(null);
          }}
        />
      )}
    </div>
  );
}

function AddEditSlotModal({ slot, onClose, onSave }: { slot?: ParkingSlot, onClose: () => void, onSave: (data: any) => void }) {
  const [formData, setFormData] = useState({
    zone: slot?.zone || '',
    level: slot?.level || '',
    slotNumber: slot?.slotNumber || '',
    slotType: slot?.slotType || 'Car',
    status: slot?.status || 'Available',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={slot ? 'Edit Parking Slot' : 'Add Parking Slot'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Zone / Area Name *</label>
          <input required type="text" placeholder="e.g., Basement A" className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500" value={formData.zone} onChange={e => setFormData({...formData, zone: e.target.value})} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Level / Floor *</label>
            <input required type="text" placeholder="e.g., -1" className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500" value={formData.level} onChange={e => setFormData({...formData, level: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slot Number *</label>
            <input required type="text" placeholder="e.g., A12" className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500" value={formData.slotNumber} onChange={e => setFormData({...formData, slotNumber: e.target.value})} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slot Type *</label>
            <select required className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500" value={formData.slotType} onChange={e => setFormData({...formData, slotType: e.target.value as any})}>
              <option value="Car">Car</option>
              <option value="Bike">Bike</option>
              <option value="EV">EV</option>
              <option value="Visitor">Visitor</option>
            </select>
          </div>
          {slot && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
              <select required className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}>
                <option value="Available">Available</option>
                <option value="Allocated">Allocated</option>
                <option value="Reserved">Reserved</option>
                <option value="Under Maintenance">Under Maintenance</option>
              </select>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors">Cancel</button>
          <button type="submit" className="px-4 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-colors">{slot ? 'Save Changes' : 'Add Slot'}</button>
        </div>
      </form>
    </Modal>
  );
}

function AssignReassignModal({ title, slot, flats, onClose, onSave }: { title: string, slot: ParkingSlot, flats: any[], onClose: () => void, onSave: (flatId: string) => void }) {
  const [selectedFlatId, setSelectedFlatId] = useState(slot.allocatedToFlatId || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFlatId) {
      onSave(selectedFlatId);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Flat *</label>
          <select 
            required 
            className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500" 
            value={selectedFlatId} 
            onChange={e => setSelectedFlatId(e.target.value)}
          >
            <option value="">-- Select a flat --</option>
            {flats.map(flat => {
              const occupantName = flat.occupancyStatus === 'Tenant Occupied' ? flat.tenant?.name : flat.ownerName;
              return (
                <option key={flat.id} value={flat.id}>
                  {flat.flatNumber} - {occupantName || 'Vacant'}
                </option>
              );
            })}
          </select>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors">Cancel</button>
          <button type="submit" disabled={!selectedFlatId || selectedFlatId === slot.allocatedToFlatId} className="px-4 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-colors disabled:opacity-50">Save</button>
        </div>
      </form>
    </Modal>
  );
}
