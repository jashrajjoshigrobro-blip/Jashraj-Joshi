import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ParkingSlot, ParkingSlotType, ParkingAllocationStatus } from '../types';

interface ParkingContextType {
  parkingSlots: ParkingSlot[];
  addParkingSlot: (slot: Omit<ParkingSlot, 'id' | 'status' | 'allocatedToFlatId' | 'assignedDate'>) => void;
  updateParkingSlot: (id: string, updates: Partial<ParkingSlot>) => void;
  assignSlotToFlat: (slotId: string, flatId: string) => void;
  reassignSlot: (slotId: string, newFlatId: string) => void;
  removeAllocation: (slotId: string) => void;
}

const ParkingContext = createContext<ParkingContextType | undefined>(undefined);

export function ParkingProvider({ children }: { children: ReactNode }) {
  const [parkingSlots, setParkingSlots] = useState<ParkingSlot[]>([
    { id: 'p1', zone: 'Basement 1', level: '-1', slotNumber: 'A12', slotType: 'Car', status: 'Allocated', allocatedToFlatId: '1', assignedDate: '2022-01-15' },
    { id: 'p2', zone: 'Basement 1', level: '-1', slotNumber: 'A13', slotType: 'Bike', status: 'Allocated', allocatedToFlatId: '1', assignedDate: '2022-01-15' },
    { id: 'p3', zone: 'Ground', level: '0', slotNumber: 'B45', slotType: 'Car', status: 'Allocated', allocatedToFlatId: '2', assignedDate: '2023-05-01' },
    { id: 'p4', zone: 'Ground', level: '0', slotNumber: 'B46', slotType: 'EV', status: 'Available' },
    { id: 'p5', zone: 'Basement 2', level: '-2', slotNumber: 'C10', slotType: 'Visitor', status: 'Available' },
  ]);

  const addParkingSlot = (slotData: Omit<ParkingSlot, 'id' | 'status' | 'allocatedToFlatId' | 'assignedDate'>) => {
    const newSlot: ParkingSlot = {
      ...slotData,
      id: `p${Date.now()}`,
      status: 'Available',
    };
    setParkingSlots(prev => [...prev, newSlot]);
  };

  const updateParkingSlot = (id: string, updates: Partial<ParkingSlot>) => {
    setParkingSlots(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const assignSlotToFlat = (slotId: string, flatId: string) => {
    setParkingSlots(prev => prev.map(s => {
      if (s.id === slotId) {
        return {
          ...s,
          status: 'Allocated',
          allocatedToFlatId: flatId,
          assignedDate: new Date().toISOString(),
        };
      }
      return s;
    }));
  };

  const reassignSlot = (slotId: string, newFlatId: string) => {
    setParkingSlots(prev => prev.map(s => {
      if (s.id === slotId) {
        return {
          ...s,
          status: 'Allocated',
          allocatedToFlatId: newFlatId,
          assignedDate: new Date().toISOString(),
        };
      }
      return s;
    }));
  };

  const removeAllocation = (slotId: string) => {
    setParkingSlots(prev => prev.map(s => {
      if (s.id === slotId) {
        return {
          ...s,
          status: 'Available',
          allocatedToFlatId: undefined,
          assignedDate: undefined,
        };
      }
      return s;
    }));
  };

  return (
    <ParkingContext.Provider value={{ parkingSlots, addParkingSlot, updateParkingSlot, assignSlotToFlat, reassignSlot, removeAllocation }}>
      {children}
    </ParkingContext.Provider>
  );
}

export function useParking() {
  const context = useContext(ParkingContext);
  if (context === undefined) {
    throw new Error('useParking must be used within a ParkingProvider');
  }
  return context;
}
