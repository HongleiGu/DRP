/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

'use client';
import { useState, useEffect, useCallback } from 'react';
import { Calendar, Modal, Button, Spin, message, Typography } from 'antd';
import { EditOutlined, DeleteOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
// import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import { useUser } from '@clerk/nextjs';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { supabase } from '@/lib/supabase';
import { CalendarEntry } from '@/types/datatypes';
import { getCalendarEntries } from '@/utils/api';

const { Title, Text } = Typography;

const MarkdownPreview: React.FC<{ content: string }> = ({ content }) => (
  <div className="prose prose-sm max-w-none bg-white p-3 rounded-md border">
    <ReactMarkdown remarkPlugins={[remarkGfm]}
      // rehypePlugins={[rehypeRaw]} // allow raw html, might be unsafe, but allows a bit more fun
      components={{
        // Headings
        h1: ({node, ...props}) => <h1 className="text-2xl font-bold my-4" {...props} />,
        h2: ({node, ...props}) => <h2 className="text-xl font-bold my-3" {...props} />,
        h3: ({node, ...props}) => <h3 className="text-lg font-bold my-2" {...props} />,
        
        // Lists
        ul: ({node, ...props}) => <ul className="list-disc pl-5 my-2" {...props} />,
        ol: ({node, ...props}) => <ol className="list-decimal pl-5 my-2" {...props} />,
        li: ({node, ...props}) => <li className="my-1" {...props} />,
        
        // Tables
        table: ({node, ...props}) => (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse my-4" {...props} />
          </div>
        ),
        thead: ({node, ...props}) => <thead className="bg-gray-50" {...props} />,
        th: ({node, ...props}) => <th className="border p-2 text-left font-semibold" {...props} />,
        td: ({node, ...props}) => <td className="border p-2" {...props} />,
        tr: ({node, ...props}) => <tr className="hover:bg-gray-50" {...props} />,
      }}
    >
      {content || '*Nothing to preview*'}
    </ReactMarkdown>
    {/* <Markdown> // no not this, no styles
      {content || '*Nothing to preview*'}
    </Markdown> */}
  </div>
);

export default function MarkdownCalendar({ roomId, isOpen, onClose }: { 
  roomId: string; 
  isOpen: boolean; 
  onClose: () => void; 
}) {
  const { user, isLoaded: userLoaded } = useUser();
  const [entries, setEntries] = useState<Record<string, CalendarEntry>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState<string>('');
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Fetch and subscribe to calendar entries
  useEffect(() => {
    if (!isOpen) return;

    // fetchEntries();
    const helper = async () => {
      const entries = await getCalendarEntries(roomId)
      setEntries(entries)
    }
    helper();

     // Setup realtime subscription
    const channel = supabase
      .channel(`calendar-entries-${roomId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'calendar_entries',
        filter: `room_id=eq.${roomId}`
      }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const newEntry = payload.new as CalendarEntry;
          setEntries(prev => ({
            ...prev,
            [newEntry.date]: newEntry
          }));
        } else if (payload.eventType === 'DELETE') {
          const oldEntry = payload.old as CalendarEntry;
          setEntries(prev => {
            const newEntries = { ...prev };
            delete newEntries[oldEntry.date];
            return newEntries;
          });
        }
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [isOpen, roomId]);

  const handleDateSelect = useCallback((date: Dayjs) => {
    const dateString = date.format('YYYY-MM-DD');
    setSelectedDate(dateString);
    setEditingContent(entries[dateString]?.content || '');
    setIsEditModalOpen(true);
  }, [entries]);

  const handleSave = useCallback(async () => {
    if (!selectedDate || !user?.id) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('calendar_entries')
        .upsert({
          room_id: roomId,
          user_id: user.id,
          date: selectedDate,
          content: editingContent
        }, {
          onConflict: 'room_id,date'
        });

      if (error) throw error;
      
      message.success('Entry saved successfully!');
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Error saving entry:', error);
      message.error('Failed to save entry');
    } finally {
      setIsSaving(false);
    }
  }, [editingContent, roomId, selectedDate, user]);

  const handleDelete = useCallback(async () => {
    if (!selectedDate) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('calendar_entries')
        .delete()
        .eq('date', selectedDate)
        .eq('room_id', roomId);

      if (error) throw error;
      
      message.success('Entry deleted successfully!');
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Error deleting entry:', error);
      message.error('Failed to delete entry');
    } finally {
      setIsSaving(false);
    }
  }, [roomId, selectedDate]);

  const renderDateCell = useCallback((date: Dayjs) => {
    const dateStr = date.format('YYYY-MM-DD');
    const entry = entries[dateStr];
    const isToday = date.isSame(dayjs(), 'day');
    
    return (
      <div 
        className={`h-32 overflow-y-auto p-2 cursor-pointer rounded-lg transition-all
          ${entry ? 'bg-blue-50 border border-blue-100' : 'bg-gray-50'} 
          ${isToday ? 'ring-2 ring-blue-300' : ''}
          hover:shadow-sm hover:border-blue-200`}
        onClick={() => handleDateSelect(date)}
      >
        {entry ? (
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-hidden">
              <MarkdownPreview content={entry.content} />
            </div>
            <div className="text-xs text-gray-500 mt-1 truncate">
              Updated: {dayjs(entry.updated_at).format('MMM D, h:mm A')}
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <EditOutlined className="text-lg mb-1" />
            <span className="text-xs">Add entry</span>
          </div>
        )}
      </div>
    );
  }, [entries, handleDateSelect]);

  if (!userLoaded) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spin size="large" tip="Loading user..." />
      </div>
    );
  }

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      closeIcon={<CloseOutlined className="text-gray-500 hover:text-gray-700" />}
      destroyOnHidden
      width={{
        xs: '90%',
        sm: '90%',
        md: '90%',
        lg: '90%',
        xl: '90%',
        xxl: '90%',
      }}
    >
      <div className="flex flex-col h-[80vh]">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 mb-4 border-b">
          <div>
            <Title level={2} className="!m-0 !text-2xl">Collaborative Calendar</Title>
            <Text type="secondary" className="text-sm">
              Edit markdown entries for any date - changes sync in real-time
            </Text>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {user && (
              <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <Text className="font-medium">{user.fullName || 'Anonymous'}</Text>
              </div>
            )}
            <Button 
              type="default" 
              icon={<CloseOutlined />}
              onClick={onClose}
              className="flex items-center"
            >
              Close
            </Button>
          </div>
        </div>

        {/* Calendar Container */}
        <div className="flex-1 border rounded-xl p-4 bg-gray-50 shadow-inner overflow-hidden w-full h-full">
          <Calendar 
            cellRender={renderDateCell}
            className="bg-white rounded-lg p-2 shadow-sm h-full w-full"
            fullscreen={true}
          />
        </div>
      </div>

      {/* Edit Entry Modal */}
      <Modal
        title={(
          <div className="flex items-center gap-2 font-medium">
            <EditOutlined className="text-blue-500" />
            <span>Edit Entry for {dayjs(selectedDate).format('MMMM D, YYYY')}</span>
          </div>
        )}
        open={isEditModalOpen}
        onCancel={() => setIsEditModalOpen(false)}
        footer={[
          <Button 
            key="delete" 
            danger 
            icon={<DeleteOutlined />}
            onClick={handleDelete}
            disabled={!entries[selectedDate!] || isSaving}
          >
            Delete
          </Button>,
          <Button 
            key="cancel" 
            onClick={() => setIsEditModalOpen(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>,
          <Button 
            key="save" 
            type="primary" 
            icon={<SaveOutlined />}
            onClick={handleSave}
            loading={isSaving}
          >
            Save
          </Button>
        ]}
        width={800}
        destroyOnHidden
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 h-[50vh]">
          {/* Editor Panel */}
          <div className="flex flex-col h-full">
            <div className="text-sm text-gray-700 font-medium mb-2">Markdown Editor</div>
            <textarea
              value={editingContent}
              onChange={e => setEditingContent(e.target.value)}
              placeholder={`# ${dayjs(selectedDate).format('MMMM D')} Notes\n\n- Add your notes here...\n- Use **markdown** formatting\n- Supports tables, code, and more`}
              className="w-full h-full p-3 resize-none border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 font-mono text-sm flex-grow"
              spellCheck="false"
            />
          </div>
          
          {/* Preview Panel */}
          <div className="flex flex-col h-full">
            <div className="text-sm text-gray-700 font-medium mb-2">Preview</div>
            <div className="border rounded-lg bg-gray-50 p-3 h-full overflow-auto">
              <MarkdownPreview content={editingContent} />
            </div>
          </div>
        </div>
      </Modal>
    </Modal>
  );
}