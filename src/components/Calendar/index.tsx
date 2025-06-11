"use client";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
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
  Popover,
} from "antd";
import { CloseOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { useUser } from "@clerk/nextjs";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { supabase } from "@/lib/supabase";
import { getCalendarEntries } from "@/utils/api";
import { ALL_EMOJIS } from "@/utils/utils";
import { CalendarEntry } from "@/types/datatypes";

const { Title, Text } = Typography;

const PRESET_FESTIVALS = [
  { name: "Birthday", emoji: "🎂" },
  { name: "Christmas", emoji: "🎄" },
  { name: "New Year", emoji: "🎆" },
  { name: "Easter", emoji: "🐰" },
  { name: "Halloween", emoji: "🎃" },
  { name: "Valentine's Day", emoji: "❤️" },
  { name: "Thanksgiving", emoji: "🦃" },
  { name: "Anniversary", emoji: "💍" },
];

// Debounce helper
const debounce = <T extends (...args: any[]) => void>(fn: T, delay = 3000): T => {
  let timer: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  }) as T;
};

export default function FestivalCalendar({
  roomId,
  isOpen,
  onClose,
}: {
  roomId: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user, isLoaded: userLoaded } = useUser();
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
  const [newFestivals, setNewFestivals] = useState<{ name: string; emoji: string }[]>([]);
  const [currentFestival, setCurrentFestival] = useState({ name: "", emoji: "" });
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [messageApi, contextHolder] = message.useMessage();

  // Fetch initial entries
  useEffect(() => {
    const fetchEntries = async () => {
      const data = await getCalendarEntries(roomId);
      setEntries(data.flat());
    };
    fetchEntries();
  }, [roomId]);

  // Broadcast listener
  useEffect(() => {
    if (!isOpen) return;

    const channel = supabase
      .channel(`festival-broadcast-${roomId}`, { config: { broadcast: { self: true } } })
      .on("broadcast", { event: "festival_event" }, ({ payload }) => {
        const { type, data } = payload;
        setEntries((prev) => {
          switch (type) {
            case "INSERT":
              return [...prev, data];
            case "DELETE":
              return prev.filter((e) => e.id !== data.id);
            case "UPDATE":
              return prev.map((e) => (e.id === data.id ? data : e));
            default:
              return prev;
          }
        });
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [roomId, isOpen]);

  // Handle scroll lock
  useEffect(() => {
    if (!isOpen || isSelectionModalOpen) return;
    const handler = (e: WheelEvent) => {
      const tgt = e.target as HTMLElement;
      if (tgt.closest(".festival-scroll")) return;
      const c = scrollRef.current;
      if (c) {
        c.scrollTop += e.deltaY;
        e.preventDefault();
      }
    };
    window.addEventListener("wheel", handler, { passive: false });
    return () => window.removeEventListener("wheel", handler);
  }, [isOpen, isSelectionModalOpen]);

  // Reset new festival inputs
  useEffect(() => {
    if (isSelectionModalOpen) {
      setNewFestivals([]);
      setCurrentFestival({ name: "", emoji: "" });
    }
  }, [isSelectionModalOpen]);

  // Map entries by date
  const dateEntriesMap = useMemo(() => {
    const m: Record<string, CalendarEntry[]> = {};
    entries.forEach((e) => {
      m[e.date] = m[e.date] || [];
      m[e.date].push(e);
    });
    return m;
  }, [entries]);

  const handleDateSelect = useCallback((date: Dayjs) => {
    setSelectedDate(date.format("YYYY-MM-DD"));
    setIsSelectionModalOpen(true);
  }, []);

  const addPresetFestival = useCallback(
    (preset: { name: string; emoji: string }) => {
      setNewFestivals((prev) => [...prev, preset]);
      messageApi.success(`${preset.name} added!`);
    },
    [messageApi]
  );

  const addToNewFestivals = useCallback(() => {
    if (!currentFestival.name || !currentFestival.emoji) {
      messageApi.error("Emoji and name required");
      return;
    }
    setNewFestivals((prev) => [...prev, currentFestival]);
    setCurrentFestival({ name: "", emoji: "" });
  }, [currentFestival, messageApi]);

  const removeNewFestival = useCallback((idx: number) => {
    setNewFestivals((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  // Broadcast helper
  const sendBroadcast = (type: "INSERT" | "DELETE", data: any) => {
    supabase.channel(`festival-broadcast-${roomId}`).send({
      type: "broadcast",
      event: "festival_event",
      payload: { type, data },
    });
  };

  // Persist festivals (debounced)
  const persistFestivals = useCallback(async () => {
    if (!selectedDate || !user?.id || newFestivals.length === 0) return;
    setIsSaving(true);
    const toInsert = newFestivals.map((f) => ({
      room_id: roomId,
      user_id: user.id,
      date: selectedDate,
      emoji: f.emoji,
      content: f.name,
    }));
    const { error, data } = await supabase.from("calendar_entries").insert(toInsert).select();
    if (!error && data) {
      data.forEach((entry) => sendBroadcast("INSERT", entry));
      messageApi.success("Festivals added!");
      setNewFestivals([]);
      setIsSelectionModalOpen(false);
    } else {
      console.error(error);
      messageApi.error("Save failed");
    }
    setIsSaving(false);
  }, [selectedDate, newFestivals, user, roomId, messageApi]);

  const debouncedPersist = useMemo(() => debounce(persistFestivals, 1000), [
    persistFestivals,
  ]);

  const saveAllFestivals = useCallback(() => {
    debouncedPersist();
  }, [debouncedPersist]);

  const handleDeleteFestival = useCallback(
    async (id: number) => {
      setIsSaving(true);
      setDeletingId(id);
      setEntries((prev) => prev.filter((e) => e.id !== id)); // optimistic
      const { error } = await supabase.from("calendar_entries").delete().eq("id", id);
      if (!error) {
        sendBroadcast("DELETE", { id });
        messageApi.success("Deleted");
      } else {
        console.error(error);
        const data = await getCalendarEntries(roomId);
        setEntries(data.flat());
        messageApi.error("Delete failed");
      }
      setIsSaving(false);
      setDeletingId(null);
    },
    [roomId, messageApi]
  );

  const renderDateCell = useCallback(
    (date: Dayjs) => {
      const ds = date.format("YYYY-MM-DD");
      const dayEntries = dateEntriesMap[ds] || [];
      const isToday = date.isSame(dayjs(), "day");
      return (
        <div
          className={`w-full h-full overflow-y-scroll flex flex-col p-1 gap-1 cursor-pointer rounded-lg transition ${dayEntries.length ? "bg-gray-50 border" : "bg-gray-50"} ${
            isToday ? "ring-2 ring-blue-300" : ""
          } hover:shadow-md`}
          onClick={() => handleDateSelect(date)}
        >
          {dayEntries.length === 0 ? (
            <div className="text-gray-400 text-center flex-1 flex flex-col justify-center items-center">
              <div className="text-xl">+</div>
              <div className="text-xs mt-1">Add Festival</div>
            </div>
          ) : dayEntries.length === 1 ? (
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="bg-white border rounded p-2 flex flex-col items-center justify-center w-full h-full">
                <span className="text-4xl">{dayEntries[0].emoji}</span>
                <span className="mt-2 font-bold text-center">{dayEntries[0].content}</span>
              </div>
            </div>
          ) : (
            <div className="flex-1 max-h-96">
              <div className="text-xs text-center text-gray-500">{dayEntries.length} festivals</div>
              <ul className="px-1 space-y-1 festival-scroll">
                {dayEntries.map((e) => (
                  <li key={e.id} className="bg-white border p-1 rounded flex items-center gap-2">
                    <span className="text-xl">{e.emoji}</span>
                    <span className="text-xs truncate">{e.content}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    },
    [dateEntriesMap, handleDateSelect]
  );

  const selectedDateEntries = useMemo(
    () => (selectedDate ? dateEntriesMap[selectedDate] || [] : []),
    [selectedDate, dateEntriesMap]
  );

  if (!userLoaded)
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spin size="large" tip="Loading user..." />
      </div>
    );

  return (
    <>
      {contextHolder}
      <Modal open={isOpen} onCancel={onClose} footer={null} width="90%" closeIcon={false} centered>
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
                  <Text>{(user.publicMetadata.nickname as string) ?? "Anonymous"}</Text>
                </div>
              )}
              <Button icon={<CloseOutlined />} onClick={onClose}>Close</Button>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto rounded-xl border p-4 bg-gray-50 max-h-[calc(80vh-120px)]">
            <Calendar cellRender={renderDateCell} fullscreen className="bg-white rounded-lg p-2 shadow-sm" />
          </div>
        </div>

        <Modal
          centered
          title={`Festivals for ${
            selectedDate ? dayjs(selectedDate).format("MMMM D, YYYY") : ""
          }`}
          open={isSelectionModalOpen}
          onCancel={() => setIsSelectionModalOpen(false)}
          footer={[
            <Button key="cancel" onClick={() => setIsSelectionModalOpen(false)}>Cancel</Button>,
            <Button
              key="save"
              type="primary"
              onClick={saveAllFestivals}
              loading={isSaving}
              disabled={newFestivals.length === 0}
            >
              Save All ({newFestivals.length})
            </Button>,
          ]}
          width={800}
        >
          <div className="flex flex-col gap-6">
            {/* Existing */}
            <div>
              <Title level={4} className="!mt-0">Existing Festivals</Title>
              <List
                className="max-h-[200px] overflow-y-auto border rounded"
                dataSource={selectedDateEntries}
                renderItem={(item) => (
                  <List.Item
                    key={item.id}
                    actions={[
                      <Button
                        key="del"
                        icon={<DeleteOutlined />}
                        danger
                        size="small"
                        loading={isSaving && deletingId === item.id}
                        onClick={() => handleDeleteFestival(item.id)}
                      />,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<span className="text-2xl">{item.emoji}</span>}
                      title={item.content}
                      description={`Added by ${item.user_id}`}
                    />
                  </List.Item>
                )}
              />
              {selectedDateEntries.length === 0 && (
                <div className="text-center py-4 text-gray-500">No festivals for this date</div>
              )}
            </div>

            <Divider />

            {/* Quick Presets */}
            <div>
              <Title level={4}>Quick Add Presets</Title>
              <div className="grid grid-cols-4 gap-2">
                {PRESET_FESTIVALS.map((p, i) => (
                  <Button key={i} className="flex flex-col items-center h-auto py-2" onClick={() => addPresetFestival(p)}>
                    {p.emoji} {p.name}
                  </Button>
                ))}
              </div>
            </div>

            <Divider />

            {/* Custom Input */}
            <div>
              <Title level={4}>Add Custom Festival</Title>
              <div className="flex items-center gap-2">
                <Popover
                  content={
                    <div className="max-h-48 overflow-y-auto grid grid-cols-6 gap-1 p-2">
                      {ALL_EMOJIS.flatMap((g) => g.emojis).map((emoji) => (
                        <span
                          key={emoji}
                          className="text-xl cursor-pointer hover:scale-110 transition"
                          onClick={() => setCurrentFestival((prev) => ({ ...prev, emoji }))}
                        >
                          {emoji}
                        </span>
                      ))}
                    </div>
                  }
                  trigger="click"
                >
                  <Button
                    shape="circle"
                    icon={currentFestival.emoji ? <span className="text-xl">{currentFestival.emoji}</span> : <PlusOutlined />}
                    size="large"
                    className="border border-dashed"
                  />
                </Popover>
                <Input
                  placeholder="Festival name"
                  value={currentFestival.name}
                  onChange={(e) => setCurrentFestival((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-60"
                />
                <Button type="primary" onClick={addToNewFestivals} disabled={!currentFestival.name || !currentFestival.emoji}>
                  Add
                </Button>
              </div>
              {newFestivals.length > 0 && (
                <div className="mt-4">
                  <Title level={5}>To be added:</Title>
                  <div className="flex flex-wrap gap-2">
                    {newFestivals.map((f, i) => (
                      <Tag key={i} closable onClose={() => removeNewFestival(i)} className="text-lg px-3 py-1">
                        {f.emoji} {f.name}
                      </Tag>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Modal>
      </Modal>
    </>
  );
}
