import React, { useMemo } from "react";
import { SupabaseUser } from "@/types/datatypes";
import { Button, List, Popover, Typography } from "antd";
import { LumiAvatar } from "../LumiAvatar";
import { CheckCircleOutlined } from "@ant-design/icons";
import ButtonChanged from "../HomePage/ContactsPage/ButtonChanged";
import ContactDetails from "./ContactDetails";

const { Text } = Typography;

interface RenderSearchListProps {
  currentUser: SupabaseUser;
  searchList: SupabaseUser[];
  contactsList: SupabaseUser[];
  send: (currentUser: SupabaseUser, target: SupabaseUser) => Promise<void>
}

export default function SearchList({
  currentUser,
  searchList,
  contactsList,
  send
} : RenderSearchListProps) {
  // Memoize the list to prevent unnecessary recalculations on every render
  const items = useMemo(() => {
    return searchList.map((c) => ({
      key: c.id,
      target: c,
      label: c.username,
    }));
  }, [searchList]);

  // Render the list with user details and button actions
  return (
    <List
      dataSource={items}
      itemLayout="horizontal"
      renderItem={(item) => (
        <List.Item
          key={item.key}
          className="hover:bg-gray-100 rounded-md cursor-pointer px-2"
        >
          {item.target && (
            <>
              <List.Item.Meta
                avatar={
                  <LumiAvatar avatarId={item.target.avatar_id} />
                }
                title={<Text>{item.target.username}</Text>}
              />
              {/* You can adjust or customize the details popover logic here */}

              <div className="flex">
                <Popover content={
                  <ContactDetails 
                    contact={item.target} 
                    currentUser={currentUser} 
                    renderFunc={null}                
                  />
                }>
                  <Button type="dashed">Edit</Button>
                </Popover>
                {
                  contactsList.map((it) => it.id).includes(item.target.id) ? (
                    <Button disabled>Already in Contact</Button>
                  ) 
                    : 
                  (
                    <ButtonChanged
                      display={<CheckCircleOutlined>Sent!</CheckCircleOutlined>}
                      fn={async () => {
                        if (item.target && item.target.id)
                          await send(currentUser, item.target)
                          // await sendGreetings(
                          //   currentUser.id,
                          //   currentUser.username,
                          //   item.target.id
                          // );
                      }}
                      text="Send"
                    />
                  )
                }
              </div>
            </>
          )}
        </List.Item>
      )}
    />
  );
};