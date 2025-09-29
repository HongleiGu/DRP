"use client";

import { Message, SupabaseUser } from "@/types/datatypes";
import fileService from "@/utils/fileService";
import {
  appendJsonl,
  parseJsonlToTypedObjects,
} from "@/utils/json";
import { PENDING_KEY, STORAGE_PATH } from "@/utils/utils";
import { PlusOutlined } from "@ant-design/icons";
import { Button, Card, Spin, Typography } from "antd";
import path from "path";
import { useEffect, useState } from "react";
import { findUserById } from "@/utils/user";
import { PendingFileFormat } from "@/types/fileFormat";
import ContactList from "@/components/Contacts/ContactsPanel";
import PendingPanel from "@/components/Contacts/PendingPanel";
import ContactDetails from "@/components/Contacts/ContactDetails";
import { SearchPanel } from "@/components/Contacts/SearchPanel";
import { sendGreetings } from "@/utils/messaging/templates";
import { getMessageWebsocket } from "@/hooks/StompService";

const { Title } = Typography;

export default function ContactsPage({ user }: { user: SupabaseUser }) {
  const [contactsList, setContactList] = useState<SupabaseUser[]>([]);
  const [pendingList, setPendingList] = useState<PendingFileFormat[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const fetchContacts = async () => {
      if (!user?.id) return;

      const filePath = path.join(STORAGE_PATH, user.id, "contacts.jsonl");
      const pendingFilePath = path.join(STORAGE_PATH, user.id, "pending.jsonl");

      if (!(await fileService.existsFile(filePath))) await fileService.createFile(filePath);
      if (!(await fileService.existsFile(pendingFilePath))) await fileService.createFile(pendingFilePath);

      const all = await parseJsonlToTypedObjects<SupabaseUser>(filePath);
      const pending = await parseJsonlToTypedObjects<{ user: SupabaseUser; last_msg: Message }>(pendingFilePath);

      setContactList(all);
      setPendingList(pending);
      setLoading(false);
    };

    fetchContacts();
  }, [user]);

  // there is a universal messageWebsocket connection in GlobalApp
  getMessageWebsocket()?.setHandlers({
    "processGreetingMessage": async (msg, user) => {
      // greeting messages dont have a roomId, but we should save the msg entry to pending.jsonl
      if (msg.metadata.scope === "personal" && msg.metadata.type === "greeting") {
        // we find the speaker of the greeting, and look up who this person is, as we need the details of this person
        const sender: SupabaseUser | null = await findUserById(msg.speaker)
        if (!sender) {
          // if no sender, this message is invalid
          console.log("No sender found for greeting message, ignoring:", msg)
          return
        }
        const pendingEntry: PendingFileFormat = {
          user: sender,
          last_msg: msg
        }
        if (!pendingList.find(it => it.user.id == sender.id)) {
          setPendingList([...pendingList, pendingEntry]);
        }
        const filePath = path.join(STORAGE_PATH, user.id, `pending.jsonl`);
        // if pending not exist on local, create it
        if (!await fileService.existsFile(filePath)) {
          await fileService.createFile(filePath)
        }
        // append the message to the file
        await appendJsonl(filePath, pendingEntry);
      }
    }
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="flex h-screen p-4 bg-gray-100 gap-4">
      {/* Left Panel */}
      <Card
        className="w-1/3 max-w-xs flex flex-col gap-4 overflow-auto"
        style={{ borderRadius: 16 }}
        bodyStyle={{ padding: 16 }}
      >
        <div className="flex items-center justify-between mb-4">
          <Title level={4} className="m-0">Contacts</Title>
          <Button type="primary" icon={<PlusOutlined />} shape="circle" size="large" onClick={() => {setModalOpen(true)}}/>
        </div>
        <ContactList 
          contactsList={contactsList} 
          pendingList={pendingList} 
          setSelectedId={
            (key) => setSelectedId(key)
          }/>
      </Card>

      {/* Right Panel */}
      <div className="flex-1">
        {selectedId === PENDING_KEY ? 
          <PendingPanel 
            currentUser={user}
            renderFunc={(target) => {
              // remove from the pending list
              setPendingList(pendingList.filter(it => it.user.id !== target.id))
              // add to contact list
              setContactList([target, ...contactsList])
            }}
          />
        : 
          <ContactDetails 
            contact={contactsList.find(c => c.id === selectedId)} 
            currentUser={user} 
            renderFunc={
              (target) => setPendingList(pendingList.filter(it => it.user.id !== target.id))
            }
          />
        }
      </div>
      <SearchPanel 
        currentUser={user} 
        open={modalOpen} 
        onClose={() => setModalOpen(false)} 
        send={
          async (currentUser, target) => await sendGreetings(
            currentUser.id,
            currentUser.username,
            target.id
          )
        }
      />
    </div>
  );
}
