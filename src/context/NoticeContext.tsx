import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Notice, NoticeStatus } from '../types';
import { supabase } from '../lib/supabase';

interface NoticeContextType {
  notices: Notice[];
  isLoading: boolean;
  addNotice: (notice: Omit<Notice, 'id' | 'createdAt' | 'publishedAt'>) => Promise<void>;
  updateNotice: (id: string, updates: Partial<Notice>) => Promise<void>;
  deleteNotice: (id: string) => Promise<void>;
  publishNotice: (id: string) => Promise<void>;
}

const NoticeContext = createContext<NoticeContextType | undefined>(undefined);

export function NoticeProvider({ children }: { children: ReactNode }) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const formattedNotices: Notice[] = data.map((notice: any) => ({
          id: notice.id,
          title: notice.title,
          description: notice.description,
          status: notice.status as NoticeStatus,
          createdAt: notice.created_at,
          publishedAt: notice.published_at,
        }));
        setNotices(formattedNotices);
      }
    } catch (error) {
      console.error('Error fetching notices:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addNotice = async (newNoticeData: Omit<Notice, 'id' | 'createdAt' | 'publishedAt'>) => {
    try {
      const { error } = await supabase
        .from('notices')
        .insert([{
          title: newNoticeData.title,
          description: newNoticeData.description,
          status: newNoticeData.status,
          published_at: newNoticeData.status === 'Published' ? new Date().toISOString() : null
        }]);

      if (error) throw error;
      await fetchNotices();
    } catch (error) {
      console.error('Error adding notice:', error);
    }
  };

  const updateNotice = async (id: string, updates: Partial<Notice>) => {
    try {
      const dbUpdates: any = {};
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.publishedAt !== undefined) dbUpdates.published_at = updates.publishedAt;

      const { error } = await supabase
        .from('notices')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;
      await fetchNotices();
    } catch (error) {
      console.error('Error updating notice:', error);
    }
  };

  const deleteNotice = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notices')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchNotices();
    } catch (error) {
      console.error('Error deleting notice:', error);
    }
  };

  const publishNotice = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notices')
        .update({
          status: 'Published',
          published_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      await fetchNotices();
    } catch (error) {
      console.error('Error publishing notice:', error);
    }
  };

  return (
    <NoticeContext.Provider value={{ notices, isLoading, addNotice, updateNotice, deleteNotice, publishNotice }}>
      {children}
    </NoticeContext.Provider>
  );
}

export function useNotices() {
  const context = useContext(NoticeContext);
  if (context === undefined) {
    throw new Error('useNotices must be used within a NoticeProvider');
  }
  return context;
}
