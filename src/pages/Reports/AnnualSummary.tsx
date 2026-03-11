import React, { useState, useMemo } from 'react';
import { useLedger } from '../../context/LedgerContext';
import { useFlats } from '../../context/FlatsContext';
import { useProfile } from '../../context/ProfileContext';
import { format, parseISO, isWithinInterval } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { exportToPDF, exportToExcel } from './ExportUtils';
import { Download, Filter } from 'lucide-react';

export default function AnnualSummary() {
  const { transactions } = useLedger();
  const { flats } = useFlats();
  const { societySettings } = useProfile();
  
  const [financialYear, setFinancialYear] = useState('2025-2026');

  const getFYDates = (fy: string) => {
    const startYear = parseInt(fy.split('-')[0]);
    return {
      start: new Date(startYear, 3, 1),
      end: new Date(startYear + 1, 2, 31, 23, 59, 59)
    };
  };

  const fyDates = getFYDates(financialYear);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const txDate = parseISO(tx.date);
      return isWithinInterval(txDate, { start: fyDates.start, end: fyDates.end });
    });
  }, [transactions, fyDates]);

  const totalIncome = filteredTransactions.filter(tx => tx.type === 'Income').reduce((sum, tx) => sum + tx.amount, 0);
  const totalExpense = filteredTransactions.filter(tx => tx.type === 'Expense').reduce((sum, tx) => sum + tx.amount, 0);
  const closingBalance = totalIncome - totalExpense;

  const totalOutstanding = flats.reduce((sum, flat) => {
    return sum + flat.pendingDues.reduce((dSum, due) => dSum + due.amount, 0);
  }, 0);

  const totalCollected = totalIncome; // Simplified for this context
  const totalBilled = totalCollected + totalOutstanding;
  const collectionRate = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0;

  const chartData = [
    { name: 'Annual Financials', Income: totalIncome, Expense: totalExpense }
  ];

  const gaugeData = [
    { name: 'Collected', value: collectionRate, fill: '#10B981' },
    { name: 'Pending', value: 100 - collectionRate, fill: '#E5E7EB' }
  ];

  const dateRangeStr = `FY ${financialYear}`;

  const handleExportPDF = () => {
    const columns = ['Metric', 'Amount'];
    const data = [
      ['Total Income', `Rs. ${totalIncome}`],
      ['Total Expense', `Rs. ${totalExpense}`],
      ['Closing Balance', `Rs. ${closingBalance}`],
      ['Total Outstanding', `Rs. ${totalOutstanding}`],
      ['Collection Rate', `${collectionRate}%`]
    ];
    exportToPDF('Annual Financial Summary', societySettings.name, dateRangeStr, columns, data);
  };

  const handleExportExcel = () => {
    const columns = ['Metric', 'Amount'];
    const data = [
      ['Total Income', totalIncome],
      ['Total Expense', totalExpense],
      ['Closing Balance', closingBalance],
      ['Total Outstanding', totalOutstanding],
      ['Collection Rate (%)', collectionRate]
    ];
    exportToExcel('Annual Financial Summary', societySettings.name, dateRangeStr, columns, data);
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
            <option value="2025-2026">FY 2025-2026</option>
            <option value="2024-2025">FY 2024-2025</option>
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

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Total Income</p>
          <p className="text-xl font-bold text-emerald-600">₹{totalIncome.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Total Expense</p>
          <p className="text-xl font-bold text-red-600">₹{totalExpense.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Closing Balance</p>
          <p className={`text-xl font-bold ${closingBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            ₹{closingBalance.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Total Outstanding</p>
          <p className="text-xl font-bold text-amber-600">₹{totalOutstanding.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Collection Rate</p>
          <p className="text-xl font-bold text-indigo-600">{collectionRate}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-80">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Annual Income vs Expense</h3>
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
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-80">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 text-center">Collection Efficiency</h3>
          <div className="h-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={gaugeData}
                  cx="50%"
                  cy="100%"
                  startAngle={180}
                  endAngle={0}
                  innerRadius={100}
                  outerRadius={140}
                  paddingAngle={0}
                  dataKey="value"
                  stroke="none"
                >
                  {gaugeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute bottom-10 left-0 right-0 text-center">
              <span className="text-4xl font-bold text-gray-900">{collectionRate}%</span>
              <p className="text-sm text-gray-500 mt-1">Collected vs Billed</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
