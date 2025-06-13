'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Calendar,
  Modal,
  Button,
  Select,
  message,
  Typography,
  Input,
  List,
  Divider,
  Tag,
  Popover,
  Cascader,
} from 'antd';
import {
  CloseOutlined,
  DeleteOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useUser } from '@clerk/nextjs';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { supabase } from '@/lib/supabase';
import { getCalendarEntries, insertChatHistory } from '@/utils/api';
import { CalendarEntry } from '@/types/datatypes';
const { Option, OptGroup } = Select;

import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { ALL_EMOJIS, cascaderOptions } from '@/utils/utils';

dayjs.extend(utc);
dayjs.extend(timezone);

const { Title, Text } = Typography;

const PRESET_FESTIVALS = [
  { name: 'Birthday', emoji: '🎂' },
  { name: 'Christmas', emoji: '🎄' },
  { name: 'New Year', emoji: '🎆' },
  { name: 'Easter', emoji: '🐰' },
  { name: 'Halloween', emoji: '🎃' },
  { name: "Valentine's Day", emoji: '❤️' },
  { name: 'Thanksgiving', emoji: '🦃' },
  { name: 'Anniversary', emoji: '💍' },
];

const findGroup = (emoji: string) => {
  const group = ALL_EMOJIS.find(g => g.emojis.includes(emoji));
  return group ? group.name : undefined;
};

// same old story, must be BaseOptionType
const EMOJI_OPTIONS = ALL_EMOJIS.map(group => ({
  value: group.name,
  label: group.name,
  children: group.emojis.map(emoji => ({
    value: emoji,
    label: emoji,
  })),
}));

