import React, { useState, useMemo } from 'react';
import { useExpense } from '../../context/ExpenseContext';
import { useProfile } from '../../context/ProfileContext';
import { format, parseISO, isSameMonth, subMonths, isWithinInterval } from 'date-fns';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { exportToPDF, exportToExcel } from './ExportUtils';
import { Download, Filter } from 'lucide-react';

const COLORS = ['#10B981', '#F43F5E', '#F59E0B', '#3B82F6', '#8B5CF6', '#14B8A6', '#F97316'];

export default function ExpenseAnalysis() {
  const { entries } = useExpense();
  const { societySettings } = useProfile();
  
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'));

  const currentMonthDate = parseISO(`${month}-01`);
  const prevMonthDate = subMonths(currentMonthDate, 1);

  const currentMonthExpenses = useMemo(() => {
    return entries.filter(e => e.expenseCategory === 'Society Operational Expense' && isSameMonth(parseISO(e.date), currentMonthDate));
  }, [entries, currentMonthDate]);

  const prevMonthExpenses = useMemo(() => {
    return entries.filter(e => e.expenseCategory === 'Society Operational Expense' && isSameMonth(parseISO(e.date), prevMonthDate));
  }, [entries, prevMonthDate]);

  const totalCurrent = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  
  const categoryData = useMemo(() => {
    const categories = Array.from(new Set([...currentMonthExpenses, ...prevMonthExpenses].map(e => e.expenseType)));
    
    return categories.map(cat => {
      const current = currentMonthExpenses.filter(e => e.expenseType === cat).reduce((sum, e) => sum + e.amount, 0);
      const prev = prevMonthExpenses.filter(e => e.expenseType === cat).reduce((sum, e) => sum + e.amount, 0);
      return {
        category: cat,
        currentAmount: current,
        prevAmount: prev,
        percentage: totalCurrent > 0 ? ((current / totalCurrent) * 100).toFixed(1) : '0.0'
      };
    }).sort((a, b) => b.currentAmount - a.currentAmount);
  }, [currentMonthExpenses, prevMonthExpenses, totalCurrent]);

  const pieData = categoryData.filter(d => d.currentAmount > 0).map(d => ({
    name: d.category,
    value: d.currentAmount
  }));

  const barData = categoryData.map(d => ({
    name: d.category,
    [format(currentMonthDate, 'MMM yyyy')]: d.currentAmount,
    [format(prevMonthDate, 'MMM yyyy')]: d.prevAmount
  }));

  const dateRangeStr = format(currentMonthDate, 'MMMM yyyy');

  const handleExportPDF = () => {
    const columns = ['Category', 'Amount Spent', '% Contribution', 'Previous Month'];
    const data = categoryData.map(d => [
      d.category,
      `Rs. ${d.currentAmount}`,
      `${d.percentage}%`,
      `Rs. ${d.prevAmount}`
    ]);
    exportToPDF('Expense Category Analysis', societySettings.name, dateRangeStr, columns, data);
  };

  const handleExportExcel = () => {
    const columns = ['Category', 'Amount Spent', '% Contribution', 'Previous Month'];
    const data = categoryData.map(d => [
      d.category,
      d.currentAmount,
      d.percentage,
      d.prevAmount
    ]);
    exportToExcel('Expense Category Analysis', societySettings.name, dateRangeStr, columns, data);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-gray-500 font-medium">
            <Filter size={20} /> Filters
          </div>
          <input 
            type="month" 
            value={month} 
            onChange={e => setMonth(e.target.value)} 
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm" 
          />
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-80">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Category Distribution ({format(currentMonthDate, 'MMM yyyy')})</h3>
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
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Monthly Comparison</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#6B7280'}} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#6B7280'}} />
              <Tooltip cursor={{fill: '#F3F4F6'}} />
              <Legend />
              <Bar dataKey={format(currentMonthDate, 'MMM yyyy')} fill="#F43F5E" radius={[4, 4, 0, 0]} />
              <Bar dataKey={format(prevMonthDate, 'MMM yyyy')} fill="#E5E7EB" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 font-medium">Category Name</th>
                <th className="px-6 py-3 font-medium text-right">Amount Spent</th>
                <th className="px-6 py-3 font-medium text-right">% Contribution</th>
                <th className="px-6 py-3 font-medium text-right">Previous Month</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categoryData.map((cat, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-gray-900 font-medium">{cat.category}</td>
                  <td className="px-6 py-3 text-right text-red-600 font-medium">₹{cat.currentAmount.toLocaleString('en-IN')}</td>
                  <td className="px-6 py-3 text-right text-gray-600">{cat.percentage}%</td>
                  <td className="px-6 py-3 text-right text-gray-500">₹{cat.prevAmount.toLocaleString('en-IN')}</td>
                </tr>
              ))}
              {categoryData.length === 0 && (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No expenses found for the selected period.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
