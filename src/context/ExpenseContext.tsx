import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ExpenseEntry, ExpenseEntryCategory } from '../types';
import { useFlats } from './FlatsContext';

interface ExpenseContextType {
  entries: ExpenseEntry[];
  residentChargeTypes: string[];
  societyExpenseTypes: string[];
  addEntry: (entry: Omit<ExpenseEntry, 'id' | 'status'>) => void;
  updateEntryStatus: (id: string, status: ExpenseEntry['status']) => void;
  addExpenseType: (category: ExpenseEntryCategory, typeName: string) => void;
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

export function ExpenseProvider({ children }: { children: ReactNode }) {
  const { flats, updateFlat } = useFlats();
  const [entries, setEntries] = useState<ExpenseEntry[]>([]);
  
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

  const addEntry = (newEntryData: Omit<ExpenseEntry, 'id' | 'status'>) => {
    const newEntry: ExpenseEntry = {
      ...newEntryData,
      id: Math.random().toString(36).substr(2, 9),
      status: 'Recorded',
    };
    
    setEntries(prev => [...prev, newEntry]);

    // If it's a resident charge, we should link it to the flat's pending dues
    if (newEntry.expenseCategory === 'Resident Charge') {
      const dueAmount = newEntry.amount;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 15); // Due in 15 days
      
      const newDue = {
        id: Math.random().toString(36).substr(2, 9),
        title: newEntry.expenseType,
        description: newEntry.description,
        dueDate: dueDate.toISOString(),
        amount: dueAmount,
        status: 'Pending' as const,
      };

      if (newEntry.linkedScope === 'All Flats') {
        flats.forEach(flat => {
          updateFlat(flat.id, {
            pendingDues: [...flat.pendingDues, { ...newDue, id: Math.random().toString(36).substr(2, 9) }],
            notes: [
              ...flat.notes,
              {
                id: Math.random().toString(36).substr(2, 9),
                text: `Resident Charge added: ${newEntry.expenseType} - ₹${newEntry.amount}`,
                timestamp: new Date().toISOString(),
                author: 'System'
              }
            ]
          });
        });
      } else if (Array.isArray(newEntry.linkedScope)) {
        newEntry.linkedScope.forEach(flatId => {
          const flat = flats.find(f => f.id === flatId);
          if (flat) {
            updateFlat(flat.id, {
              pendingDues: [...flat.pendingDues, { ...newDue, id: Math.random().toString(36).substr(2, 9) }],
              notes: [
                ...flat.notes,
                {
                  id: Math.random().toString(36).substr(2, 9),
                  text: `Resident Charge added: ${newEntry.expenseType} - ₹${newEntry.amount}`,
                  timestamp: new Date().toISOString(),
                  author: 'System'
                }
              ]
            });
          }
        });
      }
    }
  };

  const updateEntryStatus = (id: string, status: ExpenseEntry['status']) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, status } : e));
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
