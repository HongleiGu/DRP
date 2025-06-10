'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Calendar,
  Modal,
  Button,
  Spin,
  message,
  Typography,
  Radio,
  Popover,
  Input,
  Select,
  List
} from 'antd';
import { CloseOutlined, DeleteOutlined } from '@ant-design/icons';
import { useUser } from '@clerk/nextjs';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { supabase } from '@/lib/supabase';
import { CalendarEntry } from '@/types/datatypes';
import { getCalendarEntries } from '@/utils/api';
import { ALL_EMOJIS } from '@/utils/utils';
import type { BaseOptionType } from 'antd/es/select';

const { Title, Text } = Typography;

type Festival = {
  name: string;
  emoji: string;
  color: string;
  border: string;
};

type FestivalMap = Record<string, Festival>;

const INITIAL_FESTIVALS: FestivalMap = {
  birthday: { name: 'Birthday', emoji: '🎂', color: 'bg-pink-100', border: 'border-pink-300' },
  christmas: { name: 'Christmas', emoji: '🎄', color: 'bg-green-100', border: 'border-green-300' },
  easter: { name: 'Easter', emoji: '🐰', color: 'bg-yellow-100', border: 'border-yellow-300' },
  halloween: { name: 'Halloween', emoji: '🎃', color: 'bg-orange-100', border: 'border-orange-300' },
  newyear: { name: 'New Year', emoji: '🎉', color: 'bg-blue-100', border: 'border-blue-300' },
};

type FestivalKey = string;

