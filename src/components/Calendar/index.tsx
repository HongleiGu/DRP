'use client';
import { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Modal,
  Button,
  Spin,
  message,
  Typography,
  Input,
  List,
  Divider,
  Tag,
  Popover
} from 'antd';
import { CloseOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useUser } from '@clerk/nextjs';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { supabase } from '@/lib/supabase';
import { CalendarEntry } from '@/types/datatypes';
import { getCalendarEntries } from '@/utils/api';
import { ALL_EMOJIS } from '@/utils/utils';

const { Title, Text } = Typography;

const PRESET_FESTIVALS = [
  { name: "Birthday", emoji: "🎂" },
  { name: "Christmas", emoji: "🎄" },
  { name: "New Year", emoji: "🎆" },
  { name: "Easter", emoji: "🐰" },
  { name: "Halloween", emoji: "🎃" },
  { name: "Valentine's Day", emoji: "❤️" },
  { name: "Thanksgiving", emoji: "🦃" },
  { name: "Anniversary", emoji: "💍" }
];

export default function FestivalCalendar({ roomId, isOpen, onClose }: { roomId: string; isOpen: boolean; onClose: () => void; }) {
  const { user, isLoaded: userLoaded } = useUser();
  const [entries, setEntries] = useState<Record<string, CalendarEntry[]>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);

  const [newFestivals, setNewFestivals] = useState<{ name: string; emoji: string; }[]>([]);
  const [currentFestival, setCurrentFestival] = useState({ name: '', emoji: '' });

  useEffect(() => {
    if (!roomId || !isOpen) return;
    const fetchEntries = async () => {
      const data = await getCalendarEntries(roomId);
      setEntries(data);
    };
    fetchEntries();
  }, [roomId, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const channel = supabase
      .channel(`calendar-entries-${roomId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'calendar_entries',
        filter: `room_id=eq.${roomId}`
      }, (payload) => {
        const { eventType, new: newEntry, old: oldEntry } = payload;
        setEntries(prev => {
          const updated = { ...prev };
          const date = (newEntry as CalendarEntry)?.date || (oldEntry as CalendarEntry)?.date;
          if (!date) return prev;
          if (eventType === 'INSERT') {
            updated[date] = [...(prev[date] || []), newEntry as CalendarEntry];
          } else if (eventType === 'UPDATE') {
            updated[date] = (prev[date] || []).map(entry => entry.id === (newEntry as CalendarEntry).id ? newEntry as CalendarEntry : entry);
          } else if (eventType === 'DELETE') {
            updated[date] = (prev[date] || []).filter(entry => entry.id !== (oldEntry as CalendarEntry).id);
            if (updated[date].length === 0) delete updated[date];
          }
          return updated;
        });
      }).subscribe();
    return () => { channel.unsubscribe(); };
  }, [isOpen, roomId]);

  useEffect(() => {
    if (isSelectionModalOpen) {
      setNewFestivals([]);
      setCurrentFestival({ name: '', emoji: '' });
    }
  }, [isSelectionModalOpen]);

  const handleDateSelect = (date: Dayjs) => {
    const dateStr = date.format('YYYY-MM-DD');
    setSelectedDate(dateStr);
    setIsSelectionModalOpen(true);
  };

  const addPresetFestival = (preset: { name: string; emoji: string; }) => {
    setNewFestivals(prev => [...prev, preset]);
    message.success(`${preset.name} added!`);
  };

  const addToNewFestivals = () => {
    if (!currentFestival.name || !currentFestival.emoji) {
      message.error('Emoji and name required');
      return;
    }
    setNewFestivals(prev => [...prev, currentFestival]);
    setCurrentFestival({ name: '', emoji: '' });
  };

  const removeNewFestival = (index: number) => {
    setNewFestivals(prev => prev.filter((_, i) => i !== index));
  };

  const saveAllFestivals = async () => {
    if (!selectedDate || !user?.id || newFestivals.length === 0) return;
    setIsSaving(true);
    try {
      const toInsert = newFestivals.map(f => ({
        room_id: roomId,
        user_id: user.id,
        date: selectedDate,
        content: JSON.stringify(f)
      }));
      const { error } = await supabase.from('calendar_entries').insert(toInsert);
      if (error) throw error;
      message.success('Festivals added!');
      setNewFestivals([]);
      setIsSelectionModalOpen(false);
    } catch (err) {
      console.error(err);
      message.error('Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteFestival = async (id: number) => {
    setIsSaving(true);
    try {
      const { error } = await supabase.from('calendar_entries').delete().eq('id', id);
      if (error) throw error;
      message.success('Deleted');
    } catch (err) {
      console.error(err);
      message.error('Delete failed');
    } finally {
      setIsSaving(false);
    }
  };

  const dateEntries = useMemo(() => selectedDate ? entries[selectedDate] || [] : [], [selectedDate, entries]);

  const renderDateCell = (date: Dayjs) => {
    const dateStr = date.format('YYYY-MM-DD');
    const dayEntries = entries[dateStr] || [];
    const isToday = date.isSame(dayjs(), 'day');
    return (
      <div
        className={`h-32 flex flex-col p-1 gap-1 overflow-hidden cursor-pointer rounded-lg transition ${dayEntries.length ? 'bg-gray-50 border' : 'bg-gray-50'} ${isToday ? 'ring-2 ring-blue-300' : ''} hover:shadow-md`}
        onClick={() => handleDateSelect(date)}
      >
        {dayEntries.length === 0 ? (
          <div className="text-gray-400 text-center flex-1 flex flex-col justify-center items-center">
            <div className="text-xl">+</div>
            <div className="text-xs mt-1">Add Festival</div>
          </div>
        ) : dayEntries.length === 1 ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            {dayEntries.map(entry => {
              try {
                const fest = JSON.parse(entry.content);
                return (
                  <div key={entry.id} className="bg-white border rounded p-2 flex flex-col items-center justify-center w-full h-full">
                    <span className="text-4xl">{fest.emoji}</span>
                    <span className="mt-2 font-bold text-center">{fest.name}</span>
                  </div>
                );
              } catch {
                return null;
              }
            })}
          </div>
        ) : (
          <div className="flex-1">
            <div className="text-xs text-center text-gray-500">{dayEntries.length} festivals</div>
            <ul className="overflow-y-auto px-1 space-y-1">
              {dayEntries.map(entry => {
                try {
                  const fest = JSON.parse(entry.content);
                  return (
                    <li key={entry.id} className="bg-white border p-1 rounded flex items-center gap-2">
                      <span className="text-xl">{fest.emoji}</span>
                      <span className="text-xs truncate">{fest.name}</span>
                    </li>
                  );
                } catch {
                  return null;
                }
              })}
            </ul>
          </div>
        )}
      </div>
    );
  };

  if (!userLoaded) return <div className="flex justify-center items-center min-h-[400px]"><Spin size="large" tip="Loading user..." /></div>;

  return (
    <Modal open={isOpen} onCancel={onClose} footer={null} width="90%" closeIcon={<CloseOutlined />}>
      <div className="flex flex-col h-[80vh]">
        <div className="flex justify-between items-center border-b pb-4 mb-4">
          <div>
            <Title level={2} className="!m-0 !text-2xl">Festival Calendar</Title>
            <Text type="secondary">Click a date to manage festivals</Text>
          </div>
          <div className="flex gap-3">
            {user && (
              <div className="bg-gray-100 px-3 py-1.5 rounded-full flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <Text>{user.fullName || 'Anonymous'}</Text>
              </div>
            )}
            <Button icon={<CloseOutlined />} onClick={onClose}>Close</Button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden rounded-xl border p-4 bg-gray-50">
          <Calendar cellRender={renderDateCell} fullscreen className="bg-white rounded-lg p-2 shadow-sm" />
        </div>
      </div>

      <Modal
        title={`Festivals for ${selectedDate ? dayjs(selectedDate).format('MMMM D, YYYY') : ''}`}
        open={isSelectionModalOpen}
        onCancel={() => setIsSelectionModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsSelectionModalOpen(false)}>Cancel</Button>,
          <Button key="save" type="primary" onClick={saveAllFestivals} loading={isSaving} disabled={newFestivals.length === 0}>Save All ({newFestivals.length})</Button>
        ]}
        width={800}
      >
        <div className="flex flex-col gap-6">
          <div>
            <Title level={4} className="!mt-0">Existing Festivals</Title>
            <List
              className="max-h-[200px] overflow-y-auto border rounded"
              dataSource={dateEntries}
              renderItem={(item: CalendarEntry) => {
                try {
                  const festival = JSON.parse(item.content);
                  return (
                    <List.Item key={item.id} actions={[<Button key="del" icon={<DeleteOutlined />} danger size="small" loading={isSaving} onClick={() => handleDeleteFestival(item.id)} />]}>
                      <List.Item.Meta
                        avatar={<span className="text-2xl">{festival.emoji}</span>}
                        title={festival.name}
                        description={`Added by ${item.user_id}`}
                      />
                    </List.Item>
                  );
                } catch {
                  return null;
                }
              }}
            />
            {dateEntries.length === 0 && <div className="text-center py-4 text-gray-500">No festivals for this date</div>}
          </div>

          <Divider />

          <div>
            <Title level={4}>Quick Add Presets</Title>
            <div className="grid grid-cols-4 gap-2">
              {PRESET_FESTIVALS.map((preset, idx) => (
                <Button key={idx} className="flex flex-col items-center h-auto py-2" onClick={() => addPresetFestival(preset)}>
                  <span className="text-2xl mb-1">{preset.emoji}</span>
                  <span className="text-xs">{preset.name}</span>
                </Button>
              ))}
            </div>
          </div>

          <Divider />

          <div>
            <Title level={4}>Add Custom Festival</Title>
            <div className="flex items-center gap-2">
              <Popover
                content={
                  <div className="max-h-48 overflow-y-auto grid grid-cols-6 gap-1 p-2">
                    {ALL_EMOJIS.flatMap(g => g.emojis).map(emoji => (
                      <span key={emoji} className="text-xl cursor-pointer hover:scale-110 transition" onClick={() => setCurrentFestival(prev => ({ ...prev, emoji }))}>{emoji}</span>
                    ))}
                  </div>
                }
                trigger="click"
              >
                <Button shape="circle" icon={currentFestival.emoji ? <span className="text-xl">{currentFestival.emoji}</span> : <PlusOutlined />} size="large" className="border border-dashed" />
              </Popover>
              <Input placeholder="Festival name" value={currentFestival.name} onChange={(e) => setCurrentFestival(prev => ({ ...prev, name: e.target.value }))} className="w-60" />
              <Button type="primary" onClick={addToNewFestivals} disabled={!currentFestival.name || !currentFestival.emoji}>Add</Button>
            </div>
            {newFestivals.length > 0 && (
              <div className="mt-4">
                <Title level={5}>To be added:</Title>
                <div className="flex flex-wrap gap-2">
                  {newFestivals.map((f, i) => (
                    <Tag key={i} closable onClose={() => removeNewFestival(i)} className="text-lg px-3 py-1">{f.emoji} {f.name}</Tag>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </Modal>
  );
}
