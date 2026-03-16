import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Flat, OccupancyStatus, Tenant, ParkingSlot, Payment, PendingDue, Note, OccupancyHistory } from '../types';
import { supabase } from '../lib/supabase';

interface FlatsContextType {
  flats: Flat[];
  isLoading: boolean;
  addFlat: (flat: Omit<Flat, 'id' | 'occupancyHistory' | 'payments' | 'pendingDues' | 'notes'> & { occupancyHistory?: OccupancyHistory[] }) => Promise<void>;
  updateFlat: (id: string, updates: Partial<Flat>) => Promise<void>;
  deleteFlat: (id: string) => Promise<void>;
  transferOwnership: (id: string, newOwnerName: string, newOwnerPhone: string, newOwnerEmail: string) => Promise<void>;
  generateReceipt: (flatId: string, dueId: string, mode: string, referenceId: string) => Promise<void>;
}

const FlatsContext = createContext<FlatsContextType | undefined>(undefined);

export function FlatsProvider({ children }: { children: ReactNode }) {
  const [flats, setFlats] = useState<Flat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchFlats();
  }, []);

  const fetchFlats = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('flats')
        .select(`
          *,
          tenants (*),
          occupancy_history (*),
          payments (*),
          pending_dues (*),
          notes (*)
        `);

      if (error) throw error;

      if (data) {
        const formattedFlats: Flat[] = data.map((flat: any) => ({
          id: flat.id,
          flatNumber: flat.flat_number,
          block: flat.block,
          floor: flat.floor,
          area: flat.area,
          ownerName: flat.owner_name,
          ownerPhone: flat.owner_phone,
          ownerEmail: flat.owner_email,
          occupancyStatus: flat.occupancy_status as OccupancyStatus,
          tenant: flat.tenants?.[0] ? {
            name: flat.tenants[0].name,
            phone: flat.tenants[0].phone,
            moveInDate: flat.tenants[0].move_in_date,
            moveOutDate: flat.tenants[0].move_out_date,
          } : undefined,
          occupancyHistory: (flat.occupancy_history || []).map((h: any) => ({
            id: h.id,
            type: h.type,
            name: h.name,
            startDate: h.start_date,
            endDate: h.end_date,
          })),
          payments: (flat.payments || []).map((p: any) => ({
            id: p.id,
            receiptNumber: p.receipt_number,
            title: p.title,
            description: p.description,
            date: p.date,
            mode: p.mode,
            amount: p.amount,
            referenceId: p.reference_id,
          })),
          pendingDues: (flat.pending_dues || []).map((d: any) => ({
            id: d.id,
            title: d.title,
            description: d.description,
            dueDate: d.due_date,
            amount: d.amount,
            status: d.status,
          })),
          notes: (flat.notes || []).map((n: any) => ({
            id: n.id,
            text: n.text,
            timestamp: n.timestamp,
            author: n.author,
          })),
        }));
        setFlats(formattedFlats);
      }
    } catch (error) {
      console.error('Error fetching flats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addFlat = async (newFlatData: any) => {
    try {
      const { data: flatData, error: flatError } = await supabase
        .from('flats')
        .insert([{
          flat_number: newFlatData.flatNumber,
          block: newFlatData.block,
          floor: newFlatData.floor,
          area: newFlatData.area,
          owner_name: newFlatData.ownerName,
          owner_phone: newFlatData.ownerPhone,
          owner_email: newFlatData.ownerEmail,
          occupancy_status: newFlatData.occupancyStatus || 'Vacant'
        }])
        .select()
        .single();

      if (flatError) throw flatError;

      if (flatData) {
        // Add initial occupancy history if owner occupied
        if (newFlatData.occupancyStatus === 'Owner Occupied') {
          const { error: historyError } = await supabase
            .from('occupancy_history')
            .insert([{
              flat_id: flatData.id,
              type: 'Owner',
              name: flatData.owner_name,
              start_date: new Date().toISOString()
            }]);

          if (historyError) throw historyError;
        }
        
        await fetchFlats();
      }
    } catch (error) {
      console.error('Error adding flat:', error);
    }
  };

  const updateFlat = async (id: string, updates: Partial<Flat>) => {
    try {
      const dbUpdates: any = {};
      if (updates.flatNumber !== undefined) dbUpdates.flat_number = updates.flatNumber;
      if (updates.block !== undefined) dbUpdates.block = updates.block;
      if (updates.floor !== undefined) dbUpdates.floor = updates.floor;
      if (updates.area !== undefined) dbUpdates.area = updates.area;
      if (updates.ownerName !== undefined) dbUpdates.owner_name = updates.ownerName;
      if (updates.ownerPhone !== undefined) dbUpdates.owner_phone = updates.ownerPhone;
      if (updates.ownerEmail !== undefined) dbUpdates.owner_email = updates.ownerEmail;
      if (updates.occupancyStatus !== undefined) dbUpdates.occupancy_status = updates.occupancyStatus;

      // Update basic flat info
      if (Object.keys(dbUpdates).length > 0) {
        const { error } = await supabase
          .from('flats')
          .update(dbUpdates)
          .eq('id', id);
        if (error) throw error;
      }

      // Handle tenant updates
      if (updates.occupancyStatus === 'Tenant Occupied' && updates.tenant) {
        // Check if tenant exists
        const { data: existingTenant } = await supabase
          .from('tenants')
          .select('id')
          .eq('flat_id', id)
          .is('move_out_date', null)
          .maybeSingle();

        if (existingTenant) {
          await supabase
            .from('tenants')
            .update({
              name: updates.tenant.name,
              phone: updates.tenant.phone,
              move_in_date: updates.tenant.moveInDate,
            })
            .eq('id', existingTenant.id);
        } else {
          await supabase
            .from('tenants')
            .insert([{
              flat_id: id,
              name: updates.tenant.name,
              phone: updates.tenant.phone,
              move_in_date: updates.tenant.moveInDate,
            }]);
        }
      } else if (updates.occupancyStatus !== undefined && updates.occupancyStatus !== 'Tenant Occupied') {
        // Mark current tenant as moved out
        await supabase
          .from('tenants')
          .update({ move_out_date: new Date().toISOString() })
          .eq('flat_id', id)
          .is('move_out_date', null);
      }

      // Handle occupancy history updates
      if (updates.occupancyHistory) {
        const currentFlat = flats.find(f => f.id === id);
        if (currentFlat) {
          // Find closed histories
          const closedHistories = updates.occupancyHistory.filter(h => h.endDate && !currentFlat.occupancyHistory.find(ch => ch.id === h.id && ch.endDate));
          for (const closed of closedHistories) {
            await supabase
              .from('occupancy_history')
              .update({ end_date: closed.endDate })
              .eq('id', closed.id);
          }

          // Find new histories
          const newHistories = updates.occupancyHistory.filter(h => !currentFlat.occupancyHistory.find(ch => ch.id === h.id));
          if (newHistories.length > 0) {
            await supabase
              .from('occupancy_history')
              .insert(newHistories.map(h => ({
                flat_id: id,
                type: h.type,
                name: h.name,
                start_date: h.startDate,
                end_date: h.endDate
              })));
          }
        }
      }

      // Handle pending dues updates (if added)
      if (updates.pendingDues) {
        const currentFlat = flats.find(f => f.id === id);
        if (currentFlat) {
          const newDues = updates.pendingDues.filter(d => !currentFlat.pendingDues.find(cd => cd.id === d.id));
          if (newDues.length > 0) {
            const { error: duesError } = await supabase
              .from('pending_dues')
              .insert(newDues.map(d => ({
                flat_id: id,
                title: d.title,
                description: d.description,
                due_date: d.dueDate,
                amount: d.amount,
                status: d.status
              })));
            if (duesError) throw duesError;
          }
        }
      }

      // Handle notes updates (if added)
      if (updates.notes) {
        const currentFlat = flats.find(f => f.id === id);
        if (currentFlat) {
          const newNotes = updates.notes.filter(n => !currentFlat.notes.find(cn => cn.id === n.id));
          if (newNotes.length > 0) {
            const { error: notesError } = await supabase
              .from('notes')
              .insert(newNotes.map(n => ({
                flat_id: id,
                text: n.text,
                timestamp: n.timestamp,
                author: n.author
              })));
            if (notesError) throw notesError;
          }
        }
      }

      await fetchFlats();
    } catch (error) {
      console.error('Error updating flat:', error);
    }
  };

  const deleteFlat = async (id: string) => {
    try {
      const { error } = await supabase
        .from('flats')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchFlats();
    } catch (error) {
      console.error('Error deleting flat:', error);
    }
  };

  const transferOwnership = async (id: string, newOwnerName: string, newOwnerPhone: string, newOwnerEmail: string) => {
    try {
      const flat = flats.find(f => f.id === id);
      if (!flat) return;

      const now = new Date().toISOString();
      
      // Close current owner's history if they were occupying
      const currentOccupant = flat.occupancyHistory.find(h => !h.endDate && h.type === 'Owner');
      if (currentOccupant) {
        const { error: updateHistoryError } = await supabase
          .from('occupancy_history')
          .update({ end_date: now })
          .eq('id', currentOccupant.id);
        if (updateHistoryError) throw updateHistoryError;
      }

      // Add new owner to history if they are occupying
      if (flat.occupancyStatus === 'Owner Occupied') {
        const { error: insertHistoryError } = await supabase
          .from('occupancy_history')
          .insert([{
            flat_id: id,
            type: 'Owner',
            name: newOwnerName,
            start_date: now
          }]);
        if (insertHistoryError) throw insertHistoryError;
      }

      // Add note
      const { error: noteError } = await supabase
        .from('notes')
        .insert([{
          flat_id: id,
          text: `Ownership transferred from ${flat.ownerName} to ${newOwnerName}.`,
          timestamp: now,
          author: 'Admin'
        }]);
      if (noteError) throw noteError;

      // Update flat owner details
      const { error: flatError } = await supabase
        .from('flats')
        .update({
          owner_name: newOwnerName,
          owner_phone: newOwnerPhone,
          owner_email: newOwnerEmail
        })
        .eq('id', id);
      
      if (flatError) throw flatError;

      await fetchFlats();
    } catch (error) {
      console.error('Error transferring ownership:', error);
    }
  };

  const generateReceipt = async (flatId: string, dueId: string, mode: string, referenceId: string) => {
    try {
      const flat = flats.find(f => f.id === flatId);
      if (!flat) return;
      
      const due = flat.pendingDues.find(d => d.id === dueId);
      if (!due) return;

      const receiptNumber = `REC-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
      const now = new Date().toISOString();

      // Create payment
      const { error: paymentError } = await supabase
        .from('payments')
        .insert([{
          flat_id: flatId,
          receipt_number: receiptNumber,
          title: due.title,
          description: due.description,
          date: now,
          mode: mode,
          amount: due.amount,
          reference_id: referenceId
        }]);
      if (paymentError) throw paymentError;

      // Delete pending due
      const { error: deleteDueError } = await supabase
        .from('pending_dues')
        .delete()
        .eq('id', dueId);
      if (deleteDueError) throw deleteDueError;

      await fetchFlats();
    } catch (error) {
      console.error('Error generating receipt:', error);
    }
  };

  return (
    <FlatsContext.Provider value={{ flats, isLoading, addFlat, updateFlat, deleteFlat, transferOwnership, generateReceipt }}>
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
