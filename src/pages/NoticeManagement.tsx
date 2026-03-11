import React, { useState, useMemo } from 'react';
import { useNotices } from '../context/NoticeContext';
import { useProfile } from '../context/ProfileContext';
import { Notice, NoticeStatus } from '../types';
import { format, parseISO } from 'date-fns';
import { Plus, Search, Edit3, Trash2, Eye, Send, X } from 'lucide-react';
import clsx from 'clsx';

export default function NoticeManagement() {
  const { notices, addNotice, updateNotice, deleteNotice, publishNotice } = useNotices();
  const { societySettings } = useProfile();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const sortedNotices = useMemo(() => {
    return [...notices]
      .filter(n => n.title.toLowerCase().includes(searchQuery.toLowerCase()) || n.description.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [notices, searchQuery]);

  const handlePublish = (id: string, title: string, description: string) => {
    if (window.confirm('Are you sure you want to publish this notice? It cannot be edited once published.')) {
      publishNotice(id);
      // Simulate WhatsApp message
      console.log(`📢 New Notice from ${societySettings.name}\nTitle: ${title}\nDetails:\n${description}`);
      alert('Notice published successfully! WhatsApp message sent to residents.');
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this draft?')) {
      deleteNotice(id);
    }
  };

  const openViewModal = (notice: Notice) => {
    setSelectedNotice(notice);
    setIsViewModalOpen(true);
  };

  const openEditModal = (notice: Notice) => {
    setSelectedNotice(notice);
    setIsCreateModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Notice Management</h2>
        <button
          onClick={() => {
            setSelectedNotice(null);
            setIsCreateModalOpen(true);
          }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm"
        >
          <Plus size={20} />
          Create Notice
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search notices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 font-medium">Sr No</th>
                <th className="px-6 py-3 font-medium">Title</th>
                <th className="px-6 py-3 font-medium">Description</th>
                <th className="px-6 py-3 font-medium">Created Date</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedNotices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No notices found.
                  </td>
                </tr>
              ) : (
                sortedNotices.map((notice, index) => (
                  <tr key={notice.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-gray-500">{index + 1}</td>
                    <td className="px-6 py-4 text-gray-900 font-medium">{notice.title}</td>
                    <td className="px-6 py-4 text-gray-500 truncate max-w-xs" title={notice.description}>
                      {notice.description}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {format(parseISO(notice.createdAt), 'dd-MMM-yyyy')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={clsx(
                        "px-2 py-1 rounded text-xs font-medium",
                        notice.status === 'Published' ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                      )}>
                        {notice.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-3">
                      <button
                        onClick={() => openViewModal(notice)}
                        className="text-gray-400 hover:text-indigo-600 transition-colors"
                        title="View Notice"
                      >
                        <Eye size={18} />
                      </button>
                      
                      {notice.status === 'Draft' && (
                        <>
                          <button
                            onClick={() => openEditModal(notice)}
                            className="text-gray-400 hover:text-blue-600 transition-colors"
                            title="Edit Draft"
                          >
                            <Edit3 size={18} />
                          </button>
                          <button
                            onClick={() => handlePublish(notice.id, notice.title, notice.description)}
                            className="text-gray-400 hover:text-emerald-600 transition-colors"
                            title="Publish"
                          >
                            <Send size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(notice.id)}
                            className="text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete Draft"
                          >
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {isCreateModalOpen && (
        <CreateNoticeModal
          notice={selectedNotice}
          onClose={() => {
            setIsCreateModalOpen(false);
            setSelectedNotice(null);
          }}
          onSave={(title, description, status) => {
            if (selectedNotice) {
              updateNotice(selectedNotice.id, { title, description });
              if (status === 'Published') {
                publishNotice(selectedNotice.id);
                console.log(`📢 New Notice from ${societySettings.name}\nTitle: ${title}\nDetails:\n${description}`);
                alert('Notice published successfully! WhatsApp message sent to residents.');
              }
            } else {
              addNotice({ title, description, status });
              if (status === 'Published') {
                console.log(`📢 New Notice from ${societySettings.name}\nTitle: ${title}\nDetails:\n${description}`);
                alert('Notice published successfully! WhatsApp message sent to residents.');
              }
            }
            setIsCreateModalOpen(false);
            setSelectedNotice(null);
          }}
        />
      )}

      {isViewModalOpen && selectedNotice && (
        <ViewNoticeModal
          notice={selectedNotice}
          onClose={() => {
            setIsViewModalOpen(false);
            setSelectedNotice(null);
          }}
        />
      )}
    </div>
  );
}

function CreateNoticeModal({ notice, onClose, onSave }: { notice: Notice | null, onClose: () => void, onSave: (title: string, description: string, status: NoticeStatus) => void }) {
  const [title, setTitle] = useState(notice?.title || '');
  const [description, setDescription] = useState(notice?.description || '');

  const handleSaveDraft = () => {
    if (!title.trim() || !description.trim()) {
      alert('Title and Description are mandatory.');
      return;
    }
    onSave(title, description, 'Draft');
  };

  const handlePublish = () => {
    if (!title.trim() || !description.trim()) {
      alert('Title and Description are mandatory.');
      return;
    }
    if (window.confirm('Are you sure you want to publish this notice? It cannot be edited once published.')) {
      onSave(title, description, 'Published');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
          <h2 className="text-xl font-semibold text-gray-900">
            {notice ? 'Edit Notice' : 'Create Notice'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Water Supply Maintenance"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-red-500">*</span></label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Full message content..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none min-h-[150px]"
              required
            />
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveDraft}
            className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
          >
            Save as Draft
          </button>
          <button
            onClick={handlePublish}
            className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <Send size={16} />
            Publish
          </button>
        </div>
      </div>
    </div>
  );
}

function ViewNoticeModal({ notice, onClose }: { notice: Notice, onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
            Notice Details
            <span className={clsx(
              "px-2 py-1 rounded text-xs font-medium",
              notice.status === 'Published' ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
            )}>
              {notice.status}
            </span>
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Title</h3>
            <p className="text-lg font-semibold text-gray-900">{notice.title}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Description</h3>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-gray-800 whitespace-pre-wrap">
              {notice.description}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Created Date</h3>
              <p className="text-gray-900">{format(parseISO(notice.createdAt), 'dd MMM yyyy, hh:mm a')}</p>
            </div>
            {notice.publishedAt && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Published Date</h3>
                <p className="text-gray-900">{format(parseISO(notice.publishedAt), 'dd MMM yyyy, hh:mm a')}</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