export default function FestivalCalendar({
  roomId,
  isOpen,
  onClose,
}: {
  roomId: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const { user } = useUser();
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [selectedTimeZone, setSelectedTimeZone] = useState(dayjs.tz.guess());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
  const [newFestivals, setNewFestivals] = useState<{ name: string; emoji: string }[]>([]);
  const [currentFestival, setCurrentFestival] = useState({ name: '', emoji: '' });
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [note, setNote] = useState<string>('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [messageApi, contextHolder] = message.useMessage();

  // Fetch entries when modal opens or timezone changes
  useEffect(() => {
    const fetchEntries = async () => {
      if (!isOpen) return;
      
      try {
        const data = await getCalendarEntries(roomId);
        const enriched = data.flat().map((entry) => {
          if (entry.countdown) {
            const futureDate = dayjs.unix(entry.countdown).tz(selectedTimeZone);
            return {
              ...entry,
              content: futureDate.format('HH:mm'),
              note: entry.note || `Scheduled at ${futureDate.format('HH:mm')}`,
              date: futureDate.format('YYYY-MM-DD'),
            };
          }
          return entry;
        });
        console.log("enriched", enriched)
        setEntries(enriched);
      } catch (error) {
        console.error("Failed to fetch entries:", error);
      }
    };

    fetchEntries();
  }, [isOpen, roomId, selectedTimeZone]);

  // Realtime updates
  useEffect(() => {
    if (!isOpen) return;

    const channel = supabase
      .channel(`calendar-entries-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'calendar_entries',
          filter: `room_id=eq.${roomId}`,
        },
        async () => {
          const data = await getCalendarEntries(roomId);
          const enriched = data.flat().map((entry) => {
            if (entry.countdown) {
              const futureDate = dayjs.unix(entry.countdown).tz(selectedTimeZone);
              return {
                ...entry,
                content: futureDate.format('HH:mm'),
                note: entry.note || `Scheduled at ${futureDate.format('HH:mm')}`,
                date: futureDate.format('YYYY-MM-DD'),
              };
            }
            return entry;
          });
          setEntries(enriched);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, roomId, selectedTimeZone]);

  // Reset modal state when opening
  useEffect(() => {
    if (isSelectionModalOpen) {
      setNewFestivals([]);
      setCurrentFestival({ name: '', emoji: '' });
      const noteEntry = entries.find(
        e => e.date === selectedDate && e.content === 'Note'
      );
      setNote(noteEntry?.note || '');
    }
  }, [isSelectionModalOpen, entries, selectedDate]);

  const dateEntriesMap = useMemo(() => {
    const map: Record<string, CalendarEntry[]> = {};
    entries.forEach((entry) => {
      const dateKey = dayjs(entry.date).format('YYYY-MM-DD');
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(entry);
    });
    return map;
  }, [entries]);

  const handleDateSelect = useCallback((date: Dayjs) => {
    setSelectedDate(date.format('YYYY-MM-DD'));
    setIsSelectionModalOpen(true);
  }, []);

  const addPresetFestival = useCallback((preset: { name: string; emoji: string }) => {
    if (newFestivals.some((f) => f.name === preset.name && f.emoji === preset.emoji)) {
      messageApi.info(`${preset.name} is already added.`);
      return;
    }
    setNewFestivals((prev) => [...prev, preset]);
  }, [messageApi, newFestivals]);

  const addToNewFestivals = useCallback(() => {
    if (!currentFestival.name || !currentFestival.emoji) {
      messageApi.error('Emoji and name required');
      return;
    }
    if (newFestivals.some((f) => f.name === currentFestival.name && f.emoji === currentFestival.emoji)) {
      messageApi.info(`${currentFestival.name} is already added.`);
      return;
    }
    setNewFestivals((prev) => [...prev, currentFestival]);
    setCurrentFestival({ name: '', emoji: '' });
  }, [currentFestival, messageApi, newFestivals]);

  const removeNewFestival = useCallback((index: number) => {
    setNewFestivals((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const saveAllFestivals = useCallback(async () => {
    if (!selectedDate || !user?.id) return;

    setIsSaving(true);
    try {
      const hasNote = note.trim().length > 0;
      const festivalEntries = newFestivals.map((f) => ({
        room_id: roomId,
        user_id: user.id,
        date: selectedDate,
        emoji: f.emoji,
        content: f.name,
        note: null,
      }));

      // Delete existing festivals and note for this date
      await supabase
        .from('calendar_entries')
        .delete()
        .match({ 
          room_id: roomId, 
          date: selectedDate,
          $or: [{ note: null }, { content: 'Note' }]
        });

      const entriesToInsert: Partial<CalendarEntry>[] = [...festivalEntries];

      // Add note if exists
      if (hasNote) {
        entriesToInsert.push({
          room_id: roomId,
          user_id: user.id,
          date: selectedDate,
          emoji: '📝',
          content: 'Note',
          note: note.trim(),
        });
      }

      if (entriesToInsert.length > 0) {
        await supabase
          .from('calendar_entries')
          .insert(entriesToInsert);
      }

      messageApi.success('Saved successfully!');
      setIsSelectionModalOpen(false);
    } catch (err) {
      console.error(err);
      messageApi.error('Save failed');
    } finally {
      if (user) {
        const messageObj = {
          speaker: user.id,
          speaker_name: (user.publicMetadata.nickname as string) ?? "Mr. unknown",
          chat_message: `/alert ${(user.publicMetadata.nickname as string) ?? "Mr. unknown"}`,
          created_at: new Date().toISOString(),
          chat_room_id: roomId
        }
        await insertChatHistory(messageObj);
      }
      setIsSaving(false);
    }
  }, [selectedDate, user, newFestivals, note, roomId, messageApi]);

  const handleDeleteFestival = useCallback(async (id: number) => {
    setIsSaving(true);
    setDeletingId(id);
    try {
      await supabase.from('calendar_entries').delete().eq('id', id);
      setEntries(prev => prev.filter(entry => entry.id !== id));
      messageApi.success('Deleted');
    } catch (err) {
      console.error(err);
      messageApi.error('Delete failed');
    } finally {
      setIsSaving(false);
      setDeletingId(null);
    }
  }, [messageApi]);

  return (
    <>
      {contextHolder}
      <Modal 
        open={isOpen} 
        onCancel={onClose} 
        footer={null} 
        title="Festival Calendar" 
        width={800}
        destroyOnClose
      >
        <Cascader
          options={cascaderOptions}
          placeholder="Select Time Zone"
          style={{ width: 300 }}
          showSearch
          value={
            selectedTimeZone && selectedTimeZone.includes("/")
              ? [selectedTimeZone.split("/")[0], selectedTimeZone]
              : undefined
          }
          onChange={(value) => {
            const selected = value?.[1]; // full time zone like "America/New_York"
            if (selected) {
              setSelectedTimeZone(selected);
            }
          }}
          displayRender={(labels) => labels.join(" / ")} // e.g., America / New York
        />


        <Calendar
          fullscreen={false}
          onSelect={(date) => handleDateSelect(date)}
          cellRender={(date) => {
            const formatted = date.format('YYYY-MM-DD');
            const events = dateEntriesMap[formatted] || [];

            const festivals = events.filter(e => e.content !== 'Note');
            const visible = festivals.slice(0, 3);
            const hasMore = festivals.length > 3;

            return (
              <div className="flex flex-wrap gap-1">
                {visible.map((entry) => (
                  <Popover 
                    key={entry.id} 
                    content={entry.note || entry.content}
                  >
                    <span>{entry.emoji}</span>
                  </Popover>
                ))}
                {hasMore && (
                  <Popover
                    content={
                      <div>
                        {festivals.slice(3).map((entry) => (
                          <div key={entry.id}>
                            <span className="mr-1">{entry.emoji}</span>
                            {entry.note || entry.content}
                          </div>
                        ))}
                      </div>
                    }
                  >
                    <span>...</span>
                  </Popover>
                )}
              </div>
            );
          }}
        />
      </Modal>

      <Modal
        open={isSelectionModalOpen}
        onCancel={() => setIsSelectionModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsSelectionModalOpen(false)}>Cancel</Button>,
          <Button 
            key="save" 
            type="primary" 
            loading={isSaving} 
            onClick={saveAllFestivals}
            disabled={newFestivals.length === 0 && !note.trim()}
          >
            Save
          </Button>,
        ]}
        title={dayjs(selectedDate).format('MMMM D, YYYY')}
        destroyOnClose
      >
        <div>
          <Title level={5}>Add Festivals</Title>
          <div className="flex flex-wrap gap-2 mb-3">
            {PRESET_FESTIVALS.map((preset) => (
              <Tag
                key={preset.name}
                color="blue"
                onClick={() => addPresetFestival(preset)}
                style={{ cursor: 'pointer' }}
                className="py-1"
              >
                {preset.emoji} {preset.name}
              </Tag>
            ))}
          </div>

          <div className="flex items-center gap-2 mb-3">
            <Cascader
              options={EMOJI_OPTIONS}
              placeholder="Select Emoji"
              style={{ width: 200 }}
              showSearch
              value={currentFestival.emoji ? [findGroup(currentFestival.emoji) ?? "", currentFestival.emoji] : []}
              onChange={(value) => {
                const selectedEmoji = value?.[1]; // The actual emoji is the second item
                if (selectedEmoji) {
                  setCurrentFestival(prev => ({ ...prev, emoji: selectedEmoji }));
                }
              }}
              displayRender={(labels) => (
                <span style={{ fontSize: 20 }}>{labels[1] || labels[0]}</span>
              )}
            />
            <Input
              placeholder="Festival Name"
              style={{ flex: 1 }}
              value={currentFestival.name}
              onChange={(e) => setCurrentFestival(prev => ({ ...prev, name: e.target.value }))}
            />
            <Button 
              icon={<PlusOutlined />} 
              onClick={addToNewFestivals}
              disabled={!currentFestival.emoji || !currentFestival.name}
            />
          </div>

          <List
            bordered
            dataSource={newFestivals}
            locale={{ emptyText: 'No new festivals added yet.' }}
            renderItem={(item, idx) => (
              <List.Item 
                actions={[
                  <Button 
                    key="remove" 
                    size="small" 
                    danger 
                    icon={<CloseOutlined />} 
                    onClick={() => removeNewFestival(idx)} 
                  />,
                ]}
              >
                <span>{item.emoji} {item.name}</span>
              </List.Item>
            )}
          />

          <Divider />
          <Title level={5}>Existing Festivals</Title>
          <List
            bordered
            dataSource={entries.filter(e => 
              e.date === selectedDate && 
              e.content !== 'Note' &&
              !newFestivals.some(nf => nf.name === e.content)
            )}
            locale={{ emptyText: 'No existing festivals.' }}
            renderItem={(item) => (
              <List.Item 
                actions={[
                  <Button 
                    key="delete" 
                    size="small" 
                    icon={<DeleteOutlined />} 
                    loading={deletingId === item.id} 
                    onClick={() => handleDeleteFestival(item.id!)} 
                  />,
                ]}
              >
                <span>{item.emoji} {item.content}</span>
              </List.Item>
            )}
          />

          <Divider />
          <Title level={5}>Note for This Date</Title>
          <Text type="secondary">This is a unique note for the selected date and room.</Text>
          <Input.TextArea
            rows={4}
            placeholder="Write a note..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            style={{ marginTop: 8 }}
          />
        </div>
      </Modal>
    </>
  );
}