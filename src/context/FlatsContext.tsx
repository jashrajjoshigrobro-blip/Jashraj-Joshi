import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Flat, OccupancyStatus, Tenant, ParkingSlot, Payment, PendingDue, Note, OccupancyHistory } from '../types';
import { mockFlats } from '../data/mockData';

interface FlatsContextType {
  flats: Flat[];
  addFlat: (flat: Omit<Flat, 'id' | 'occupancyHistory' | 'payments' | 'pendingDues' | 'notes'> & { occupancyHistory?: OccupancyHistory[] }) => void;
  updateFlat: (id: string, updates: Partial<Flat>) => void;
  deleteFlat: (id: string) => void;
  transferOwnership: (id: string, newOwnerName: string, newOwnerPhone: string, newOwnerEmail: string) => void;
  generateReceipt: (flatId: string, dueId: string, mode: string, referenceId: string) => void;
}

const FlatsContext = createContext<FlatsContextType | undefined>(undefined);

export function FlatsProvider({ children }: { children: ReactNode }) {
  const [flats, setFlats] = useState<Flat[]>(mockFlats);

  const addFlat = (newFlatData: any) => {
    const newFlat: Flat = {
      ...newFlatData,
      id: Math.random().toString(36).substr(2, 9),
      occupancyHistory: newFlatData.occupancyHistory || [
        {
          id: Math.random().toString(36).substr(2, 9),
          type: 'Owner',
          name: newFlatData.ownerName,
          startDate: new Date().toISOString(),
        }
      ],
      payments: [],
      pendingDues: [],
      notes: [],
    };
    setFlats([...flats, newFlat]);
  };

  const updateFlat = (id: string, updates: Partial<Flat>) => {
    setFlats(prevFlats => prevFlats.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const deleteFlat = (id: string) => {
    setFlats(flats.filter(f => f.id !== id));
  };

  const transferOwnership = (id: string, newOwnerName: string, newOwnerPhone: string, newOwnerEmail: string) => {
    setFlats(flats.map(flat => {
      if (flat.id !== id) return flat;

      const now = new Date().toISOString();
      const updatedHistory = [...flat.occupancyHistory];
      
      // Close current owner's history if they were occupying
      const currentOccupantIndex = updatedHistory.findIndex(h => !h.endDate);
      if (currentOccupantIndex !== -1 && updatedHistory[currentOccupantIndex].type === 'Owner') {
        updatedHistory[currentOccupantIndex] = {
          ...updatedHistory[currentOccupantIndex],
          endDate: now
        };
      }

      // Add new owner to history if they are occupying
      // If tenant occupied, tenant history remains open
      if (flat.occupancyStatus === 'Owner Occupied') {
        updatedHistory.push({
          id: Math.random().toString(36).substr(2, 9),
          type: 'Owner',
          name: newOwnerName,
          startDate: now,
        });
      }

      return {
        ...flat,
        ownerName: newOwnerName,
        ownerPhone: newOwnerPhone,
        ownerEmail: newOwnerEmail,
        occupancyHistory: updatedHistory,
        notes: [
          ...flat.notes,
          {
            id: Math.random().toString(36).substr(2, 9),
            text: `Ownership transferred from ${flat.ownerName} to ${newOwnerName}.`,
            timestamp: now,
            author: 'Admin'
          }
        ]
      };
    }));
  };

  const generateReceipt = (flatId: string, dueId: string, mode: string, referenceId: string) => {
    setFlats(flats.map(flat => {
      if (flat.id !== flatId) return flat;
      
      const due = flat.pendingDues.find(d => d.id === dueId);
      if (!due) return flat;

      const newPayment: Payment = {
        id: Math.random().toString(36).substr(2, 9),
        receiptNumber: `REC-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
        title: due.title,
        description: due.description,
        date: new Date().toISOString(),
        mode,
        amount: due.amount,
        referenceId,
      };

      return {
        ...flat,
        payments: [newPayment, ...flat.payments],
        pendingDues: flat.pendingDues.filter(d => d.id !== dueId)
      };
    }));
  };

  return (
    <FlatsContext.Provider value={{ flats, addFlat, updateFlat, deleteFlat, transferOwnership, generateReceipt }}>
      {children}
    </FlatsContext.Provider>
  );
}

export function useFlats() {
  const context = useContext(FlatsContext);
  if (context === undefined) {
    throw new Error('useFlats must be used within a FlatsProvider');
  }
  return context;
}
