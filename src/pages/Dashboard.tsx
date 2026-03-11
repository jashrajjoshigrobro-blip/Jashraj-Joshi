import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFlats } from '../context/FlatsContext';
import { useLedger } from '../context/LedgerContext';
import { useExpense } from '../context/ExpenseContext';
import { useParking } from '../context/ParkingContext';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval, subMonths, differenceInDays, isSameMonth } from 'date-fns';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, FunnelChart, Funnel, LabelList
} from 'recharts';
import { Filter, Calendar, Building2, IndianRupee, TrendingUp, TrendingDown, Users, Car, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import clsx from 'clsx';

const COLORS = ['#10B981', '#F43F5E', '#F59E0B', '#3B82F6', '#8B5CF6', '#14B8A6', '#F97316'];

export default function Dashboard() {
  const navigate = useNavigate();
  const { flats } = useFlats();
  const { transactions } = useLedger();
  const { entries } = useExpense();
  const { parkingSlots } = useParking();

  // Global Filters
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [financialYear, setFinancialYear] = useState('All');
  const [blockFilter, setBlockFilter] = useState('All');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('All');
  const [chargeTypeFilter, setChargeTypeFilter] = useState('All');

  // Helper: Get current month interval if no date range is set
  const today = new Date();
  const currentMonthStart = startOfMonth(today);
  const currentMonthEnd = endOfMonth(today);

  // Filtered Data
  const getFYDates = (fy: string) => {
    if (fy === 'All') return null;
    const startYear = parseInt(fy.split('-')[0]);
    return {
      start: new Date(startYear, 3, 1), // April 1st
      end: new Date(startYear + 1, 2, 31, 23, 59, 59) // March 31st
    };
  };

  const filteredFlats = useMemo(() => {
    if (blockFilter === 'All') return flats;
    return flats.filter(f => f.block === blockFilter);
  }, [flats, blockFilter]);

  const filteredTransactions = useMemo(() => {
    const fyDates = getFYDates(financialYear);
    return transactions.filter(tx => {
      const txDate = parseISO(tx.date);
      if (dateRange.start && dateRange.end) {
        if (!isWithinInterval(txDate, { start: parseISO(dateRange.start), end: parseISO(dateRange.end) })) return false;
      } else if (fyDates) {
        if (!isWithinInterval(txDate, { start: fyDates.start, end: fyDates.end })) return false;
      }
      if (blockFilter !== 'All' && tx.flatId) {
        const flat = flats.find(f => f.id === tx.flatId);
        if (flat && flat.block !== blockFilter) return false;
      }
      return true;
    });
  }, [transactions, dateRange, financialYear, blockFilter, flats]);

  const filteredExpenses = useMemo(() => {
    const fyDates = getFYDates(financialYear);
    return entries.filter(e => {
      const eDate = parseISO(e.date);
      if (dateRange.start && dateRange.end) {
        if (!isWithinInterval(eDate, { start: parseISO(dateRange.start), end: parseISO(dateRange.end) })) return false;
      } else if (fyDates) {
        if (!isWithinInterval(eDate, { start: fyDates.start, end: fyDates.end })) return false;
      }
      if (expenseCategoryFilter !== 'All' && e.expenseCategory !== expenseCategoryFilter) return false;
      if (chargeTypeFilter !== 'All' && e.expenseType !== chargeTypeFilter) return false;
      return true;
    });
  }, [entries, dateRange, financialYear, expenseCategoryFilter, chargeTypeFilter]);

  // --- ZONE 1: FINANCIAL HEALTH SNAPSHOT ---
  const currentMonthTransactions = filteredTransactions.filter(tx => isSameMonth(parseISO(tx.date), today));
  const totalIncomeMonth = currentMonthTransactions.filter(tx => tx.type === 'Income').reduce((sum, tx) => sum + tx.amount, 0);
  const totalExpenseMonth = currentMonthTransactions.filter(tx => tx.type === 'Expense').reduce((sum, tx) => sum + tx.amount, 0);
  const netPosition = totalIncomeMonth - totalExpenseMonth;
  
  const currentBalance = filteredTransactions.reduce((sum, tx) => tx.type === 'Income' ? sum + tx.amount : sum - tx.amount, 0);
  
  const totalOutstandingDues = filteredFlats.reduce((sum, flat) => {
    return sum + flat.pendingDues.reduce((dSum, due) => dSum + due.amount, 0);
  }, 0);

  const totalBilledMonth = filteredFlats.reduce((sum, flat) => {
    return sum + flat.pendingDues.filter(d => isSameMonth(parseISO(d.dueDate), today)).reduce((dSum, d) => dSum + d.amount, 0);
  }, 0);
  const collectionRate = totalBilledMonth > 0 ? Math.round((totalIncomeMonth / totalBilledMonth) * 100) : 0;

  // Graph 1 & 2 Data: Income vs Expense Trend & Surplus/Deficit
  const monthlyTrendData = useMemo(() => {
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(today, i);
      const monthName = format(monthDate, 'MMM yyyy');
      const monthTxs = filteredTransactions.filter(tx => isSameMonth(parseISO(tx.date), monthDate));
      const inc = monthTxs.filter(tx => tx.type === 'Income').reduce((sum, tx) => sum + tx.amount, 0);
      const exp = monthTxs.filter(tx => tx.type === 'Expense').reduce((sum, tx) => sum + tx.amount, 0);
      data.push({
        name: monthName,
        Income: inc,
        Expense: exp,
        Surplus: inc - exp
      });
    }
    return data;
  }, [filteredTransactions]);

  // --- ZONE 2: COLLECTION PERFORMANCE ---
  const pendingCollection = totalBilledMonth - totalIncomeMonth; // Simplified
  let fullyPaidFlats = 0;
  let partiallyPaidFlats = 0;
  let unpaidFlats = 0;

  filteredFlats.forEach(flat => {
    const outstanding = flat.pendingDues.reduce((sum, due) => sum + due.amount, 0);
    if (outstanding === 0) fullyPaidFlats++;
    else if (flat.payments.length > 0) partiallyPaidFlats++;
    else unpaidFlats++;
  });

  const funnelData = [
    { name: 'Total Flats', value: filteredFlats.length, fill: '#3B82F6' },
    { name: 'Billed', value: filteredFlats.filter(f => f.pendingDues.length > 0 || f.payments.length > 0).length, fill: '#8B5CF6' },
    { name: 'Paid', value: fullyPaidFlats, fill: '#10B981' },
    { name: 'Pending', value: partiallyPaidFlats, fill: '#F59E0B' },
    { name: 'Overdue', value: filteredFlats.filter(f => f.pendingDues.some(d => d.status === 'Overdue')).length, fill: '#F43F5E' }
  ];

  const agingBuckets = { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 };
  filteredFlats.forEach(flat => {
    flat.pendingDues.forEach(due => {
      const days = differenceInDays(today, parseISO(due.dueDate));
      if (days <= 30) agingBuckets['0-30'] += due.amount;
      else if (days <= 60) agingBuckets['31-60'] += due.amount;
      else if (days <= 90) agingBuckets['61-90'] += due.amount;
      else agingBuckets['90+'] += due.amount;
    });
  });
  const agingData = Object.keys(agingBuckets).map(k => ({ name: k, Amount: agingBuckets[k as keyof typeof agingBuckets] }));

  // --- ZONE 3: EXPENSE ANALYTICS ---
  const operationalExpenses = filteredExpenses.filter(e => e.expenseCategory === 'Society Operational Expense');
  const totalOpExpenseMonth = operationalExpenses.filter(e => isSameMonth(parseISO(e.date), today)).reduce((sum, e) => sum + e.amount, 0);
  const avgMonthlyExpense = operationalExpenses.reduce((sum, e) => sum + e.amount, 0) / 6 || 0; // Simplified avg
  
  const expenseByCategory = operationalExpenses.reduce((acc, e) => {
    acc[e.expenseType] = (acc[e.expenseType] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);
  
  const highestExpenseCategory = Object.keys(expenseByCategory).sort((a, b) => expenseByCategory[b] - expenseByCategory[a])[0] || 'N/A';
  const expensePieData = Object.keys(expenseByCategory).map(k => ({ name: k, value: expenseByCategory[k] }));

  // --- ZONE 4: FLAT & RESIDENT STATUS ---
  const ownerOccupied = filteredFlats.filter(f => f.occupancyStatus === 'Owner Occupied').length;
  const tenantOccupied = filteredFlats.filter(f => f.occupancyStatus === 'Tenant Occupied').length;
  const vacant = filteredFlats.filter(f => f.occupancyStatus === 'Vacant').length;
  
  const flatsNoDues = filteredFlats.filter(f => f.pendingDues.reduce((sum, d) => sum + d.amount, 0) === 0).length;
  const flatsPendingDues = filteredFlats.filter(f => f.pendingDues.some(d => d.status === 'Pending')).length;
  const flatsOverdue = filteredFlats.filter(f => f.pendingDues.some(d => d.status === 'Overdue')).length;
  
  const occupancyData = [
    { name: 'Owner', value: ownerOccupied },
    { name: 'Tenant', value: tenantOccupied },
    { name: 'Vacant', value: vacant }
  ];

  const blockStatusData = useMemo(() => {
    const blocks = Array.from(new Set(flats.map(f => f.block)));
    return blocks.map(block => {
      const blockFlats = flats.filter(f => f.block === block);
      let paid = 0, pending = 0, overdue = 0;
      blockFlats.forEach(f => {
        const hasOverdue = f.pendingDues.some(d => d.status === 'Overdue');
        const hasPending = f.pendingDues.length > 0;
        if (hasOverdue) overdue++;
        else if (hasPending) pending++;
        else paid++;
      });
      return { name: block, Paid: paid, Pending: pending, Overdue: overdue };
    });
  }, [flats]);

  const topDefaulters = [...filteredFlats]
    .map(f => ({
      flatNumber: f.flatNumber,
      ownerName: f.ownerName,
      amount: f.pendingDues.reduce((sum, d) => sum + d.amount, 0),
      monthsOverdue: f.pendingDues.filter(d => d.status === 'Overdue').length
    }))
    .filter(f => f.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  // --- ZONE 5: BILLING & CHARGE INTELLIGENCE ---
  const residentCharges = filteredExpenses.filter(e => e.expenseCategory === 'Resident Charge');
  const chargesMonth = residentCharges.filter(e => isSameMonth(parseISO(e.date), today));
  const totalChargeAmount = chargesMonth.reduce((sum, e) => sum + e.amount, 0);
  const chargesAllFlats = residentCharges.filter(e => e.linkedScope === 'All Flats').length;
  const chargesSpecific = residentCharges.filter(e => Array.isArray(e.linkedScope)).length;

  const chargeTrendData = useMemo(() => {
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(today, i);
      const monthName = format(monthDate, 'MMM yyyy');
      const count = residentCharges.filter(e => isSameMonth(parseISO(e.date), monthDate)).length;
      data.push({ name: monthName, Charges: count });
    }
    return data;
  }, [residentCharges]);

  const paymentModes = filteredFlats.flatMap(f => f.payments).reduce((acc, p) => {
    acc[p.mode] = (acc[p.mode] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const paymentModeData = Object.keys(paymentModes).map(k => ({ name: k, value: paymentModes[k] }));
  const mostUsedPaymentMode = Object.keys(paymentModes).sort((a, b) => paymentModes[b] - paymentModes[a])[0] || 'N/A';

  const allPayments = filteredFlats.flatMap(f => f.payments);
  const paymentsToday = allPayments.filter(p => p.date.startsWith(format(today, 'yyyy-MM-dd'))).length;
  const paymentsMonth = allPayments.filter(p => isSameMonth(parseISO(p.date), today)).length;
  const avgPaymentValue = allPayments.length > 0 ? allPayments.reduce((sum, p) => sum + p.amount, 0) / allPayments.length : 0;

  // --- ZONE 6: PARKING UTILIZATION ---
  const totalSlots = parkingSlots.length;
  const allocatedSlots = parkingSlots.filter(s => s.status === 'Allocated').length;
  const availableSlots = parkingSlots.filter(s => s.status === 'Available').length;
  const reservedSlots = parkingSlots.filter(s => s.status === 'Reserved').length;
  const utilizationPercent = totalSlots > 0 ? Math.round((allocatedSlots / totalSlots) * 100) : 0;
  const gaugeData = [
    { name: 'Allocated', value: allocatedSlots, fill: '#3B82F6' },
    { name: 'Available', value: availableSlots + reservedSlots, fill: '#E5E7EB' }
  ];
  
  const parkingZoneData = useMemo(() => {
    const zones = Array.from(new Set(parkingSlots.map(s => s.zone)));
    return zones.map(zone => {
      const zoneSlots = parkingSlots.filter(s => s.zone === zone);
      return {
        name: zone,
        Allocated: zoneSlots.filter(s => s.status === 'Allocated').length,
        Available: zoneSlots.filter(s => s.status === 'Available').length
      };
    });
  }, [parkingSlots]);

  const formatCurrencyValue = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-24">
      {/* GLOBAL FILTER BAR */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-wrap gap-4 items-center sticky top-0 z-10">
        <div className="flex items-center gap-2 text-gray-500 font-medium mr-2">
          <Filter size={20} /> Filters
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-gray-400" />
          <input type="date" className="border border-gray-300 rounded-md px-2 py-1 text-sm" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} />
          <span className="text-gray-400">to</span>
          <input type="date" className="border border-gray-300 rounded-md px-2 py-1 text-sm" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} />
        </div>
        <select className="border border-gray-300 rounded-md px-3 py-1.5 text-sm" value={financialYear} onChange={e => setFinancialYear(e.target.value)}>
          <option value="All">All Financial Years</option>
          <option value="2025-2026">2025-2026</option>
          <option value="2024-2025">2024-2025</option>
        </select>
        <select className="border border-gray-300 rounded-md px-3 py-1.5 text-sm" value={blockFilter} onChange={e => setBlockFilter(e.target.value)}>
          <option value="All">All Blocks</option>
          {Array.from(new Set(flats.map(f => f.block))).map(b => <option key={b} value={b}>Block {b}</option>)}
        </select>
        <select className="border border-gray-300 rounded-md px-3 py-1.5 text-sm" value={expenseCategoryFilter} onChange={e => setExpenseCategoryFilter(e.target.value)}>
          <option value="All">All Expense Categories</option>
          <option value="Resident Charge">Resident Charge</option>
          <option value="Society Operational Expense">Society Expense</option>
        </select>
        <select className="border border-gray-300 rounded-md px-3 py-1.5 text-sm" value={chargeTypeFilter} onChange={e => setChargeTypeFilter(e.target.value)}>
          <option value="All">All Charge Types</option>
          {Array.from(new Set(entries.map(e => e.expenseType))).map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* ZONE 1: FINANCIAL HEALTH SNAPSHOT */}
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <IndianRupee size={20} className="text-indigo-600" /> Financial Health Snapshot
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm cursor-pointer hover:border-indigo-300 transition-colors" onClick={() => navigate('/ledger')}>
            <p className="text-sm text-gray-500 mb-1">Income (Month)</p>
            <p className="text-xl font-bold text-emerald-600">{formatCurrencyValue(totalIncomeMonth)}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm cursor-pointer hover:border-indigo-300 transition-colors" onClick={() => navigate('/ledger')}>
            <p className="text-sm text-gray-500 mb-1">Expense (Month)</p>
            <p className="text-xl font-bold text-red-600">{formatCurrencyValue(totalExpenseMonth)}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm cursor-pointer hover:border-indigo-300 transition-colors" onClick={() => navigate('/ledger')}>
            <p className="text-sm text-gray-500 mb-1">Net Position</p>
            <p className={clsx("text-xl font-bold", netPosition >= 0 ? "text-emerald-600" : "text-red-600")}>{formatCurrencyValue(netPosition)}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm cursor-pointer hover:border-indigo-300 transition-colors" onClick={() => navigate('/ledger')}>
            <p className="text-sm text-gray-500 mb-1">Current Balance</p>
            <p className="text-xl font-bold text-indigo-600">{formatCurrencyValue(currentBalance)}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm cursor-pointer hover:border-indigo-300 transition-colors" onClick={() => navigate('/flats')}>
            <p className="text-sm text-gray-500 mb-1">Total Outstanding</p>
            <p className="text-xl font-bold text-amber-600">{formatCurrencyValue(totalOutstandingDues)}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Collection Rate</p>
            <p className="text-xl font-bold text-gray-900">{collectionRate}%</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Income vs Expense Trend</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#6B7280'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#6B7280'}} tickFormatter={(val) => `₹${val/1000}k`} />
                  <Tooltip formatter={(value: number) => formatCurrencyValue(value)} />
                  <Legend />
                  <Line type="monotone" dataKey="Income" stroke="#10B981" strokeWidth={3} dot={{r: 4}} />
                  <Line type="monotone" dataKey="Expense" stroke="#F43F5E" strokeWidth={3} dot={{r: 4}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Surplus / Deficit Trend</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#6B7280'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#6B7280'}} tickFormatter={(val) => `₹${val/1000}k`} />
                  <Tooltip formatter={(value: number) => formatCurrencyValue(value)} />
                  <Area type="monotone" dataKey="Surplus" stroke="#3B82F6" fill="#DBEAFE" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      {/* ZONE 2: COLLECTION PERFORMANCE */}
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp size={20} className="text-emerald-600" /> Collection Performance
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Billed (Month)</p>
            <p className="text-lg font-bold text-gray-900">{formatCurrencyValue(totalBilledMonth)}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Collected (Month)</p>
            <p className="text-lg font-bold text-emerald-600">{formatCurrencyValue(totalIncomeMonth)}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Pending</p>
            <p className="text-lg font-bold text-amber-600">{formatCurrencyValue(pendingCollection > 0 ? pendingCollection : 0)}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm cursor-pointer hover:border-indigo-300" onClick={() => navigate('/flats')}>
            <p className="text-sm text-gray-500 mb-1">Fully Paid Flats</p>
            <p className="text-lg font-bold text-emerald-600">{fullyPaidFlats}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm cursor-pointer hover:border-indigo-300" onClick={() => navigate('/flats')}>
            <p className="text-sm text-gray-500 mb-1">Partially Paid</p>
            <p className="text-lg font-bold text-amber-600">{partiallyPaidFlats}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm cursor-pointer hover:border-indigo-300" onClick={() => navigate('/flats')}>
            <p className="text-sm text-gray-500 mb-1">Unpaid Flats</p>
            <p className="text-lg font-bold text-red-600">{unpaidFlats}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Collection Funnel</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <FunnelChart>
                  <Tooltip />
                  <Funnel dataKey="value" data={funnelData} isAnimationActive>
                    <LabelList position="right" fill="#000" stroke="none" dataKey="name" />
                  </Funnel>
                </FunnelChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm lg:col-span-2">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Outstanding Aging</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={agingData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#6B7280'}} tickFormatter={(val) => `₹${val/1000}k`} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#6B7280'}} />
                  <Tooltip formatter={(value: number) => formatCurrencyValue(value)} cursor={{fill: '#F3F4F6'}} />
                  <Bar dataKey="Amount" fill="#F59E0B" radius={[0, 4, 4, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      {/* ZONE 3: EXPENSE ANALYTICS */}
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingDown size={20} className="text-red-600" /> Expense Analytics
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm cursor-pointer hover:border-indigo-300" onClick={() => navigate('/expenses')}>
            <p className="text-sm text-gray-500 mb-1">Op. Expense (Month)</p>
            <p className="text-lg font-bold text-red-600">{formatCurrencyValue(totalOpExpenseMonth)}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Avg Monthly Expense</p>
            <p className="text-lg font-bold text-gray-900">{formatCurrencyValue(avgMonthlyExpense)}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Highest Category</p>
            <p className="text-lg font-bold text-gray-900 truncate">{highestExpenseCategory}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm cursor-pointer hover:border-indigo-300" onClick={() => navigate('/expenses')}>
            <p className="text-sm text-gray-500 mb-1">Expense Entries</p>
            <p className="text-lg font-bold text-gray-900">{operationalExpenses.length}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Expense Breakdown</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={expensePieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {expensePieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrencyValue(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm lg:col-span-2">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Monthly Expense Trend</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#6B7280'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#6B7280'}} tickFormatter={(val) => `₹${val/1000}k`} />
                  <Tooltip formatter={(value: number) => formatCurrencyValue(value)} cursor={{fill: '#F3F4F6'}} />
                  <Bar dataKey="Expense" fill="#F43F5E" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      {/* ZONE 4: FLAT & RESIDENT STATUS */}
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Building2 size={20} className="text-indigo-600" /> Flat & Resident Status
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm cursor-pointer hover:border-indigo-300" onClick={() => navigate('/flats')}>
            <p className="text-sm text-gray-500 mb-1">Total Flats</p>
            <p className="text-xl font-bold text-gray-900">{filteredFlats.length}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Owner Occupied</p>
            <p className="text-xl font-bold text-indigo-600">{ownerOccupied}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Tenant Occupied</p>
            <p className="text-xl font-bold text-emerald-600">{tenantOccupied}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Vacant</p>
            <p className="text-xl font-bold text-amber-600">{vacant}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm cursor-pointer hover:border-indigo-300" onClick={() => navigate('/flats')}>
            <p className="text-sm text-gray-500 mb-1">Flats with No Dues</p>
            <p className="text-xl font-bold text-emerald-600">{flatsNoDues}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm cursor-pointer hover:border-indigo-300" onClick={() => navigate('/flats')}>
            <p className="text-sm text-gray-500 mb-1">Flats with Pending Dues</p>
            <p className="text-xl font-bold text-amber-600">{flatsPendingDues}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm cursor-pointer hover:border-indigo-300" onClick={() => navigate('/flats')}>
            <p className="text-sm text-gray-500 mb-1">Flats with Overdue</p>
            <p className="text-xl font-bold text-red-600">{flatsOverdue}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Occupancy Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={occupancyData} outerRadius={80} dataKey="value" label>
                    {occupancyData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Payment Status by Block</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={blockStatusData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#6B7280'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#6B7280'}} />
                  <Tooltip cursor={{fill: '#F3F4F6'}} />
                  <Legend />
                  <Bar dataKey="Paid" stackId="a" fill="#10B981" />
                  <Bar dataKey="Pending" stackId="a" fill="#F59E0B" />
                  <Bar dataKey="Overdue" stackId="a" fill="#F43F5E" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Top Defaulters</h3>
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 font-medium">Flat</th>
                    <th className="px-3 py-2 font-medium">Owner</th>
                    <th className="px-3 py-2 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {topDefaulters.map((d, i) => (
                    <tr key={i} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate('/flats')}>
                      <td className="px-3 py-2 font-medium text-gray-900">{d.flatNumber}</td>
                      <td className="px-3 py-2 text-gray-600 truncate max-w-[100px]">{d.ownerName}</td>
                      <td className="px-3 py-2 text-right text-red-600 font-medium">{formatCurrencyValue(d.amount)}</td>
                    </tr>
                  ))}
                  {topDefaulters.length === 0 && (
                    <tr><td colSpan={3} className="px-3 py-4 text-center text-gray-500">No defaulters found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ZONE 5 & 6 CONTAINER */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ZONE 5: BILLING & CHARGE INTELLIGENCE */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <IndianRupee size={20} className="text-indigo-600" /> Billing & Charges
          </h2>
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">Charges (Month)</p>
                <p className="text-xl font-bold text-gray-900">{chargesMonth.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Amount</p>
                <p className="text-xl font-bold text-indigo-600">{formatCurrencyValue(totalChargeAmount)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">All Flats</p>
                <p className="text-xl font-bold text-gray-900">{chargesAllFlats}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Specific Flats</p>
                <p className="text-xl font-bold text-gray-900">{chargesSpecific}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 pt-6 border-t border-gray-100">
              <div>
                <p className="text-sm text-gray-500 mb-1">Payments Today</p>
                <p className="text-xl font-bold text-emerald-600">{paymentsToday}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Payments (Month)</p>
                <p className="text-xl font-bold text-emerald-600">{paymentsMonth}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Avg Payment</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrencyValue(avgPaymentValue)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Top Mode</p>
                <p className="text-xl font-bold text-gray-900">{mostUsedPaymentMode}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Charge Volume Trend</h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chargeTrendData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#6B7280'}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#6B7280'}} />
                      <Tooltip />
                      <Line type="monotone" dataKey="Charges" stroke="#8B5CF6" strokeWidth={3} dot={{r: 4}} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Payment Mode Distribution</h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={paymentModeData} innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                        {paymentModeData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ZONE 6: PARKING UTILIZATION */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Car size={20} className="text-indigo-600" /> Parking Utilization
          </h2>
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-6 cursor-pointer hover:border-indigo-300" onClick={() => navigate('/parking')}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Slots</p>
                <p className="text-xl font-bold text-gray-900">{totalSlots}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Allocated</p>
                <p className="text-xl font-bold text-indigo-600">{allocatedSlots}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Available</p>
                <p className="text-xl font-bold text-emerald-600">{availableSlots}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Reserved</p>
                <p className="text-xl font-bold text-amber-600">{reservedSlots}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-4 text-center">Utilization</h3>
                <div className="h-40 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={gaugeData}
                        cx="50%"
                        cy="100%"
                        startAngle={180}
                        endAngle={0}
                        innerRadius={60}
                        outerRadius={80}
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
                  <div className="absolute bottom-0 left-0 right-0 text-center">
                    <span className="text-2xl font-bold text-gray-900">{utilizationPercent}%</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Allocation by Zone</h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={parkingZoneData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#6B7280'}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#6B7280'}} />
                      <Tooltip cursor={{fill: '#F3F4F6'}} />
                      <Legend />
                      <Bar dataKey="Allocated" stackId="a" fill="#3B82F6" barSize={30} />
                      <Bar dataKey="Available" stackId="a" fill="#E5E7EB" barSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
