import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Notice, NoticeStatus } from '../types';

interface NoticeContextType {
  notices: Notice[];
  addNotice: (notice: Omit<Notice, 'id' | 'createdAt' | 'status'> & { status: NoticeStatus }) => void;
  updateNotice: (id: string, updates: Partial<Notice>) => void;
  deleteNotice: (id: string) => void;
  publishNotice: (id: string) => void;
}

const NoticeContext = createContext<NoticeContextType | undefined>(undefined);

export function NoticeProvider({ children }: { children: ReactNode }) {
  const [notices, setNotices] = useState<Notice[]>([
    {
      id: 'n1',
      title: 'Annual General Meeting',
      description: 'The Annual General Meeting will be held on 15th April at the clubhouse. All owners are requested to attend.',
      status: 'Published',
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      publishedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
    {
      id: 'n2',
      title: 'Water Supply Maintenance',
      description: 'Water supply will be unavailable from 10 AM to 2 PM due to pipeline maintenance on 20th April.',
      status: 'Draft',
      createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    }
  ]);

  const addNotice = (noticeData: Omit<Notice, 'id' | 'createdAt' | 'status'> & { status: NoticeStatus }) => {
    const newNotice: Notice = {
      ...noticeData,
      id: `n${Date.now()}`,
      createdAt: new Date().toISOString(),
      publishedAt: noticeData.status === 'Published' ? new Date().toISOString() : undefined,
    };
    setNotices(prev => [newNotice, ...prev]);
  };

  const updateNotice = (id: string, updates: Partial<Notice>) => {
    setNotices(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
  };

  const deleteNotice = (id: string) => {
    setNotices(prev => prev.filter(n => n.id !== id));
  };

  const publishNotice = (id: string) => {
    setNotices(prev => prev.map(n => {
      if (n.id === id) {
        return {
          ...n,
          status: 'Published',
          publishedAt: new Date().toISOString(),
        };
      }
      return n;
    }));
  };

  return (
    <NoticeContext.Provider value={{ notices, addNotice, updateNotice, deleteNotice, publishNotice }}>
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
