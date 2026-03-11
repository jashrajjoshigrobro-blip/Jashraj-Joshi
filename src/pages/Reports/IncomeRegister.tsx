import React, { useState, useMemo } from 'react';
import { useLedger } from '../../context/LedgerContext';
import { useProfile } from '../../context/ProfileContext';
import { format, parseISO, isSameMonth, isWithinInterval, subMonths } from 'date-fns';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { exportToPDF, exportToExcel } from './ExportUtils';
import { Download, Filter } from 'lucide-react';

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#F43F5E', '#14B8A6', '#F97316'];

export default function IncomeRegister() {
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

  const fyDates = getFYDates(financialYear);

  const incomes = useMemo(() => {
    return transactions.filter(tx => {
      if (tx.type !== 'Income') return false;
      const txDate = parseISO(tx.date);
      if (financialYear !== 'All' && fyDates) {
        if (!isWithinInterval(txDate, { start: fyDates.start, end: fyDates.end })) return false;
      } else {
        if (!isSameMonth(txDate, parseISO(`${month}-01`))) return false;
      }
      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, month, financialYear, fyDates]);

  const totalIncome = incomes.reduce((sum, tx) => sum + tx.amount, 0);

  const incomeByCategory = incomes.reduce((acc, tx) => {
    acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.keys(incomeByCategory).map(k => ({
    name: k,
    value: incomeByCategory[k]
  }));

  const trendData = useMemo(() => {
    const data = [];
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(today, i);
      const monthName = format(monthDate, 'MMM yyyy');
      const inc = transactions.filter(tx => tx.type === 'Income' && isSameMonth(parseISO(tx.date), monthDate)).reduce((sum, tx) => sum + tx.amount, 0);
      data.push({ name: monthName, Income: inc });
    }
    return data;
  }, [transactions]);

  const dateRangeStr = financialYear !== 'All' ? `FY ${financialYear}` : format(parseISO(`${month}-01`), 'MMMM yyyy');

  const handleExportPDF = () => {
    const columns = ['Date', 'Flat Number', 'Income Type', 'Amount', 'Payment Mode'];
    const data = incomes.map(tx => [
      format(parseISO(tx.date), 'dd MMM yyyy'),
      tx.flatNumber || '—',
      tx.category,
      `Rs. ${tx.amount}`,
      'Online' // Simplified
    ]);
    exportToPDF('Income Summary Register', societySettings.name, dateRangeStr, columns, data);
  };

  const handleExportExcel = () => {
    const columns = ['Date', 'Flat Number', 'Income Type', 'Amount', 'Payment Mode'];
    const data = incomes.map(tx => [
      format(parseISO(tx.date), 'dd MMM yyyy'),
      tx.flatNumber || '—',
      tx.category,
      tx.amount,
      'Online' // Simplified
    ]);
    exportToExcel('Income Summary Register', societySettings.name, dateRangeStr, columns, data);
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
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm md:col-span-2">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Income by Category</h3>
          <div className="flex flex-wrap gap-4">
            {Object.keys(incomeByCategory).map((cat, i) => (
              <div key={cat} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                <span className="text-sm text-gray-600">{cat}:</span>
                <span className="text-sm font-bold text-gray-900">₹{incomeByCategory[cat].toLocaleString('en-IN')}</span>
              </div>
            ))}
            {Object.keys(incomeByCategory).length === 0 && <span className="text-sm text-gray-500">No income data</span>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-80">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Income Distribution</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-80">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Income Trend (Last 6 Months)</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#6B7280'}} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#6B7280'}} />
              <Tooltip cursor={{fill: '#F3F4F6'}} formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`} />
              <Legend />
              <Line type="monotone" dataKey="Income" stroke="#10B981" strokeWidth={3} dot={{r: 4}} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Flat Number</th>
                <th className="px-6 py-3 font-medium">Income Type</th>
                <th className="px-6 py-3 font-medium text-right">Amount</th>
                <th className="px-6 py-3 font-medium">Payment Mode</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {incomes.map((tx, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-gray-900">{format(parseISO(tx.date), 'dd MMM yyyy')}</td>
                  <td className="px-6 py-3 text-gray-600">{tx.flatNumber || '—'}</td>
                  <td className="px-6 py-3 text-gray-600">{tx.category}</td>
                  <td className="px-6 py-3 text-right text-emerald-600 font-medium">₹{tx.amount.toLocaleString('en-IN')}</td>
                  <td className="px-6 py-3 text-gray-600">Online</td>
                </tr>
              ))}
              {incomes.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No income records found for the selected period.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
