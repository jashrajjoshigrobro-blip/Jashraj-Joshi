import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useFlats } from '../context/FlatsContext';
import { useParking } from '../context/ParkingContext';
import { useProfile } from '../context/ProfileContext';
import { Flat, OccupancyStatus, PendingDue, Payment } from '../types';
import { ArrowLeft, Edit3, Trash2, Repeat, FileText, Download, Plus, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';

import EditFlatModal from '../components/modals/EditFlatModal';
import TransferOwnershipModal from '../components/modals/TransferOwnershipModal';
import AssignParkingModal from '../components/modals/AssignParkingModal';
import GenerateReceiptModal from '../components/modals/GenerateReceiptModal';
import DeleteConfirmationModal from '../components/modals/DeleteConfirmationModal';

export default function FlatProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { flats, deleteFlat, isLoading: isFlatsLoading } = useFlats();
  const { parkingSlots, removeAllocation, isLoading: isParkingLoading } = useParking();
  const { societySettings, isLoading: isProfileLoading } = useProfile();
  const flat = flats.find((f) => f.id === id);
  const flatParkingSlots = parkingSlots.filter(s => s.allocatedToFlatId === id);

  const isLoading = isFlatsLoading || isParkingLoading || isProfileLoading;

  const [activeTab, setActiveTab] = useState<'received' | 'pending'>('received');

  useEffect(() => {
    if (location.state?.highlightPaymentId) {
      setActiveTab('received');
      setTimeout(() => {
        const element = document.getElementById(`payment-${location.state.highlightPaymentId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('bg-indigo-50', 'transition-colors', 'duration-1000');
          setTimeout(() => element.classList.remove('bg-indigo-50'), 3000);
        }
      }, 100);
    }
  }, [location.state]);

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isAssignParkingModalOpen, setIsAssignParkingModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [receiptDue, setReceiptDue] = useState<PendingDue | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!flat) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <p className="text-xl font-medium">Flat not found.</p>
        <button onClick={() => navigate('/flats')} className="mt-4 text-indigo-600 hover:underline flex items-center gap-2">
          <ArrowLeft size={16} /> Back to Directory
        </button>
      </div>
    );
  }

  const outstanding = flat.pendingDues.reduce((sum, due) => sum + due.amount, 0);

  const handleDeleteConfirm = async () => {
    if (flat) {
      await deleteFlat(flat.id);
      navigate('/flats');
    }
  };

  const handleDownloadPDF = async (payment: Payment) => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      
      const doc = new jsPDF();
      const societyName = societySettings?.name || "Society Name";
      const occupantName = flat.occupancyStatus === 'Tenant Occupied' && flat.tenant ? flat.tenant.name : flat.ownerName;
      const receiptDate = format(new Date(payment.date), 'dd/MM/yyyy');

      // Header
      doc.setFontSize(20);
      doc.text(societyName, 105, 20, { align: 'center' });
      doc.setFontSize(12);
      doc.text("Payment Receipt", 105, 30, { align: 'center' });

      doc.setFontSize(10);
      doc.text(`Receipt No: ${payment.receiptNumber}`, 14, 45);
      doc.text(`Date: ${receiptDate}`, 150, 45);
      doc.text(`Flat No: ${flat.flatNumber}`, 14, 52);

      // Table
      autoTable(doc, {
        startY: 60,
        head: [['Sr No', 'Title', 'Description', 'Amount']],
        body: [
          ['1', payment.title || 'Maintenance Charge', payment.description || 'Monthly maintenance', `Rs. ${payment.amount.toLocaleString()}`]
        ],
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229] }, // Indigo 600
      });

      // Footer
      const finalY = (doc as any).lastAutoTable.finalY || 60;
      doc.setFontSize(11);
      doc.text(`Final Total Amount Paid: Rs. ${payment.amount.toLocaleString()}`, 14, finalY + 15);
      doc.text(`Received From: ${occupantName}`, 14, finalY + 25);

      doc.text("Authorized Signature", 150, finalY + 45);
      doc.line(140, finalY + 40, 190, finalY + 40);

      doc.save(`${payment.receiptNumber}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Could not generate PDF.');
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/flats')}
            className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
              Flat {flat.flatNumber}
              <span className={clsx(
                'px-3 py-1 rounded-full text-sm font-medium border',
                flat.occupancyStatus === 'Owner Occupied' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                flat.occupancyStatus === 'Tenant Occupied' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                'bg-gray-50 text-gray-700 border-gray-200'
              )}>
                {flat.occupancyStatus}
              </span>
            </h2>
            <p className="text-gray-500 mt-1 flex items-center gap-2">
              Block {flat.block} • Floor {flat.floor} • {flat.area} sq.ft
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors shadow-sm"
          >
            <Edit3 size={16} /> Edit
          </button>
          <button 
            onClick={() => setIsTransferModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-indigo-600 hover:bg-indigo-50 font-medium transition-colors shadow-sm"
          >
            <Repeat size={16} /> Transfer Ownership
          </button>
          <button 
            onClick={() => setIsDeleteModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 rounded-lg text-red-600 hover:bg-red-50 font-medium transition-colors shadow-sm"
          >
            <Trash2 size={16} /> Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section 1 & 2: Information & Ownership */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">Flat & Ownership Details</h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Structural Details</h4>
                <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                  <div>
                    <p className="text-sm text-gray-500">Flat Number</p>
                    <p className="font-medium text-gray-900">{flat.flatNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Block / Tower</p>
                    <p className="font-medium text-gray-900">{flat.block || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Floor Level</p>
                    <p className="font-medium text-gray-900">{flat.floor || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Area (sq.ft)</p>
                    <p className="font-medium text-gray-900">{flat.area || '-'}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Owner Information</h4>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Owner Name</p>
                    <p className="font-medium text-gray-900">{flat.ownerName}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium text-gray-900">{flat.ownerPhone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium text-gray-900 truncate" title={flat.ownerEmail}>{flat.ownerEmail}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Occupancy Management */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Occupancy Management</h3>
              <button 
                onClick={() => setIsEditModalOpen(true)}
                className="text-sm text-indigo-600 font-medium hover:underline"
              >
                Update Status
              </button>
            </div>
            <div className="p-6">
              {flat.occupancyStatus === 'Tenant Occupied' && flat.tenant ? (
                <div className="bg-blue-50/50 rounded-xl p-5 border border-blue-100 mb-6">
                  <h4 className="text-sm font-bold text-blue-800 uppercase tracking-wider mb-4">Current Tenant</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-blue-600/70 uppercase font-semibold">Name</p>
                      <p className="font-medium text-blue-900">{flat.tenant.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-600/70 uppercase font-semibold">Phone</p>
                      <p className="font-medium text-blue-900">{flat.tenant.phone}</p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-600/70 uppercase font-semibold">Move-in Date</p>
                      <p className="font-medium text-blue-900">{format(new Date(flat.tenant.moveInDate), 'dd MMM yyyy')}</p>
                    </div>
                  </div>
                </div>
              ) : flat.occupancyStatus === 'Owner Occupied' ? (
                <div className="bg-emerald-50/50 rounded-xl p-5 border border-emerald-100 mb-6">
                  <p className="text-emerald-800 font-medium flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-emerald-600" />
                    Currently occupied by the owner.
                  </p>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 mb-6">
                  <p className="text-gray-600 font-medium flex items-center gap-2">
                    <Clock size={18} className="text-gray-400" />
                    This flat is currently vacant.
                  </p>
                </div>
              )}

              <div>
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Occupancy History</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="text-gray-500 border-b border-gray-100">
                        <th className="pb-2 font-medium">Type</th>
                        <th className="pb-2 font-medium">Name</th>
                        <th className="pb-2 font-medium">Start Date</th>
                        <th className="pb-2 font-medium">End Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {flat.occupancyHistory.map((history) => (
                        <tr key={history.id} className="text-gray-700">
                          <td className="py-3">
                            <span className={clsx(
                              'px-2 py-0.5 rounded text-xs font-medium',
                              history.type === 'Owner' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                            )}>
                              {history.type}
                            </span>
                          </td>
                          <td className="py-3 font-medium">{history.name}</td>
                          <td className="py-3">{format(new Date(history.startDate), 'dd MMM yyyy')}</td>
                          <td className="py-3 text-gray-500">{history.endDate ? format(new Date(history.endDate), 'dd MMM yyyy') : 'Present'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Financial Overview */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Financial Overview</h3>
              <div className="text-right">
                <p className="text-sm text-gray-500">Total Outstanding</p>
                <p className={clsx('text-lg font-bold', outstanding > 0 ? 'text-red-600' : 'text-emerald-600')}>
                  ₹{outstanding.toLocaleString()}
                </p>
              </div>
            </div>
            
            <div className="border-b border-gray-200 flex">
              <button
                className={clsx(
                  'flex-1 py-3 text-sm font-medium text-center border-b-2 transition-colors',
                  activeTab === 'received' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                )}
                onClick={() => setActiveTab('received')}
              >
                Payments Received
              </button>
              <button
                className={clsx(
                  'flex-1 py-3 text-sm font-medium text-center border-b-2 transition-colors',
                  activeTab === 'pending' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                )}
                onClick={() => setActiveTab('pending')}
              >
                Pending Dues
                {flat.pendingDues.length > 0 && (
                  <span className="ml-2 bg-red-100 text-red-600 py-0.5 px-2 rounded-full text-xs">
                    {flat.pendingDues.length}
                  </span>
                )}
              </button>
            </div>

            <div className="p-0">
              {activeTab === 'received' ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500">
                      <tr>
                        <th className="px-6 py-3 font-medium">Receipt No</th>
                        <th className="px-6 py-3 font-medium">Date</th>
                        <th className="px-6 py-3 font-medium">Mode</th>
                        <th className="px-6 py-3 font-medium">Amount</th>
                        <th className="px-6 py-3 font-medium text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {flat.payments.length === 0 ? (
                        <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No payments recorded.</td></tr>
                      ) : (
                        flat.payments.map((payment) => (
                          <tr key={payment.id} id={`payment-${payment.id}`} className="hover:bg-gray-50">
                            <td className="px-6 py-4 font-medium text-gray-900">{payment.receiptNumber}</td>
                            <td className="px-6 py-4 text-gray-600">{format(new Date(payment.date), 'dd MMM yyyy')}</td>
                            <td className="px-6 py-4 text-gray-600">
                              <span className="inline-flex items-center px-2 py-1 rounded bg-gray-100 text-xs font-medium text-gray-700">
                                {payment.mode}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-medium text-emerald-600">₹{payment.amount.toLocaleString()}</td>
                            <td className="px-6 py-4 text-right">
                              <button 
                                onClick={() => handleDownloadPDF(payment)}
                                className="text-indigo-600 hover:text-indigo-800 hover:underline inline-flex items-center gap-1 text-xs font-medium"
                              >
                                <Download size={14} /> PDF
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500">
                      <tr>
                        <th className="px-6 py-3 font-medium">Charge Title</th>
                        <th className="px-6 py-3 font-medium">Due Date</th>
                        <th className="px-6 py-3 font-medium">Amount</th>
                        <th className="px-6 py-3 font-medium">Status</th>
                        <th className="px-6 py-3 font-medium text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {flat.pendingDues.length === 0 ? (
                        <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No pending dues.</td></tr>
                      ) : (
                        flat.pendingDues.map((due) => (
                          <tr key={due.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <p className="font-medium text-gray-900">{due.title}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{due.description}</p>
                            </td>
                            <td className="px-6 py-4 text-gray-600">{format(new Date(due.dueDate), 'dd MMM yyyy')}</td>
                            <td className="px-6 py-4 font-medium text-gray-900">₹{due.amount.toLocaleString()}</td>
                            <td className="px-6 py-4">
                              <span className={clsx(
                                'px-2 py-1 rounded text-xs font-medium',
                                due.status === 'Overdue' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                              )}>
                                {due.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button 
                                onClick={() => setReceiptDue(due)}
                                className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                              >
                                Generate Receipt
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Column */}
        <div className="space-y-6">
          
          {/* Section 4: Parking Allocation */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Parking Allocation</h3>
              <span className="bg-gray-200 text-gray-800 text-xs font-bold px-2 py-1 rounded-full">
                {flatParkingSlots.length} Slots
              </span>
            </div>
            <div className="p-6">
              {flatParkingSlots.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">No parking slots allocated.</p>
              ) : (
                <div className="space-y-3">
                  {flatParkingSlots.map((slot) => (
                    <div key={slot.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-xl bg-gray-50">
                      <div>
                        <p className="font-bold text-gray-900 text-lg">{slot.slotNumber}</p>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mt-0.5">
                          {slot.zone} • Lvl {slot.level} • {slot.slotType}
                        </p>
                      </div>
                      <button 
                        onClick={() => removeAllocation(slot.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors p-2 rounded-lg hover:bg-red-50"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <button 
                onClick={() => setIsAssignParkingModalOpen(true)}
                className="w-full mt-4 flex items-center justify-center gap-2 py-2 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors font-medium text-sm"
              >
                <Plus size={16} /> Assign Parking Slot
              </button>
            </div>
          </div>

          {/* Section 6: Notes */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Notes & Remarks</h3>
              <button className="text-indigo-600 hover:bg-indigo-50 p-1.5 rounded-lg transition-colors">
                <Plus size={18} />
              </button>
            </div>
            <div className="p-6">
              {flat.notes.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">No notes added.</p>
              ) : (
                <div className="space-y-4">
                  {flat.notes.map((note) => (
                    <div key={note.id} className="bg-yellow-50/50 border border-yellow-100 p-4 rounded-xl">
                      <p className="text-sm text-gray-800">{note.text}</p>
                      <div className="flex justify-between items-center mt-3 text-xs text-gray-500">
                        <span className="font-medium text-gray-600">{note.author}</span>
                        <span>{format(new Date(note.timestamp), 'dd MMM yyyy, HH:mm')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Modals */}
      <EditFlatModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        flat={flat} 
      />
      <TransferOwnershipModal 
        isOpen={isTransferModalOpen} 
        onClose={() => setIsTransferModalOpen(false)} 
        flat={flat} 
      />
      <AssignParkingModal 
        isOpen={isAssignParkingModalOpen} 
        onClose={() => setIsAssignParkingModalOpen(false)} 
        flatId={flat.id} 
      />
      <GenerateReceiptModal 
        isOpen={!!receiptDue} 
        onClose={() => setReceiptDue(null)} 
        flatId={flat.id} 
        due={receiptDue} 
      />
      <DeleteConfirmationModal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)} 
        flat={flat} 
        onConfirm={handleDeleteConfirm} 
      />
    </div>
  );
}
