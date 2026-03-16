import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { ParkingSlot, ParkingSlotType, ParkingAllocationStatus } from '../types';
import { supabase } from '../lib/supabase';

interface ParkingContextType {
  parkingSlots: ParkingSlot[];
  isLoading: boolean;
  addParkingSlot: (slot: Omit<ParkingSlot, 'id' | 'status' | 'allocatedToFlatId' | 'assignedDate'>) => Promise<void>;
  updateParkingSlot: (id: string, updates: Partial<ParkingSlot>) => Promise<void>;
  assignSlotToFlat: (slotId: string, flatId: string) => Promise<void>;
  reassignSlot: (slotId: string, newFlatId: string) => Promise<void>;
  removeAllocation: (slotId: string) => Promise<void>;
}

const ParkingContext = createContext<ParkingContextType | undefined>(undefined);

export function ParkingProvider({ children }: { children: ReactNode }) {
  const [parkingSlots, setParkingSlots] = useState<ParkingSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchParkingSlots();
  }, []);

  const fetchParkingSlots = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('parking_slots')
        .select('*')
        .order('zone', { ascending: true })
        .order('slot_number', { ascending: true });

      if (error) throw error;

      if (data) {
        const formattedSlots: ParkingSlot[] = data.map((slot: any) => ({
          id: slot.id,
          zone: slot.zone,
          level: slot.level,
          slotNumber: slot.slot_number,
          slotType: slot.slot_type as ParkingSlotType,
          status: slot.status as ParkingAllocationStatus,
          allocatedToFlatId: slot.allocated_to_flat_id,
          assignedDate: slot.assigned_date,
        }));
        setParkingSlots(formattedSlots);
      }
    } catch (error) {
      console.error('Error fetching parking slots:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addParkingSlot = async (newSlotData: Omit<ParkingSlot, 'id' | 'status' | 'allocatedToFlatId' | 'assignedDate'>) => {
    try {
      const { error } = await supabase
        .from('parking_slots')
        .insert([{
          zone: newSlotData.zone,
          level: newSlotData.level,
          slot_number: newSlotData.slotNumber,
          slot_type: newSlotData.slotType,
          status: 'Available'
        }]);

      if (error) throw error;
      await fetchParkingSlots();
    } catch (error) {
      console.error('Error adding parking slot:', error);
    }
  };

  const updateParkingSlot = async (id: string, updates: Partial<ParkingSlot>) => {
    try {
      const dbUpdates: any = {};
      if (updates.zone !== undefined) dbUpdates.zone = updates.zone;
      if (updates.level !== undefined) dbUpdates.level = updates.level;
      if (updates.slotNumber !== undefined) dbUpdates.slot_number = updates.slotNumber;
      if (updates.slotType !== undefined) dbUpdates.slot_type = updates.slotType;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.allocatedToFlatId !== undefined) dbUpdates.allocated_to_flat_id = updates.allocatedToFlatId;
      if (updates.assignedDate !== undefined) dbUpdates.assigned_date = updates.assignedDate;

      const { error } = await supabase
        .from('parking_slots')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;
      await fetchParkingSlots();
    } catch (error) {
      console.error('Error updating parking slot:', error);
    }
  };

  const assignSlotToFlat = async (slotId: string, flatId: string) => {
    try {
      const { error } = await supabase
        .from('parking_slots')
        .update({
          status: 'Allocated',
          allocated_to_flat_id: flatId,
          assigned_date: new Date().toISOString()
        })
        .eq('id', slotId);

      if (error) throw error;
      await fetchParkingSlots();
    } catch (error) {
      console.error('Error assigning parking slot:', error);
    }
  };

  const reassignSlot = async (slotId: string, newFlatId: string) => {
    try {
      const { error } = await supabase
        .from('parking_slots')
        .update({
          status: 'Allocated',
          allocated_to_flat_id: newFlatId,
          assigned_date: new Date().toISOString()
        })
        .eq('id', slotId);

      if (error) throw error;
      await fetchParkingSlots();
    } catch (error) {
      console.error('Error reassigning parking slot:', error);
    }
  };

  const removeAllocation = async (slotId: string) => {
    try {
      const { error } = await supabase
        .from('parking_slots')
        .update({
          status: 'Available',
          allocated_to_flat_id: null,
          assigned_date: null
        })
        .eq('id', slotId);

      if (error) throw error;
      await fetchParkingSlots();
    } catch (error) {
      console.error('Error removing parking slot allocation:', error);
    }
  };

  return (
    <ParkingContext.Provider value={{
      parkingSlots,
      isLoading,
      addParkingSlot,
      updateParkingSlot,
      assignSlotToFlat,
      reassignSlot,
      removeAllocation
    }}>
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
