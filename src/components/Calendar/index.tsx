'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Calendar,
  Modal,
  Button,
  message,
  Typography,
  Input,
  List,
  Divider,
  Tag,
  Popover,
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
import { getCalendarEntries } from '@/utils/api';
// import { ALL_EMOJIS } from '@/utils/utils';
import { CalendarEntry } from '@/types/datatypes';

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
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
  const [newFestivals, setNewFestivals] = useState<{ name: string; emoji: string }[]>([]);
  const [currentFestival, setCurrentFestival] = useState({ name: '', emoji: '' });
  const [note, setNote] = useState<string>('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    if (!isOpen) return;
    
    const fetchEntries = async () => {
      const data = await getCalendarEntries(roomId);
      setEntries(data.flat());
    };
    fetchEntries();
  }, [isOpen, roomId]); // Added isOpen dependency

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
      filter: `room_id=eq.${roomId}`, // already good
    },
    () => {
      // REPLACE this block:
      // setEntries((prev) => { ...custom update logic... });

      // TEMPORARY FIX: Just reload all entries on any change
      getCalendarEntries(roomId).then((data) => {
        setEntries(data.flat());
      });
    }
  )
  .subscribe();


    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, roomId]);

  useEffect(() => {
    if (isSelectionModalOpen) {
      setNewFestivals([]);
      setCurrentFestival({ name: '', emoji: '' });
      const noteEntry = entries.find((e) => e.date === selectedDate && e.note);
      setNote(noteEntry?.note || '');
    }
  }, [isSelectionModalOpen, entries, selectedDate]);

  const dateEntriesMap = useMemo(() => {
    const map: Record<string, CalendarEntry[]> = {};
    entries.forEach((entry) => {
      if (!map[entry.date]) map[entry.date] = [];
      map[entry.date].push(entry);
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
    messageApi.success(`${preset.name} added!`);
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

      // 🔁 FIX: Only delete if you're replacing festivals
      if (newFestivals.length > 0) {
        const { error: deleteError } = await supabase
          .from('calendar_entries')
          .delete()
          .match({ room_id: roomId, date: selectedDate, note: null }); // only delete festival entries

        if (deleteError) throw deleteError;
      }

      const entriesToInsert: Partial<CalendarEntry>[] = [...festivalEntries];

      // Always update note: delete existing note first
      if (hasNote) {
        await supabase
          .from('calendar_entries')
          .delete()
          .match({ room_id: roomId, date: selectedDate, content: 'Note' });

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
        const { error: insertError } = await supabase
          .from('calendar_entries')
          .insert(entriesToInsert);

        if (insertError) throw insertError;
      }

      messageApi.success('Saved successfully!');
      setIsSelectionModalOpen(false);
    } catch (err) {
      console.error(err);
      messageApi.error('Save failed');
    } finally {
      setIsSaving(false);
    }
  }, [selectedDate, user, newFestivals, note, roomId, messageApi]);


  const handleDeleteFestival = useCallback(async (id: number) => {
    setIsSaving(true);
    setDeletingId(id);
    setEntries((prev) => prev.filter((entry) => entry.id !== id));

    try {
      const { error } = await supabase.from('calendar_entries').delete().eq('id', id);
      if (error) throw error;
      messageApi.success('Deleted');
    } catch (err) {
      console.error(err);
      const fetchAgain = await getCalendarEntries(roomId);
      setEntries(fetchAgain.flat());
      messageApi.error('Delete failed');
    } finally {
      setIsSaving(false);
      setDeletingId(null);
    }
  }, [messageApi, roomId]);

  return (
    <>
      {contextHolder}
      <Modal open={isOpen} onCancel={onClose} footer={null} title="Festival Calendar" width={800}>
        <Calendar
          fullscreen={false}
          onSelect={(date, info) => {
            if (info.source === 'date') {
              handleDateSelect(date);
            }
          }}
          cellRender={(date) => {
            const formatted = date.format('YYYY-MM-DD');
            const events = dateEntriesMap[formatted] || [];

            const visible = events.filter(it => it.emoji != '📝').slice(0, 3);
            const hasMore = events.filter(it => it.emoji != '📝').length > 3;

            return (
              <div className="flex flex-wrap gap-1">
                {visible.map((entry) => (
                  <Popover key={entry.id} content={entry.note || entry.content}>
                    <span>{entry.emoji}</span>
                  </Popover>
                ))}
                {hasMore && (
                  <Popover
                    content={
                      <div>
                        {events.slice(3).map((entry) => (
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
          <Button key="save" type="primary" loading={isSaving} onClick={saveAllFestivals}>Save</Button>,
        ]}
        title={dayjs(selectedDate).format('MMMM D, YYYY')}
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
              >
                {preset.emoji} {preset.name}
              </Tag>
            ))}
          </div>

          <div className="flex items-center gap-2 mb-3">
            <Input
              placeholder="Emoji"
              style={{ width: 80 }}
              value={currentFestival.emoji}
              onChange={(e) => setCurrentFestival((prev) => ({ ...prev, emoji: e.target.value }))}
            />
            <Input
              placeholder="Festival Name"
              style={{ flex: 1 }}
              value={currentFestival.name}
              onChange={(e) => setCurrentFestival((prev) => ({ ...prev, name: e.target.value }))}
            />
            <Button icon={<PlusOutlined />} onClick={addToNewFestivals} />
          </div>

          <List
            bordered
            dataSource={newFestivals}
            locale={{ emptyText: 'No new festivals added yet.' }}
            renderItem={(item, idx) => (
              <List.Item key={idx} actions={[
                <Button key="remove" size="small" danger icon={<CloseOutlined />} onClick={() => removeNewFestival(idx)} />,
              ]}>
                <span>{item.emoji} {item.name}</span>
              </List.Item>
            )}
          />

          <Divider />
          <Title level={5}>Existing Festivals</Title>
          <List
            bordered
            dataSource={entries.filter((e) => e.date === selectedDate && !e.note)}
            locale={{ emptyText: 'No existing festivals.' }}
            renderItem={(item, idx) => (
              <List.Item key={idx} actions={[
                <Button key="delete" size="small" icon={<DeleteOutlined />} loading={deletingId === item.id} onClick={() => handleDeleteFestival(item.id!)} />,
              ]}>
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
