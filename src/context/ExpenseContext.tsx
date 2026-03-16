import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { ExpenseEntry, ExpenseEntryCategory } from '../types';
import { useFlats } from './FlatsContext';
import { supabase } from '../lib/supabase';

interface ExpenseContextType {
  entries: ExpenseEntry[];
  isLoading: boolean;
  residentChargeTypes: string[];
  societyExpenseTypes: string[];
  addEntry: (entry: Omit<ExpenseEntry, 'id' | 'status'>) => Promise<void>;
  updateEntryStatus: (id: string, status: ExpenseEntry['status']) => Promise<void>;
  addExpenseType: (category: ExpenseEntryCategory, typeName: string) => void;
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

export function ExpenseProvider({ children }: { children: ReactNode }) {
  const { flats, updateFlat } = useFlats();
  const [entries, setEntries] = useState<ExpenseEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [residentChargeTypes, setResidentChargeTypes] = useState<string[]>([
    'Lift Usage',
    'Open Space Usage',
    'Facility Booking',
    'Damage Recovery',
    'Event Charges'
  ]);

  const [societyExpenseTypes, setSocietyExpenseTypes] = useState<string[]>([
    'Electricity',
    'Security',
    'Repairs',
    'Utilities',
    'Maintenance'
  ]);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;

      if (data) {
        const formattedEntries: ExpenseEntry[] = data.map((entry: any) => ({
          id: entry.id,
          date: entry.date,
          expenseCategory: entry.expense_category as ExpenseEntryCategory,
          expenseType: entry.expense_type,
          description: entry.description,
          linkedScope: entry.linked_scope.startsWith('[') ? JSON.parse(entry.linked_scope) : entry.linked_scope,
          amount: entry.amount,
          status: entry.status as ExpenseEntry['status'],
        }));
        setEntries(formattedEntries);
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addEntry = async (newEntryData: Omit<ExpenseEntry, 'id' | 'status'>) => {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .insert([{
          date: newEntryData.date,
          expense_category: newEntryData.expenseCategory,
          expense_type: newEntryData.expenseType,
          description: newEntryData.description,
          linked_scope: Array.isArray(newEntryData.linkedScope) ? JSON.stringify(newEntryData.linkedScope) : newEntryData.linkedScope,
          amount: newEntryData.amount,
          status: 'Recorded'
        }])
        .select()
        .single();

      if (error) throw error;

      // If it's a resident charge, we should link it to the flat's pending dues
      if (newEntryData.expenseCategory === 'Resident Charge') {
        const dueAmount = newEntryData.amount;
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 15); // Due in 15 days
        
        const newDue = {
          id: Math.random().toString(36).substr(2, 9), // Temporary ID, will be replaced by DB
          title: newEntryData.expenseType,
          description: newEntryData.description,
          dueDate: dueDate.toISOString(),
          amount: dueAmount,
          status: 'Pending' as const,
        };

        if (newEntryData.linkedScope === 'All Flats') {
          for (const flat of flats) {
            await updateFlat(flat.id, {
              pendingDues: [...flat.pendingDues, newDue],
              notes: [
                ...flat.notes,
                {
                  id: Math.random().toString(36).substr(2, 9),
                  text: `Resident Charge added: ${newEntryData.expenseType} - ₹${newEntryData.amount}`,
                  timestamp: new Date().toISOString(),
                  author: 'System'
                }
              ]
            });
          }
        } else if (Array.isArray(newEntryData.linkedScope)) {
          for (const flatId of newEntryData.linkedScope) {
            const flat = flats.find(f => f.id === flatId);
            if (flat) {
              await updateFlat(flat.id, {
                pendingDues: [...flat.pendingDues, newDue],
                notes: [
                  ...flat.notes,
                  {
                    id: Math.random().toString(36).substr(2, 9),
                    text: `Resident Charge added: ${newEntryData.expenseType} - ₹${newEntryData.amount}`,
                    timestamp: new Date().toISOString(),
                    author: 'System'
                  }
                ]
              });
            }
          }
        }
      }

      await fetchExpenses();
    } catch (error) {
      console.error('Error adding expense:', error);
    }
  };

  const updateEntryStatus = async (id: string, status: ExpenseEntry['status']) => {
    try {
      const { error } = await supabase
        .from('expenses')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      await fetchExpenses();
    } catch (error) {
      console.error('Error updating expense status:', error);
    }
  };

  const addExpenseType = (category: ExpenseEntryCategory, typeName: string) => {
    if (category === 'Resident Charge') {
      setResidentChargeTypes(prev => [...prev, typeName]);
    } else {
      setSocietyExpenseTypes(prev => [...prev, typeName]);
    }
  };

  return (
    <ExpenseContext.Provider value={{
      entries,
      isLoading,
      residentChargeTypes,
      societyExpenseTypes,
      addEntry,
      updateEntryStatus,
      addExpenseType
    }}>
      {children}
    </ExpenseContext.Provider>
  );
}

export function useExpense() {
  const context = useContext(ExpenseContext);
  if (context === undefined) {
    throw new Error('useExpense must be used within an ExpenseProvider');
  }
  return context;
}
