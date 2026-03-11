import React, { useState, useMemo } from 'react';
import { useFlats } from '../../context/FlatsContext';
import { useProfile } from '../../context/ProfileContext';
import { format } from 'date-fns';
import { exportToPDF, exportToExcel } from './ExportUtils';
import { Download, Filter, ArrowDownWideNarrow, ArrowUpWideNarrow } from 'lucide-react';

export default function DefaulterReport() {
  const { flats } = useFlats();
  const { societySettings } = useProfile();
  
  const [sortBy, setSortBy] = useState<'amount' | 'months'>('amount');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const defaulters = useMemo(() => {
    const data = flats.map(flat => {
      const outstandingAmount = flat.pendingDues.reduce((sum, due) => sum + due.amount, 0);
      const monthsOverdue = flat.pendingDues.filter(due => due.status === 'Overdue').length;
      return {
        flatNumber: flat.flatNumber,
        ownerName: flat.ownerName,
        outstandingAmount,
        monthsOverdue
      };
    }).filter(d => d.outstandingAmount > 0);

    return data.sort((a, b) => {
      if (sortBy === 'amount') {
        return sortOrder === 'desc' ? b.outstandingAmount - a.outstandingAmount : a.outstandingAmount - b.outstandingAmount;
      } else {
        return sortOrder === 'desc' ? b.monthsOverdue - a.monthsOverdue : a.monthsOverdue - b.monthsOverdue;
      }
    });
  }, [flats, sortBy, sortOrder]);

  const dateRangeStr = `As of ${format(new Date(), 'dd MMMM yyyy')}`;

  const handleExportPDF = () => {
    const columns = ['Flat Number', 'Owner Name', 'Outstanding Amount', 'Months Overdue'];
    const data = defaulters.map(d => [
      d.flatNumber,
      d.ownerName,
      `Rs. ${d.outstandingAmount}`,
      d.monthsOverdue.toString()
    ]);
    exportToPDF('Defaulter Report', societySettings.name, dateRangeStr, columns, data);
  };

  const handleExportExcel = () => {
    const columns = ['Flat Number', 'Owner Name', 'Outstanding Amount', 'Months Overdue'];
    const data = defaulters.map(d => [
      d.flatNumber,
      d.ownerName,
      d.outstandingAmount,
      d.monthsOverdue
    ]);
    exportToExcel('Defaulter Report', societySettings.name, dateRangeStr, columns, data);
  };

  const toggleSort = (field: 'amount' | 'months') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-gray-500 font-medium">
            <Filter size={20} /> Filters
          </div>
          <div className="text-sm text-gray-500 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-md border border-amber-200">
            Admin Only View
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportPDF} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 text-sm font-medium text-gray-700">
            <Download size={16}/> PDF
          </button>
          <button onClick={handleExportExcel} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 text-sm font-medium text-gray-700">
            <Download size={16}/> Excel
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 font-medium">Flat Number</th>
                <th className="px-6 py-3 font-medium">Owner Name</th>
                <th 
                  className="px-6 py-3 font-medium text-right cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => toggleSort('amount')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Outstanding Amount
                    {sortBy === 'amount' && (sortOrder === 'desc' ? <ArrowDownWideNarrow size={14} /> : <ArrowUpWideNarrow size={14} />)}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 font-medium text-center cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => toggleSort('months')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Months Overdue
                    {sortBy === 'months' && (sortOrder === 'desc' ? <ArrowDownWideNarrow size={14} /> : <ArrowUpWideNarrow size={14} />)}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {defaulters.map((d, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-900 font-medium">{d.flatNumber}</td>
                  <td className="px-6 py-4 text-gray-600">{d.ownerName}</td>
                  <td className="px-6 py-4 text-right text-red-600 font-bold">₹{d.outstandingAmount.toLocaleString('en-IN')}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${d.monthsOverdue > 2 ? 'bg-red-100 text-red-700' : d.monthsOverdue > 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'}`}>
                      {d.monthsOverdue} {d.monthsOverdue === 1 ? 'Month' : 'Months'}
                    </span>
                  </td>
                </tr>
              ))}
              {defaulters.length === 0 && (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-emerald-600 font-medium">No defaulters found! All dues are cleared.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
