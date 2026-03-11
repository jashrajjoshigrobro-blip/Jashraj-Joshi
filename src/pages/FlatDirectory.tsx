import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Eye, Plus } from 'lucide-react';
import { useFlats } from '../context/FlatsContext';
import { useParking } from '../context/ParkingContext';
import { Flat, OccupancyStatus } from '../types';
import clsx from 'clsx';
import AddFlatModal from '../components/modals/AddFlatModal';

export default function FlatDirectory() {
  const navigate = useNavigate();
  const { flats } = useFlats();
  const { parkingSlots } = useParking();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OccupancyStatus | 'All'>('All');
  const [blockFilter, setBlockFilter] = useState<string>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const filteredFlats = flats.filter((flat) => {
    const matchesSearch = flat.flatNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || flat.occupancyStatus === statusFilter;
    const matchesBlock = blockFilter === 'All' || flat.block === blockFilter;
    return matchesSearch && matchesStatus && matchesBlock;
  });

  const getStatusBadge = (status: OccupancyStatus) => {
    switch (status) {
      case 'Owner Occupied':
        return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">Owner Occupied</span>;
      case 'Tenant Occupied':
        return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Tenant Occupied</span>;
      case 'Vacant':
        return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Vacant</span>;
    }
  };

  const calculateOutstanding = (flat: Flat) => {
    return flat.pendingDues.reduce((sum, due) => sum + due.amount, 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Flat Directory</h2>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium"
        >
          <Plus size={18} />
          Add New Flat
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by Flat Number..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-500" />
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
            >
              <option value="All">All Statuses</option>
              <option value="Owner Occupied">Owner Occupied</option>
              <option value="Tenant Occupied">Tenant Occupied</option>
              <option value="Vacant">Vacant</option>
            </select>
          </div>
          <select
            className="border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
            value={blockFilter}
            onChange={(e) => setBlockFilter(e.target.value)}
          >
            <option value="All">All Blocks</option>
            <option value="A">Block A</option>
            <option value="B">Block B</option>
            <option value="C">Block C</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                <th className="px-6 py-4">Sr No</th>
                <th className="px-6 py-4">Flat Number</th>
                <th className="px-6 py-4">Block / Tower</th>
                <th className="px-6 py-4">Floor</th>
                <th className="px-6 py-4">Occupancy Status</th>
                <th className="px-6 py-4">Current Occupant</th>
                <th className="px-6 py-4">Parking Slots</th>
                <th className="px-6 py-4">Outstanding Amount</th>
                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredFlats.map((flat, index) => {
                const outstanding = calculateOutstanding(flat);
                return (
                  <tr
                    key={flat.id}
                    className="hover:bg-gray-50 transition-colors group cursor-pointer"
                    onClick={() => navigate(`/flats/${flat.id}`)}
                  >
                    <td className="px-6 py-4 text-sm text-gray-500">{index + 1}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{flat.flatNumber}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{flat.block}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{flat.floor}</td>
                    <td className="px-6 py-4">{getStatusBadge(flat.occupancyStatus)}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {flat.occupancyStatus === 'Owner Occupied'
                        ? flat.ownerName
                        : flat.occupancyStatus === 'Tenant Occupied'
                        ? flat.tenant?.name
                        : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 text-center">
                      {parkingSlots.filter(s => s.allocatedToFlatId === flat.id).length}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <span className={clsx(outstanding > 0 ? 'text-red-600' : 'text-gray-500')}>
                        ₹{outstanding.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="View Details"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/flats/${flat.id}`);
                        }}
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredFlats.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                    No flats found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <AddFlatModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
    </div>
  );
}
