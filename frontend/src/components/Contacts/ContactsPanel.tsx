import { Message, SupabaseUser } from "@/types/datatypes";
import { PENDING_KEY } from "@/utils/utils";
import { Avatar, List, Typography } from "antd";

const { Text } = Typography

interface ContactListProps {
  contactsList: SupabaseUser[], // the list of users in contacts
  pendingList: { user: SupabaseUser, last_msg: Message | null}[], // the list of pending contacts
  setSelectedId: (key: string) => void // function to select a user by id
}

export default function ContactList ({
  contactsList,
  pendingList,
  setSelectedId,
}: ContactListProps) {
  const items: { key: string; user?: SupabaseUser; label: string; }[] = 
    [ 
      { key: PENDING_KEY, label: "Pending Requests", user: undefined },
      ...contactsList.map((c) => ({ key: c.id, user: c, label: c.username }))
    ];

  return (
    <List
      dataSource={items}
      itemLayout="horizontal"
      renderItem={(item: { key: string; user?: SupabaseUser; label: string }) => {
        if (item.key === PENDING_KEY) {
          return (
            <List.Item
              key={PENDING_KEY}
              className="hover:bg-gray-100 rounded-md cursor-pointer px-2"
              onClick={() => setSelectedId(PENDING_KEY)}
            >
              <List.Item.Meta
                avatar={<Avatar style={{ backgroundColor: "#fadb14" }}>🕓</Avatar>}
                title={<Text strong>Pending Requests</Text>}
                description={`${pendingList.length} request(s)`}
              />
            </List.Item>
          );
        }

        return (
          <List.Item
            key={item.key}
            className="hover:bg-gray-100 rounded-md cursor-pointer px-2"
            onClick={() => setSelectedId(item.key)}
          >
            {item.user && (
              <>
                <List.Item.Meta
                  avatar={
                    <Avatar
                      src={item.user.avatar_id ? `/sprites/avatar-${item.user.avatar_id}.png` : undefined}
                    >
                      {item.user.username?.charAt(0)?.toUpperCase() ?? "?"}
                    </Avatar>
                  }
                  title={<Text>{item.user.username}</Text>}
                />
              </>
            )}
          </List.Item>
        );
      }}
    />
  );
}
