import React, { useState } from 'react';
import { FileText, TrendingDown, AlertTriangle, Calendar, Users, IndianRupee, ArrowLeft, Loader2 } from 'lucide-react';
import { useFlats } from '../../context/FlatsContext';
import { useLedger } from '../../context/LedgerContext';
import { useExpense } from '../../context/ExpenseContext';

import MonthlyPnL from './MonthlyPnL';
import ExpenseAnalysis from './ExpenseAnalysis';
import DefaulterReport from './DefaulterReport';
import AnnualSummary from './AnnualSummary';
import PaymentRegister from './PaymentRegister';
import IncomeRegister from './IncomeRegister';

type ReportType = 'pnl' | 'expense' | 'defaulter' | 'annual' | 'payments' | 'income' | null;

export default function Reports() {
  const [activeReport, setActiveReport] = useState<ReportType>(null);
  const { isLoading: isFlatsLoading } = useFlats();
  const { isLoading: isLedgerLoading } = useLedger();
  const { isLoading: isExpenseLoading } = useExpense();

  const isLoading = isFlatsLoading || isLedgerLoading || isExpenseLoading;

  const reports = [
    {
      id: 'pnl',
      title: 'Monthly Profit & Loss Statement',
      description: 'Measure monthly financial performance with income vs expense comparison.',
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      id: 'expense',
      title: 'Expense Category Analysis',
      description: 'Understand spending distribution and compare monthly expenses.',
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      id: 'defaulter',
      title: 'Defaulter Report',
      description: 'Identify residents with unpaid dues and track overdue months.',
      icon: AlertTriangle,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
    },
    {
      id: 'annual',
      title: 'Annual Financial Summary',
      description: 'Yearly financial overview for governance and audit purposes.',
      icon: Calendar,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
    },
    {
      id: 'payments',
      title: 'Monthly Resident Payment Register',
      description: 'Track all payments received from residents with detailed filtering.',
      icon: Users,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
    },
    {
      id: 'income',
      title: 'Income Summary Register',
      description: 'Comprehensive record of all income sources and trends.',
      icon: IndianRupee,
      color: 'text-teal-600',
      bgColor: 'bg-teal-100',
    },
  ];

  const renderActiveReport = () => {
    switch (activeReport) {
      case 'pnl': return <MonthlyPnL />;
      case 'expense': return <ExpenseAnalysis />;
      case 'defaulter': return <DefaulterReport />;
      case 'annual': return <AnnualSummary />;
      case 'payments': return <PaymentRegister />;
      case 'income': return <IncomeRegister />;
      default: return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (activeReport) {
    const reportDetails = reports.find(r => r.id === activeReport);
    return (
      <div className="max-w-7xl mx-auto space-y-6 pb-24">
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={() => setActiveReport(null)}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-600"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{reportDetails?.title}</h1>
            <p className="text-sm text-gray-500">{reportDetails?.description}</p>
          </div>
        </div>
        
        {renderActiveReport()}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-24">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Reports & Analytics</h1>
        <p className="text-gray-500">Generate, view, and export comprehensive society reports.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => (
          <div 
            key={report.id}
            onClick={() => setActiveReport(report.id as ReportType)}
            className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group"
          >
            <div className={`w-12 h-12 rounded-lg ${report.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              <report.icon size={24} className={report.color} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{report.title}</h3>
            <p className="text-sm text-gray-500 line-clamp-2">{report.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
