import React, { useState, useMemo } from 'react';
import { useFlats } from '../../context/FlatsContext';
import { useProfile } from '../../context/ProfileContext';
import { format, parseISO, isSameMonth, isWithinInterval } from 'date-fns';
import { exportToPDF, exportToExcel } from './ExportUtils';
import { Download, Filter } from 'lucide-react';

export default function PaymentRegister() {
  const { flats } = useFlats();
  const { societySettings } = useProfile();
  
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [financialYear, setFinancialYear] = useState('All');
  const [blockFilter, setBlockFilter] = useState('All');
  const [paymentCategoryFilter, setPaymentCategoryFilter] = useState('All');

  const getFYDates = (fy: string) => {
    if (fy === 'All') return null;
    const startYear = parseInt(fy.split('-')[0]);
    return {
      start: new Date(startYear, 3, 1),
      end: new Date(startYear + 1, 2, 31, 23, 59, 59)
    };
  };

  const payments = useMemo(() => {
    const fyDates = getFYDates(financialYear);
    const allPayments = flats.flatMap(flat => 
      flat.payments.map(payment => ({
        ...payment,
        flatNumber: flat.flatNumber,
        block: flat.block,
        occupantName: flat.occupancyStatus === 'Tenant Occupied' && flat.tenant ? flat.tenant.name : flat.ownerName,
        category: payment.title || 'Other' // Simplified mapping
      }))
    );

    return allPayments.filter(p => {
      const pDate = parseISO(p.date);
      if (financialYear !== 'All' && fyDates) {
        if (!isWithinInterval(pDate, { start: fyDates.start, end: fyDates.end })) return false;
      } else {
        if (!isSameMonth(pDate, parseISO(`${month}-01`))) return false;
      }
      if (blockFilter !== 'All' && p.block !== blockFilter) return false;
      if (paymentCategoryFilter !== 'All' && p.category !== paymentCategoryFilter) return false;
      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [flats, month, financialYear, blockFilter, paymentCategoryFilter]);

  const totalPaymentsCount = payments.length;
  const totalAmountCollected = payments.reduce((sum, p) => sum + p.amount, 0);

  const dateRangeStr = financialYear !== 'All' ? `FY ${financialYear}` : format(parseISO(`${month}-01`), 'MMMM yyyy');

  const handleExportPDF = () => {
    const columns = ['Occupant Name', 'Flat Number', 'Payment Category', 'Amount Paid', 'Payment Date'];
    const data = payments.map(p => [
      p.occupantName,
      p.flatNumber,
      p.category,
      `Rs. ${p.amount}`,
      format(parseISO(p.date), 'dd MMM yyyy')
    ]);
    exportToPDF('Monthly Resident Payment Register', societySettings.name, dateRangeStr, columns, data);
  };

  const handleExportExcel = () => {
    const columns = ['Occupant Name', 'Flat Number', 'Payment Category', 'Amount Paid', 'Payment Date'];
    const data = payments.map(p => [
      p.occupantName,
      p.flatNumber,
      p.category,
      p.amount,
      format(parseISO(p.date), 'dd MMM yyyy')
    ]);
    exportToExcel('Monthly Resident Payment Register', societySettings.name, dateRangeStr, columns, data);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-wrap justify-between items-center gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-gray-500 font-medium">
            <Filter size={20} /> Filters
          </div>
          <select 
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm"
            value={financialYear}
            onChange={e => setFinancialYear(e.target.value)}
          >
            <option value="All">Specific Month</option>
            <option value="2025-2026">FY 2025-2026</option>
            <option value="2024-2025">FY 2024-2025</option>
          </select>
          {financialYear === 'All' && (
            <input 
              type="month" 
              value={month} 
              onChange={e => setMonth(e.target.value)} 
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm" 
            />
          )}
          <select 
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm"
            value={blockFilter}
            onChange={e => setBlockFilter(e.target.value)}
          >
            <option value="All">All Blocks</option>
            {Array.from(new Set(flats.map(f => f.block))).map(b => <option key={b} value={b}>Block {b}</option>)}
          </select>
          <select 
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm"
            value={paymentCategoryFilter}
            onChange={e => setPaymentCategoryFilter(e.target.value)}
          >
            <option value="All">All Categories</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Penalty">Penalty</option>
            <option value="Resident Charge">Resident Charge</option>
            <option value="Other">Other</option>
          </select>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Total Payments Count</p>
          <p className="text-2xl font-bold text-gray-900">{totalPaymentsCount}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Total Amount Collected</p>
          <p className="text-2xl font-bold text-emerald-600">₹{totalAmountCollected.toLocaleString('en-IN')}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 font-medium">Occupant Name</th>
                <th className="px-6 py-3 font-medium">Flat Number</th>
                <th className="px-6 py-3 font-medium">Payment Category</th>
                <th className="px-6 py-3 font-medium text-right">Amount Paid</th>
                <th className="px-6 py-3 font-medium">Payment Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.map((p, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-gray-900 font-medium">{p.occupantName}</td>
                  <td className="px-6 py-3 text-gray-600">{p.flatNumber}</td>
                  <td className="px-6 py-3 text-gray-600">{p.category}</td>
                  <td className="px-6 py-3 text-right text-emerald-600 font-medium">₹{p.amount.toLocaleString('en-IN')}</td>
                  <td className="px-6 py-3 text-gray-600">{format(parseISO(p.date), 'dd MMM yyyy')}</td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No payments found for the selected period.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
