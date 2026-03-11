import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLedger } from '../context/LedgerContext';
import { useProfile } from '../context/ProfileContext';
import { TransactionType, TransactionCategory, LedgerTransaction } from '../types';
import { format, isWithinInterval, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import clsx from 'clsx';
import { Filter, Calendar, ArrowUpRight, ArrowDownRight, IndianRupee, Wallet, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

type ViewMode = 'All' | 'Income' | 'Expense';

export default function Ledger() {
  const { transactions } = useLedger();
  const { societySettings } = useProfile();
  const navigate = useNavigate();

  // Filters
  const [viewMode, setViewMode] = useState<ViewMode>('All');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: '',
  });
  const [categoryFilter, setCategoryFilter] = useState<TransactionCategory | 'All'>('All');
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'All'>('All');

  // Derived state
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      // 1. Date Range Filter
      if (dateRange.start && dateRange.end) {
        const txDate = parseISO(tx.date);
        const start = parseISO(dateRange.start);
        const end = parseISO(dateRange.end);
        if (!isWithinInterval(txDate, { start, end })) return false;
      }

      // 2. Category Filter
      if (categoryFilter !== 'All' && tx.category !== categoryFilter) return false;

      // 3. Type Filter (from dropdown)
      if (typeFilter !== 'All' && tx.type !== typeFilter) return false;

      // 4. View Mode Filter (Tabs)
      if (viewMode === 'Income' && tx.type !== 'Income') return false;
      if (viewMode === 'Expense' && tx.type !== 'Expense') return false;

      return true;
    });
  }, [transactions, dateRange, categoryFilter, typeFilter, viewMode]);

  // Calculate Running Balances
  // We need to calculate running balance based on the *filtered* list in chronological order.
  // Wait, the requirement says "Auto-increment serial number based on filtered list."
  // Running balance should probably be calculated from the beginning of time up to that transaction,
  // or is it the running balance of the filtered list?
  // "Running balance after each transaction. Formula: Balance(n) = Previous Balance + Money In - Money Out"
  // Usually, running balance is absolute. Let's calculate the absolute running balance for all transactions first,
  // then attach it to the transaction, so even if filtered, the balance shows the actual society balance at that point.
  // Let's do that.

  const transactionsWithBalance = useMemo(() => {
    let currentBalance = 0;
    return transactions.map(tx => {
      if (tx.type === 'Income') {
        currentBalance += tx.amount;
      } else {
        currentBalance -= tx.amount;
      }
      return { ...tx, runningBalance: currentBalance };
    });
  }, [transactions]);

  // Now apply filters to the transactions that already have their absolute running balance
  const displayTransactions = useMemo(() => {
    return transactionsWithBalance.filter(tx => {
      if (dateRange.start && dateRange.end) {
        const txDate = parseISO(tx.date);
        const start = parseISO(dateRange.start);
        const end = parseISO(dateRange.end);
        if (!isWithinInterval(txDate, { start, end })) return false;
      }
      if (categoryFilter !== 'All' && tx.category !== categoryFilter) return false;
      if (typeFilter !== 'All' && tx.type !== typeFilter) return false;
      if (viewMode === 'Income' && tx.type !== 'Income') return false;
      if (viewMode === 'Expense' && tx.type !== 'Expense') return false;
      return true;
    });
  }, [transactionsWithBalance, dateRange, categoryFilter, typeFilter, viewMode]);

  // Summary Calculations (based on filtered list)
  const summary = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;

    displayTransactions.forEach(tx => {
      if (tx.type === 'Income') totalIncome += tx.amount;
      if (tx.type === 'Expense') totalExpense += tx.amount;
    });

    return {
      totalIncome,
      totalExpense,
      netBalance: totalIncome - totalExpense,
    };
  }, [displayTransactions]);

  // Current Balance is the balance of the very last transaction in the entire ledger (not filtered)
  const currentBalance = transactionsWithBalance.length > 0 
    ? transactionsWithBalance[transactionsWithBalance.length - 1].runningBalance 
    : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const uniqueCategories = Array.from(new Set(transactions.map(tx => tx.category)));

  const handleRowClick = (tx: LedgerTransaction) => {
    if (tx.type === 'Income' && tx.flatId) {
      const paymentId = tx.id.replace('pay-', '');
      navigate(`/flats/${tx.flatId}`, { state: { highlightPaymentId: paymentId } });
    } else if (tx.type === 'Expense') {
      const expenseId = tx.id.replace('exp-', '');
      navigate('/expenses', { state: { highlightExpenseId: expenseId } });
    }
  };

  const handleDownloadExcel = () => {
    const data = displayTransactions.map((tx, index) => {
      const row: any = {
        'Sr No': index + 1,
        'Date': format(parseISO(tx.date), 'dd-MMM-yyyy'),
        'Type': tx.type,
        'Flat No': tx.flatNumber || '—',
        'Occupant': tx.occupantName || '—',
        'Category': tx.category,
        'Description': tx.description,
      };

      if (viewMode === 'All') {
        row['Payment Received (Money In)'] = tx.type === 'Income' ? tx.amount : '—';
        row['Pending Dues (Money Out)'] = tx.type === 'Expense' ? tx.amount : '—';
      } else if (viewMode === 'Income') {
        row['Payment Received (Money In)'] = tx.amount;
      } else if (viewMode === 'Expense') {
        row['Pending Dues (Money Out)'] = tx.amount;
      }

      row['Balance'] = tx.runningBalance;

      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Ledger');
    const safeSocietyName = societySettings.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    XLSX.writeFile(workbook, `${safeSocietyName}_ledger_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-24">
      {/* SECTION A — FINANCIAL SUMMARY */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-900">Ledger Management</h2>
        <button
          onClick={handleDownloadExcel}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium"
        >
          <Download size={18} />
          Download Excel
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Payment Received */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <ArrowDownRight size={20} />
            </div>
            <h3 className="text-sm font-medium text-gray-500">Total Payment Received</h3>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{formatCurrency(summary.totalIncome)}</p>
        </div>

        {/* Total Pending Dues */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-50 text-red-600 rounded-lg">
              <ArrowUpRight size={20} />
            </div>
            <h3 className="text-sm font-medium text-gray-500">Total Pending Dues</h3>
          </div>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalExpense)}</p>
        </div>

        {/* Net Balance */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <IndianRupee size={20} />
            </div>
            <h3 className="text-sm font-medium text-gray-500">Net Balance</h3>
          </div>
          <p className={clsx(
            "text-2xl font-bold",
            summary.netBalance >= 0 ? "text-emerald-600" : "text-red-600"
          )}>
            {formatCurrency(summary.netBalance)}
          </p>
        </div>

        {/* Current Balance */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gray-100 text-gray-700 rounded-lg">
              <Wallet size={20} />
            </div>
            <h3 className="text-sm font-medium text-gray-500">Current Balance</h3>
          </div>
          <p className={clsx(
            "text-2xl font-bold",
            currentBalance >= 0 ? "text-gray-900" : "text-red-600"
          )}>
            {formatCurrency(currentBalance)}
          </p>
        </div>
      </div>

      {/* SECTION B — TRANSACTION LEDGER */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[600px]">
        
        {/* Filters & Tabs Header */}
        <div className="px-6 py-4 border-b border-gray-200 space-y-4 shrink-0">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            {/* Tabs */}
            <div className="flex bg-gray-100 p-1 rounded-lg">
              {(['All', 'Income', 'Expense'] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={clsx(
                    "px-4 py-1.5 text-sm font-medium rounded-md transition-colors",
                    viewMode === mode 
                      ? "bg-white text-gray-900 shadow-sm" 
                      : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  {mode}
                </button>
              ))}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
                <Calendar size={16} className="text-gray-400" />
                <input 
                  type="date" 
                  className="bg-transparent text-sm text-gray-700 outline-none"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                />
                <span className="text-gray-400">to</span>
                <input 
                  type="date" 
                  className="bg-transparent text-sm text-gray-700 outline-none"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as any)}
                className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg px-3 py-2 outline-none"
              >
                <option value="All">All Categories</option>
                {uniqueCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg px-3 py-2 outline-none"
              >
                <option value="All">All Types</option>
                <option value="Income">Income</option>
                <option value="Expense">Expense</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table Container */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-500 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-6 py-3 font-medium">Sr No</th>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Type</th>
                <th className="px-6 py-3 font-medium">Flat No</th>
                <th className="px-6 py-3 font-medium">Occupant</th>
                <th className="px-6 py-3 font-medium">Category</th>
                <th className="px-6 py-3 font-medium">Description</th>
                
                {viewMode === 'All' && (
                  <>
                    <th className="px-6 py-3 font-medium text-right">Payment Received (Money In)</th>
                    <th className="px-6 py-3 font-medium text-right">Pending Dues (Money Out)</th>
                  </>
                )}
                {viewMode === 'Income' && <th className="px-6 py-3 font-medium text-right">Payment Received (Money In)</th>}
                {viewMode === 'Expense' && <th className="px-6 py-3 font-medium text-right">Pending Dues (Money Out)</th>}
                
                <th className="px-6 py-3 font-medium text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayTransactions.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-8 text-center text-gray-500">
                    No transactions found matching your filters.
                  </td>
                </tr>
              ) : (
                displayTransactions.map((tx, index) => (
                  <tr 
                    key={tx.id} 
                    onClick={() => handleRowClick(tx)}
                    className={clsx(
                      "hover:bg-gray-50 transition-colors",
                      (tx.type === 'Income' && tx.flatId) || tx.type === 'Expense' ? "cursor-pointer" : ""
                    )}
                  >
                    <td className="px-6 py-4 text-gray-500">{index + 1}</td>
                    <td className="px-6 py-4 text-gray-900">{format(parseISO(tx.date), 'dd-MMM-yyyy')}</td>
                    <td className="px-6 py-4">
                      <span className={clsx(
                        "px-2 py-1 rounded text-xs font-medium",
                        tx.type === 'Income' ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                      )}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{tx.flatNumber || '—'}</td>
                    <td className="px-6 py-4 text-gray-700">{tx.occupantName || '—'}</td>
                    <td className="px-6 py-4 text-gray-700">{tx.category}</td>
                    <td className="px-6 py-4 text-gray-700 truncate max-w-xs" title={tx.description}>
                      {tx.description}
                    </td>

                    {viewMode === 'All' && (
                      <>
                        <td className="px-6 py-4 text-right font-medium text-emerald-600">
                          {tx.type === 'Income' ? formatCurrency(tx.amount) : '—'}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-red-600">
                          {tx.type === 'Expense' ? formatCurrency(tx.amount) : '—'}
                        </td>
                      </>
                    )}

                    {viewMode === 'Income' && (
                      <td className="px-6 py-4 text-right font-medium text-emerald-600">
                        {formatCurrency(tx.amount)}
                      </td>
                    )}

                    {viewMode === 'Expense' && (
                      <td className="px-6 py-4 text-right font-medium text-red-600">
                        {formatCurrency(tx.amount)}
                      </td>
                    )}

                    <td className={clsx(
                      "px-6 py-4 text-right font-medium",
                      tx.runningBalance >= 0 ? "text-gray-900" : "text-red-600"
                    )}>
                      {formatCurrency(tx.runningBalance)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Totals */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 shrink-0">
          <div className="flex justify-end gap-12 text-sm">
            {viewMode === 'All' && (
              <>
                <div className="text-right">
                  <p className="text-gray-500 mb-1">Total Payment Received</p>
                  <p className="font-bold text-emerald-600 text-lg">{formatCurrency(summary.totalIncome)}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-500 mb-1">Total Pending Dues</p>
                  <p className="font-bold text-red-600 text-lg">{formatCurrency(summary.totalExpense)}</p>
                </div>
                <div className="text-right pl-6 border-l border-gray-300">
                  <p className="text-gray-500 mb-1">Final Balance</p>
                  <p className={clsx(
                    "font-bold text-lg",
                    summary.netBalance >= 0 ? "text-gray-900" : "text-red-600"
                  )}>
                    {formatCurrency(summary.netBalance)}
                  </p>
                </div>
              </>
            )}
            {viewMode === 'Income' && (
              <div className="text-right">
                <p className="text-gray-500 mb-1">Total Payment Received</p>
                <p className="font-bold text-emerald-600 text-lg">{formatCurrency(summary.totalIncome)}</p>
              </div>
            )}
            {viewMode === 'Expense' && (
              <div className="text-right">
                <p className="text-gray-500 mb-1">Total Pending Dues</p>
                <p className="font-bold text-red-600 text-lg">{formatCurrency(summary.totalExpense)}</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
