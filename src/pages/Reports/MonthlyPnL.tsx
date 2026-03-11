import React, { useState, useMemo } from 'react';
import { useLedger } from '../../context/LedgerContext';
import { useProfile } from '../../context/ProfileContext';
import { format, parseISO, isSameMonth, isWithinInterval } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { exportToPDF, exportToExcel } from './ExportUtils';
import { Download, Filter } from 'lucide-react';

export default function MonthlyPnL() {
  const { transactions } = useLedger();
  const { societySettings } = useProfile();
  
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [financialYear, setFinancialYear] = useState('All');

  const getFYDates = (fy: string) => {
    if (fy === 'All') return null;
    const startYear = parseInt(fy.split('-')[0]);
    return {
      start: new Date(startYear, 3, 1),
      end: new Date(startYear + 1, 2, 31, 23, 59, 59)
    };
  };

  const filteredTransactions = useMemo(() => {
    const fyDates = getFYDates(financialYear);
    return transactions.filter(tx => {
      const txDate = parseISO(tx.date);
      if (financialYear !== 'All' && fyDates) {
        if (!isWithinInterval(txDate, { start: fyDates.start, end: fyDates.end })) return false;
      } else {
        if (!isSameMonth(txDate, parseISO(`${month}-01`))) return false;
      }
      return true;
    });
  }, [transactions, month, financialYear]);

  const totalIncome = filteredTransactions.filter(tx => tx.type === 'Income').reduce((sum, tx) => sum + tx.amount, 0);
  const totalExpense = filteredTransactions.filter(tx => tx.type === 'Expense').reduce((sum, tx) => sum + tx.amount, 0);
  const netProfit = totalIncome - totalExpense;

  const chartData = [
    { 
      name: financialYear !== 'All' ? financialYear : format(parseISO(`${month}-01`), 'MMM yyyy'), 
      Income: totalIncome, 
      Expense: totalExpense 
    }
  ];

  const dateRangeStr = financialYear !== 'All' ? `FY ${financialYear}` : format(parseISO(`${month}-01`), 'MMMM yyyy');

  const handleExportPDF = () => {
    const columns = ['Date', 'Type', 'Category', 'Description', 'Amount'];
    const data = filteredTransactions.map(tx => [
      format(parseISO(tx.date), 'dd MMM yyyy'),
      tx.type,
      tx.category,
      tx.description,
      `Rs. ${tx.amount}`
    ]);
    exportToPDF('Monthly Profit & Loss Statement', societySettings.name, dateRangeStr, columns, data);
  };

  const handleExportExcel = () => {
    const columns = ['Date', 'Type', 'Category', 'Description', 'Amount'];
    const data = filteredTransactions.map(tx => [
      format(parseISO(tx.date), 'dd MMM yyyy'),
      tx.type,
      tx.category,
      tx.description,
      tx.amount
    ]);
    exportToExcel('Monthly Profit & Loss Statement', societySettings.name, dateRangeStr, columns, data);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-4">
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Total Income</p>
          <p className="text-2xl font-bold text-emerald-600">₹{totalIncome.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Total Expense</p>
          <p className="text-2xl font-bold text-red-600">₹{totalExpense.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Net {netProfit >= 0 ? 'Profit (Surplus)' : 'Loss (Deficit)'}</p>
          <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            ₹{Math.abs(netProfit).toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-80">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Income vs Expense</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#6B7280'}} />
            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#6B7280'}} />
            <Tooltip cursor={{fill: '#F3F4F6'}} />
            <Legend />
            <Bar dataKey="Income" fill="#10B981" radius={[4, 4, 0, 0]} barSize={60} />
            <Bar dataKey="Expense" fill="#F43F5E" radius={[4, 4, 0, 0]} barSize={60} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Type</th>
                <th className="px-6 py-3 font-medium">Category</th>
                <th className="px-6 py-3 font-medium">Description</th>
                <th className="px-6 py-3 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTransactions.map(tx => (
                <tr key={tx.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-gray-900">{format(parseISO(tx.date), 'dd MMM yyyy')}</td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${tx.type === 'Income' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {tx.type}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-600">{tx.category}</td>
                  <td className="px-6 py-3 text-gray-600">{tx.description}</td>
                  <td className={`px-6 py-3 text-right font-medium ${tx.type === 'Income' ? 'text-emerald-600' : 'text-red-600'}`}>
                    ₹{tx.amount.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No transactions found for the selected period.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
