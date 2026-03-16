import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useExpense } from '../context/ExpenseContext';
import { useFlats } from '../context/FlatsContext';
import { ExpenseEntry, ExpenseEntryCategory } from '../types';
import { Plus, Search, Calendar, Filter, X, Check, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { format, parseISO } from 'date-fns';

export default function ExpenseManagement() {
  const { entries, isLoading, residentChargeTypes, societyExpenseTypes, addEntry, addExpenseType } = useExpense();
  const { flats } = useFlats();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState<'All' | 'Resident Charges' | 'Society Expenses'>('All');
  
  useEffect(() => {
    if (location.state?.highlightExpenseId) {
      setTimeout(() => {
        const element = document.getElementById(`expense-${location.state.highlightExpenseId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('bg-indigo-50', 'transition-colors', 'duration-1000');
          setTimeout(() => element.classList.remove('bg-indigo-50'), 3000);
        }
      }, 100);
    }
  }, [location.state]);
  
  // Filters
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [categoryFilter, setCategoryFilter] = useState<ExpenseEntryCategory | 'All'>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [flatFilter, setFlatFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const displayEntries = useMemo(() => {
    let filtered = entries;

    if (activeTab === 'Resident Charges') {
      filtered = filtered.filter(e => e.expenseCategory === 'Resident Charge');
    } else if (activeTab === 'Society Expenses') {
      filtered = filtered.filter(e => e.expenseCategory === 'Society Operational Expense');
    }

    if (categoryFilter !== 'All') {
      filtered = filtered.filter(e => e.expenseCategory === categoryFilter);
    }
    if (typeFilter !== 'All') {
      filtered = filtered.filter(e => e.expenseType === typeFilter);
    }
    if (statusFilter !== 'All') {
      filtered = filtered.filter(e => e.status === statusFilter);
    }
    if (flatFilter !== 'All') {
      filtered = filtered.filter(e => {
        if (e.expenseCategory !== 'Resident Charge') return false;
        if (e.linkedScope === 'All Flats') return true;
        if (Array.isArray(e.linkedScope)) {
          return e.linkedScope.includes(flatFilter);
        }
        return false;
      });
    }
    if (dateRange.start) {
      filtered = filtered.filter(e => e.date >= dateRange.start);
    }
    if (dateRange.end) {
      filtered = filtered.filter(e => e.date <= dateRange.end);
    }

    // Sort by date descending
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [entries, activeTab, categoryFilter, typeFilter, statusFilter, flatFilter, dateRange]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getOccupantName = (flatId: string) => {
    const flat = flats.find(f => f.id === flatId);
    if (!flat) return '—';
    return flat.occupancyStatus === 'Tenant Occupied' && flat.tenant ? flat.tenant.name : flat.ownerName;
  };

  const getFlatNumber = (flatId: string) => {
    const flat = flats.find(f => f.id === flatId);
    return flat ? flat.flatNumber : flatId;
  };

  const renderLinkedScope = (entry: ExpenseEntry) => {
    if (entry.expenseCategory === 'Society Operational Expense') {
      return 'Society Level';
    }
    if (entry.linkedScope === 'All Flats') {
      return 'All Flats';
    }
    if (Array.isArray(entry.linkedScope)) {
      if (entry.linkedScope.length <= 2) {
        return entry.linkedScope.map(getFlatNumber).join(', ');
      }
      return `${entry.linkedScope.length} Flats`;
    }
    return '—';
  };

  const renderFlatNumber = (entry: ExpenseEntry) => {
    if (entry.expenseCategory === 'Society Operational Expense') return '—';
    if (entry.linkedScope === 'All Flats') return 'All Flats';
    if (Array.isArray(entry.linkedScope)) {
      return entry.linkedScope.map(getFlatNumber).join(', ');
    }
    return '—';
  };

  const renderOccupant = (entry: ExpenseEntry) => {
    if (entry.expenseCategory === 'Society Operational Expense') return '—';
    if (entry.linkedScope === 'All Flats') return 'Multiple';
    if (Array.isArray(entry.linkedScope)) {
      if (entry.linkedScope.length === 1) {
        return getOccupantName(entry.linkedScope[0]);
      }
      return 'Multiple';
    }
    return '—';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-24">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex bg-gray-100 p-1 rounded-lg w-fit">
          {(['All', 'Resident Charges', 'Society Expenses'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setCategoryFilter('All');
                setTypeFilter('All');
                setFlatFilter('All');
              }}
              className={clsx(
                "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                activeTab === tab 
                  ? "bg-white text-gray-900 shadow-sm" 
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-200"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus size={20} />
          <span>Add Expense / Charge</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-wrap items-center gap-4">
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

        {activeTab === 'All' && (
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as any)}
            className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg px-3 py-2 outline-none"
          >
            <option value="All">All Categories</option>
            <option value="Resident Charge">Resident Charge</option>
            <option value="Society Operational Expense">Society Expense</option>
          </select>
        )}

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg px-3 py-2 outline-none"
        >
          <option value="All">All Types</option>
          {(activeTab === 'Resident Charges' || categoryFilter === 'Resident Charge' ? residentChargeTypes : 
            activeTab === 'Society Expenses' || categoryFilter === 'Society Operational Expense' ? societyExpenseTypes : 
            [...residentChargeTypes, ...societyExpenseTypes]).map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        {(activeTab === 'Resident Charges' || categoryFilter === 'Resident Charge') && (
          <select
            value={flatFilter}
            onChange={(e) => setFlatFilter(e.target.value)}
            className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg px-3 py-2 outline-none"
          >
            <option value="All">All Flats</option>
            {flats.map(f => (
              <option key={f.id} value={f.id}>{f.flatNumber}</option>
            ))}
          </select>
        )}

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg px-3 py-2 outline-none"
        >
          <option value="All">All Statuses</option>
          <option value="Recorded">Recorded</option>
          <option value="Billed">Billed</option>
          <option value="Settled">Settled</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 font-medium">Sr No</th>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Flat Number</th>
                <th className="px-6 py-3 font-medium">Current Occupant</th>
                <th className="px-6 py-3 font-medium">Expense Category</th>
                <th className="px-6 py-3 font-medium">Expense Type</th>
                <th className="px-6 py-3 font-medium">Description</th>
                <th className="px-6 py-3 font-medium">Linked Scope</th>
                <th className="px-6 py-3 font-medium text-right">Amount</th>
                <th className="px-6 py-3 font-medium text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayEntries.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-8 text-center text-gray-500">
                    No entries found matching your filters.
                  </td>
                </tr>
              ) : (
                displayEntries.map((entry, index) => (
                  <tr key={entry.id} id={`expense-${entry.id}`} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-gray-500">{index + 1}</td>
                    <td className="px-6 py-4 text-gray-900">{format(parseISO(entry.date), 'dd-MMM-yyyy')}</td>
                    <td className="px-6 py-4 text-gray-700">{renderFlatNumber(entry)}</td>
                    <td className="px-6 py-4 text-gray-700">{renderOccupant(entry)}</td>
                    <td className="px-6 py-4">
                      <span className={clsx(
                        "px-2 py-1 rounded text-xs font-medium",
                        entry.expenseCategory === 'Resident Charge' ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"
                      )}>
                        {entry.expenseCategory}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{entry.expenseType}</td>
                    <td className="px-6 py-4 text-gray-700 truncate max-w-xs" title={entry.description}>
                      {entry.description}
                    </td>
                    <td className="px-6 py-4 text-gray-700">{renderLinkedScope(entry)}</td>
                    <td className="px-6 py-4 text-right font-medium text-gray-900">
                      {formatCurrency(entry.amount)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={clsx(
                        "px-2 py-1 rounded text-xs font-medium",
                        entry.status === 'Recorded' ? "bg-gray-100 text-gray-800" :
                        entry.status === 'Billed' ? "bg-amber-100 text-amber-800" :
                        "bg-emerald-100 text-emerald-800"
                      )}>
                        {entry.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isAddModalOpen && (
        <AddEntryModal 
          onClose={() => setIsAddModalOpen(false)} 
          flats={flats}
          residentChargeTypes={residentChargeTypes}
          societyExpenseTypes={societyExpenseTypes}
          onAddEntry={addEntry}
          onAddExpenseType={addExpenseType}
        />
      )}
    </div>
  );
}

function AddEntryModal({ onClose, flats, residentChargeTypes, societyExpenseTypes, onAddEntry, onAddExpenseType }: any) {
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState<ExpenseEntryCategory | ''>('');
  const [type, setType] = useState('');
  const [isCreatingNewType, setIsCreatingNewType] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  
  const [linkOption, setLinkOption] = useState<'Specific' | 'All'>('Specific');
  const [selectedFlats, setSelectedFlats] = useState<string[]>([]);
  const [flatSearch, setFlatSearch] = useState('');

  const handleNext = () => {
    if (step === 1 && category) setStep(2);
    else if (step === 2 && (type || (isCreatingNewType && newTypeName))) {
      if (isCreatingNewType && newTypeName) {
        onAddExpenseType(category, newTypeName);
        setType(newTypeName);
        setIsCreatingNewType(false);
      }
      setStep(3);
    }
    else if (step === 3 && date && description && amount) {
      if (category === 'Society Operational Expense') {
        handleSave();
      } else {
        setStep(4);
      }
    }
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    await onAddEntry({
      date: new Date(date).toISOString(),
      expenseCategory: category as ExpenseEntryCategory,
      expenseType: type,
      description,
      amount: parseFloat(amount),
      linkedScope: category === 'Society Operational Expense' ? 'Society Level' : (linkOption === 'All' ? 'All Flats' : selectedFlats),
    });
    setIsSubmitting(false);
    onClose();
  };

  const toggleFlatSelection = (flatId: string) => {
    setSelectedFlats(prev => 
      prev.includes(flatId) ? prev.filter(id => id !== flatId) : [...prev, flatId]
    );
  };

  const filteredFlats = flats.filter((f: any) => 
    f.flatNumber.toLowerCase().includes(flatSearch.toLowerCase()) || 
    f.block.toLowerCase().includes(flatSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
          <h2 className="text-xl font-semibold text-gray-900">Add Expense / Charge</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8 relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-100 -z-10"></div>
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-indigo-600 -z-10 transition-all duration-300" style={{ width: `${((step - 1) / (category === 'Society Operational Expense' ? 2 : 3)) * 100}%` }}></div>
            
            {[1, 2, 3, 4].filter(s => category !== 'Society Operational Expense' || s <= 3).map(s => (
              <div key={s} className={clsx(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                step >= s ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-500"
              )}>
                {step > s ? <Check size={16} /> : s}
              </div>
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Select Expense Category</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => setCategory('Resident Charge')}
                  className={clsx(
                    "p-4 rounded-xl border-2 text-left transition-all",
                    category === 'Resident Charge' ? "border-indigo-600 bg-indigo-50" : "border-gray-200 hover:border-indigo-200"
                  )}
                >
                  <div className="font-semibold text-gray-900 mb-1">Resident Charge</div>
                  <div className="text-sm text-gray-500">Recoverable charges assigned to one, multiple, or all flats.</div>
                </button>
                <button
                  onClick={() => setCategory('Society Operational Expense')}
                  className={clsx(
                    "p-4 rounded-xl border-2 text-left transition-all",
                    category === 'Society Operational Expense' ? "border-indigo-600 bg-indigo-50" : "border-gray-200 hover:border-indigo-200"
                  )}
                >
                  <div className="font-semibold text-gray-900 mb-1">Society Operational Expense</div>
                  <div className="text-sm text-gray-500">Non-recoverable general expenses for running the society.</div>
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Select Expense Type</h3>
              
              {!isCreatingNewType ? (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {(category === 'Resident Charge' ? residentChargeTypes : societyExpenseTypes).map((t: string) => (
                      <button
                        key={t}
                        onClick={() => setType(t)}
                        className={clsx(
                          "p-3 rounded-lg border text-sm font-medium transition-all text-center",
                          type === t ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-gray-200 text-gray-700 hover:border-indigo-200"
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  <div className="mt-6">
                    <button
                      onClick={() => setIsCreatingNewType(true)}
                      className="text-indigo-600 text-sm font-medium hover:text-indigo-700 flex items-center gap-1"
                    >
                      <Plus size={16} /> Create New Type
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type Title</label>
                    <input
                      type="text"
                      value={newTypeName}
                      onChange={(e) => setNewTypeName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      placeholder="e.g., Festival Decoration"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setIsCreatingNewType(false)}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Enter Expense Details</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  placeholder="Short narrative explaining the expense..."
                  rows={3}
                />
              </div>
            </div>
          )}

          {step === 4 && category === 'Resident Charge' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Flat Linkage</h3>
              
              <div className="flex gap-4 mb-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={linkOption === 'Specific'}
                    onChange={() => setLinkOption('Specific')}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Specific Flat(s)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={linkOption === 'All'}
                    onChange={() => setLinkOption('All')}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Apply to All Flats</span>
                </label>
              </div>

              {linkOption === 'Specific' && (
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder="Search flats..."
                      value={flatSearch}
                      onChange={(e) => setFlatSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-48 overflow-y-auto p-1">
                    {filteredFlats.map((f: any) => (
                      <button
                        key={f.id}
                        onClick={() => toggleFlatSelection(f.id)}
                        className={clsx(
                          "py-2 px-1 rounded-md text-sm font-medium border transition-colors",
                          selectedFlats.includes(f.id) 
                            ? "bg-indigo-100 border-indigo-300 text-indigo-800" 
                            : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                        )}
                      >
                        {f.flatNumber}
                      </button>
                    ))}
                  </div>
                  
                  {selectedFlats.length > 0 && (
                    <div className="bg-indigo-50 p-3 rounded-lg text-sm text-indigo-800">
                      <strong>{selectedFlats.length}</strong> flat(s) selected
                    </div>
                  )}
                </div>
              )}
              
              {linkOption === 'All' && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg text-amber-800 text-sm">
                  This charge will be applied to all <strong>{flats.length}</strong> active flats in the society.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-between shrink-0">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-6 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
            >
              Back
            </button>
          ) : <div></div>}
          
          <button
            onClick={step === (category === 'Society Operational Expense' ? 3 : 4) ? handleSave : handleNext}
            disabled={
              (step === 1 && !category) ||
              (step === 2 && !type && !isCreatingNewType) ||
              (step === 2 && isCreatingNewType && !newTypeName) ||
              (step === 3 && (!date || !description || !amount)) ||
              (step === 4 && linkOption === 'Specific' && selectedFlats.length === 0) ||
              isSubmitting
            }
            className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            {step === (category === 'Society Operational Expense' ? 3 : 4) ? 'Save Entry' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
