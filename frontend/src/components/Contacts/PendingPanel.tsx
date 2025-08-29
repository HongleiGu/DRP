import { SupabaseUser } from "@/types/datatypes";
import { PendingFileFormat } from "@/types/fileFormat";
import { acceptGreeting } from "@/utils/contacts/utils";
import { getContactsFilePath, getPendingFilePath } from "@/utils/fileService/commonFilePaths";
import { parseJsonlToTypedObjects } from "@/utils/json";
import { removeDuplicatesById } from "@/utils/utils";
import { Avatar, Button, Card, Empty, List } from "antd";
import { useEffect, useState } from "react";

interface PendingPanelProps {
  currentUser: SupabaseUser;  // The current user viewing the pending requests
  renderFunc: (target: SupabaseUser) => void;  // Function for rendering after the contact request is accepted
}


export default function PendingPanel ({
  currentUser,
  renderFunc
}: PendingPanelProps) {
  const [pendingList, setPendingList] = useState<PendingFileFormat[]>([]);
  const [contactsList, setContactsList] = useState<SupabaseUser[]>([]);

  useEffect(() => {
    const helper = async () => {
      const pending = await parseJsonlToTypedObjects<PendingFileFormat>(getPendingFilePath(currentUser.id))
      const c = await parseJsonlToTypedObjects<SupabaseUser>(getContactsFilePath(currentUser.id))
      setContactsList(c)
      const fixedPending: PendingFileFormat[] = []
      for (const i of pending) {
        if (!contactsList.find(it => it.id != i.user.id)) fixedPending.push(i)
      }
      setPendingList(removeDuplicatesById<PendingFileFormat>(fixedPending, "user.id"))
    }
    helper()
  }, [])

  if (!pendingList || pendingList.length === 0) {
    return <Empty description="No pending requests" />;
  }

  return (
    <Card title="Pending Requests" className="w-full h-full" bodyStyle={{ padding: 24 }}>
      <List
        dataSource={pendingList}
        itemLayout="horizontal"
        renderItem={({ user: target, last_msg }) => (
          <List.Item
            key={target.id}
            actions={[
              <Button key="accept" type="primary" onClick={
                () => {
                  acceptGreeting(currentUser, target, last_msg, renderFunc)
                  setPendingList(pendingList.filter(it => it.user.id !== target.id))
                }
                // () => acceptGreeting(user, target, last_msg, () => setPendingList(pendingList.filter(it => it.user.id !== target.id)))
              }>
                Accept
              </Button>,
              // <Button key="decline" type="primary" onClick={() => declineGreeting(user, last_msg)}>
                // Decline
              // </Button>
            ]}
          >
            <List.Item.Meta
              avatar={
                <Avatar
                  src={target.avatar_id ? `/sprites/avatar-${currentUser.avatar_id}.png` : undefined}
                >
                  {target.username?.charAt(0)?.toUpperCase() ?? "?"}
                </Avatar>
              }
              title={target.username}
              description={last_msg?.chat_message}
            />
          </List.Item>
        )}
      />
    </Card>
  );
};