import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { LedgerTransaction, ExpenseCategory } from '../types';
import { useFlats } from './FlatsContext';
import { useExpense } from './ExpenseContext';

interface LedgerContextType {
  transactions: LedgerTransaction[];
  addTransaction: (transaction: Omit<LedgerTransaction, 'id'>) => void;
  isLoading: boolean;
}

const LedgerContext = createContext<LedgerContextType | undefined>(undefined);

export function LedgerProvider({ children }: { children: ReactNode }) {
  const { flats, isLoading: isFlatsLoading } = useFlats();
  const { entries, isLoading: isExpenseLoading } = useExpense();
  const [transactions, setTransactions] = useState<LedgerTransaction[]>([]);

  const isLoading = isFlatsLoading || isExpenseLoading;

  // Automatically sync payments from flats as income transactions
  useEffect(() => {
    const paymentTransactions: LedgerTransaction[] = [];
    flats.forEach(flat => {
      const occupantName = flat.occupancyStatus === 'Tenant Occupied' && flat.tenant ? flat.tenant.name : flat.ownerName;
      flat.payments.forEach(payment => {
        paymentTransactions.push({
          id: `pay-${payment.id}`,
          date: payment.date,
          type: 'Income',
          category: payment.title?.toLowerCase().includes('penalty') ? 'Penalty' : 'Maintenance',
          description: payment.description || payment.title || 'Maintenance',
          amount: payment.amount,
          flatNumber: flat.flatNumber,
          flatId: flat.id,
          occupantName: occupantName,
        });
      });
    });

    // Sync Society Operational Expenses
    const expenseTransactions: LedgerTransaction[] = entries
      .filter(e => e.expenseCategory === 'Society Operational Expense')
      .map(e => ({
        id: `exp-${e.id}`,
        date: e.date,
        type: 'Expense',
        category: (['Electricity', 'Water', 'Repairs', 'Salary', 'Cleaning', 'Security'].includes(e.expenseType) ? e.expenseType : 'Other Expense') as ExpenseCategory,
        description: e.description,
        amount: e.amount,
      }));

    // Combine and sort by date ascending
    const allTransactions = [...paymentTransactions, ...expenseTransactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    setTransactions(allTransactions);
  }, [flats, entries]);

  const addTransaction = (newTxData: Omit<LedgerTransaction, 'id'>) => {
    const newTx: LedgerTransaction = {
      ...newTxData,
      id: Math.random().toString(36).substr(2, 9),
    };
    setTransactions(prev => {
      const updated = [...prev, newTx];
      return updated.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    });
  };

  return (
    <LedgerContext.Provider value={{ transactions, addTransaction, isLoading }}>
      {children}
    </LedgerContext.Provider>
  );
}

export function useLedger() {
  const context = useContext(LedgerContext);
  if (context === undefined) {
    throw new Error('useLedger must be used within a LedgerProvider');
  }
  return context;
}