export default function FestivalCalendar({
  roomId,
  isOpen,
  onClose
}: {
  roomId: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const { user, isLoaded: userLoaded } = useUser();
  const [entries, setEntries] = useState<Record<string, CalendarEntry[]>>({});
  const [festivals, setFestivals] = useState<FestivalMap>(INITIAL_FESTIVALS);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedFestival, setSelectedFestival] = useState<FestivalKey | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);

  const [customFestivalName, setCustomFestivalName] = useState('');
  const [customEmoji, setCustomEmoji] = useState('');
  const [popoverVisible, setPopoverVisible] = useState(false);

  // Load initial entries
  useEffect(() => {
    if (!roomId || !isOpen) return;
    const fetchEntries = async () => {
      const data = await getCalendarEntries(roomId);
      setEntries(data);
    };
    fetchEntries();
  }, [roomId, isOpen]);

  // Supabase real-time listener
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
          } 
          else if (eventType === 'UPDATE') {
            updated[date] = (prev[date] || []).map(entry => 
              entry.id === (newEntry as CalendarEntry).id ? newEntry as CalendarEntry : entry
            );
          } 
          else if (eventType === 'DELETE') {
            updated[date] = (prev[date] || []).filter(
              entry => entry.id !== (oldEntry as CalendarEntry).id
            );
            
            if (updated[date].length === 0) {
              delete updated[date];
            }
          }
          return updated;
        });
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [isOpen, roomId]);

  const handleDateSelect = (date: Dayjs) => {
    const dateStr = date.format('YYYY-MM-DD');
    setSelectedDate(dateStr);
    setIsSelectionModalOpen(true);
  };

  const handleSaveFestival = async () => {
    if (!selectedDate || !selectedFestival || !user?.id) return;
    setIsSaving(true);

    try {
      const { error } = await supabase.from('calendar_entries').insert({
        room_id: roomId,
        user_id: user.id,
        date: selectedDate,
        content: selectedFestival
      });

      if (error) throw error;
      message.success(`${festivals[selectedFestival].name} added!`);
      setSelectedFestival(null);
    } catch (err) {
      console.error('Save error:', err);
      message.error('Could not save festival.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteFestival = async (entryId: number) => {
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('calendar_entries')
        .delete()
        .eq('id', entryId);

      if (error) throw error;
      message.success('Festival removed!');
    } catch (err) {
      console.error('Delete error:', err);
      message.error('Could not delete festival.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddCustomFestival = () => {
    const key = customFestivalName.toLowerCase().replace(/\s+/g, '_');

    if (!key || !customEmoji) return;

    const newFestival: Festival = {
      name: customFestivalName,
      emoji: customEmoji,
      color: 'bg-yellow-50',
      border: 'border-yellow-200'
    };

    setFestivals(prev => ({ ...prev, [key]: newFestival }));
    setSelectedFestival(key);
    setCustomFestivalName('');
    setCustomEmoji('');
    setPopoverVisible(false);
  };

  const dateEntries = useMemo(() => {
    return selectedDate ? entries[selectedDate] || [] : [];
  }, [selectedDate, entries]);

  const renderDateCell = (date: Dayjs) => {
    const dateStr = date.format('YYYY-MM-DD');
    const dateEntries = entries[dateStr] || [];
    const isToday = date.isSame(dayjs(), 'day');

    return (
      <div
        className={`h-32 flex flex-col rounded-lg cursor-pointer transition
          ${dateEntries.length ? 'bg-gray-50 border border-gray-200' : 'bg-gray-50'}
          ${isToday ? 'ring-2 ring-blue-300' : ''}
          hover:shadow-md p-1 gap-1 overflow-hidden`}
        onClick={() => handleDateSelect(date)}
      >
        {dateEntries.length === 0 ? (
          <div className="text-gray-400 text-center h-full flex flex-col items-center justify-center">
            <div className="text-xl">+</div>
            <div className="text-xs mt-1">Add Festival</div>
          </div>
        ) : dateEntries.length === 1 ? (
          // Single festival - full display
          <div className="h-full flex flex-col items-center justify-center p-2">
            {dateEntries.map(entry => {
              const festivalKey = entry.content as FestivalKey;
              const festival = festivals[festivalKey];
              return festival ? (
                <div 
                  key={entry.id}
                  className={`${festival.color} ${festival.border} border-2 rounded-lg p-3 flex flex-col items-center justify-center w-full h-full`}
                >
                  <span className="text-4xl">{festival.emoji}</span>
                  <span className="font-bold mt-2 text-center">{festival.name}</span>
                </div>
              ) : null;
            })}
          </div>
        ) : (
          // Multiple festivals - scrollable list
          <div className="h-full flex flex-col">
            <div className="text-xs text-gray-500 text-center mb-1">
              {dateEntries.length} festivals
            </div>
            <div className="flex-1 overflow-y-auto">
              <ul className="space-y-1 px-1">
                {dateEntries.map(entry => {
                  const festivalKey = entry.content as FestivalKey;
                  const festival = festivals[festivalKey];
                  return festival ? (
                    <li 
                      key={entry.id}
                      className="flex items-center gap-2 bg-white p-1 rounded border"
                    >
                      <span className="text-xl">{festival.emoji}</span>
                      <span className="text-xs truncate">{festival.name}</span>
                    </li>
                  ) : null;
                })}
              </ul>
            </div>
          </div>
        )}
      </div>
    );
  };

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
      closeIcon={<CloseOutlined />}
      width="90%"
    >
      <div className="flex flex-col h-[80vh]">
        <div className="flex justify-between items-center border-b pb-4 mb-4">
          <div>
            <Title level={2} className="!m-0 !text-2xl">Festival Calendar</Title>
            <Text type="secondary">Click any date to add or remove festivals</Text>
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
          <Calendar
            cellRender={renderDateCell}
            fullscreen
            className="bg-white rounded-lg p-2 shadow-sm"
          />
        </div>
      </div>

      <Modal
        title={`Festivals for ${selectedDate ? dayjs(selectedDate).format('MMMM D, YYYY') : ''}`}
        open={isSelectionModalOpen}
        onCancel={() => setIsSelectionModalOpen(false)}
        footer={null}
        width={600}
      >
        <div className="mb-6">
          <h3 className="font-medium mb-3">Current Festivals</h3>
          {dateEntries.length > 0 ? (
            <List
              dataSource={dateEntries}
              renderItem={entry => {
                const festivalKey = entry.content as FestivalKey;
                const festival = festivals[festivalKey];
                return festival ? (
                  <List.Item 
                    className="border-b py-3 last:border-b-0"
                    actions={[
                      <Button 
                        key="delete"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDeleteFestival(entry.id)}
                        loading={isSaving}
                        size="small"
                      />
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<span className="text-2xl">{festival.emoji}</span>}
                      title={festival.name}
                      description={`Added by ${entry.user_id}`}
                    />
                  </List.Item>
                ) : null;
              }}
            />
          ) : (
            <div className="text-gray-400 text-center py-4">
              No festivals added yet
            </div>
          )}
        </div>

        <div className="border-t pt-4">
          <h3 className="font-medium mb-3">Add New Festival</h3>
          <div className="mb-4">
            <Radio.Group
              value={selectedFestival}
              onChange={(e) => setSelectedFestival(e.target.value)}
              className="w-full"
            >
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(festivals).map(([key, fest]) => (
                  <Radio.Button
                    key={key}
                    value={key}
                    className={`h-24 flex flex-col items-center justify-center p-2 rounded-lg ${
                      selectedFestival === key ? 'ring-2 ring-blue-500' : ''
                    }`}
                  >
                    <span className="text-3xl">{fest.emoji}</span>
                    <span className="font-medium mt-2">{fest.name}</span>
                  </Radio.Button>
                ))}
              </div>
            </Radio.Group>
          </div>

          <div className="flex justify-between items-center">
            <Popover
              content={
                <div className="flex flex-col gap-2 w-64">
                  <Input
                    value={customFestivalName}
                    onChange={(e) => setCustomFestivalName(e.target.value)}
                    placeholder="Festival name"
                  />
                  <Select
                    value={customEmoji}
                    style={{ width: '100%' }}
                    placeholder="Choose emoji"
                    onChange={(e) => setCustomEmoji(e)}
                    options={ALL_EMOJIS[0].emojis.map(e => ({ value: e, label: e }))}
                  />
                  <Button 
                    type="primary" 
                    onClick={handleAddCustomFestival}
                    disabled={!customFestivalName || !customEmoji}
                  >
                    Add Custom Festival
                  </Button>
                </div>
              }
              trigger="click"
              visible={popoverVisible}
              onVisibleChange={setPopoverVisible}
            >
              <Button>Create Custom Festival</Button>
            </Popover>
            
            <Button 
              type="primary" 
              onClick={handleSaveFestival} 
              loading={isSaving}
              disabled={!selectedFestival}
            >
              Add Festival
            </Button>
          </div>
        </div>
      </Modal>
    </Modal>
  );
}