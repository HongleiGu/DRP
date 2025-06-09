// app/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { Calendar, Modal, Button, Spin, message, Typography } from 'antd';
import { EditOutlined, DeleteOutlined, SaveOutlined, UserOutlined, CloseOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useUser } from '@clerk/nextjs';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { supabase } from '@/lib/supabase';
import { CalendarEntry } from '@/types/datatypes';

const { Title, Text } = Typography;

const StyledMarkdown: React.FC<{ content: string; className?: string }> = ({ 
  content, 
  className = '' 
}) => {
  return (
    <div className={`prose prose-sm max-w-none ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default function MarkdownCalendar({ roomId, isOpen, onClose }: { 
  roomId: string, 
  isOpen: boolean, 
  onClose: () => void 
}) {
  const { user, isLoaded: userLoaded } = useUser();
  const [entries, setEntries] = useState<Record<string, CalendarEntry>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  // Fetch calendar entries
  useEffect(() => {
    if (!isOpen) return;
    
    const fetchEntries = async () => {
      try {
        const { data, error } = await supabase
          .from('calendar_entries')
          .select('*')
          .eq('room_id', roomId)  // Filter by room ID
          .order('date', { ascending: true });

        if (error) throw error;

        const entriesObj: Record<string, CalendarEntry> = {};
        data.forEach((entry: CalendarEntry) => {
          entriesObj[entry.date] = entry;
        });
        setEntries(entriesObj);
      } catch (error) {
        console.error('Error fetching entries:', error);
        message.error('Failed to load calendar entries');
      }
    };

    fetchEntries();

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

  const handleDateSelect = (date: Dayjs) => {
    const dateString = date.format('YYYY-MM-DD');
    setSelectedDate(dateString);
    setEditingContent(entries[dateString]?.content || '');
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!selectedDate || !user?.id) return;  // Fixed condition

    setSaving(true);
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
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving entry:', error);
      message.error('Failed to save entry');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedDate) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('calendar_entries')
        .delete()
        .eq('date', selectedDate)
        .eq('room_id', roomId);

      if (error) throw error;
      
      message.success('Entry deleted successfully!');
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error deleting entry:', error);
      message.error('Failed to delete entry');
    } finally {
      setSaving(false);
    }
  };

  const dateCellRender = (date: Dayjs) => {
    const dateStr = date.format('YYYY-MM-DD');
    const entry = entries[dateStr];
    
    return (
      <div 
        className="h-32 overflow-y-auto p-1 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => handleDateSelect(date)}
      >
        {entry ? (
          <div>
            <StyledMarkdown content={entry.content} />
            <div className="text-xs text-gray-500 mt-1">
              Last updated: {dayjs(entry.updated_at).format('MMM D, h:mm A')}
            </div>
          </div>
        ) : (
          <div className="text-gray-400 text-center pt-8">
            <EditOutlined /> Click to add
          </div>
        )}
      </div>
    );
  };

  if (!userLoaded) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      className='w-[90%] h-[90%]'
      closeIcon={<CloseOutlined className="text-lg" />}
    >
      <div className="min-h-[80vh] p-4 md:p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <Title level={2} className="!mb-1">Collaborative Calendar</Title>
            <Text type="secondary" className="text-base">
              Edit markdown entries for any date - changes sync in real-time
            </Text>
          </div>
          <div className="flex flex-wrap gap-4">
            {user && (
              <div className="flex items-center space-x-2 bg-gray-100 px-4 py-2 rounded-full">
                <Text strong>{user?.fullName || 'Anonymous'}</Text>
              </div>
            )}
            <Button 
              type="default" 
              icon={<CloseOutlined />}
              onClick={onClose}
            >
              Close Calendar
            </Button>
          </div>
        </div>
        
        <div className="border rounded-lg p-4 shadow-inner bg-gray-50 h-[65vh]">
          <Calendar 
            cellRender={dateCellRender}
            className="border-none h-full"
            fullscreen
          />
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <EditOutlined />
            <span>Edit Entry for {dayjs(selectedDate).format('MMMM D, YYYY')}</span>
          </div>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={[
          <Button 
            key="delete" 
            danger 
            icon={<DeleteOutlined />}
            onClick={handleDelete}
            disabled={!entries[selectedDate!]}
          >
            Delete
          </Button>,
          <Button 
            key="cancel" 
            onClick={() => setIsModalOpen(false)}
          >
            Cancel
          </Button>,
          <Button 
            key="save" 
            type="primary" 
            icon={<SaveOutlined />}
            onClick={handleSave}
            loading={saving}
          >
            Save
          </Button>
        ]}
        width={800}
        destroyOnHidden
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[400px]">
          <div className="border rounded p-2 h-full flex flex-col">
            <div className="text-sm text-gray-500 mb-1">Markdown Editor</div>
            <textarea
              value={editingContent}
              onChange={e => setEditingContent(e.target.value)}
              placeholder="# Enter your markdown here...
              
- Use **bold** text
- Create lists
- Add `code snippets`
- Make tables"
              className="w-full h-full p-2 resize-none focus:outline-none flex-grow font-mono text-sm"
              spellCheck="false"
            />
            <div className="text-xs text-gray-500 mt-2">
              Supports Markdown formatting
            </div>
          </div>
          <div className="border rounded p-2 h-full flex flex-col">
            <div className="text-sm text-gray-500 mb-1">Preview</div>
            <div className="overflow-auto flex-grow p-2 bg-gray-50">
              <StyledMarkdown 
                content={editingContent || '*Nothing to preview*'} 
                className="bg-white p-2 rounded"
              />
            </div>
          </div>
        </div>
      </Modal>
    </Modal>
  );
}