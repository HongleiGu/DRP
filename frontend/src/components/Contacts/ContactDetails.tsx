import React from "react";
import { SupabaseUser } from "@/types/datatypes";
import { Card, Avatar, Typography, Empty } from "antd";
import { RestOutlined } from "@ant-design/icons";
import ButtonChanged from "../HomePage/ContactsPage/ButtonChanged"; // Assuming this component is correct
import { deleteContact } from "@/utils/contacts/utils";

const { Text } = Typography;

// Define props interface for ContactDetails
interface ContactDetailProps {
  contact: SupabaseUser | undefined;  // The contact to display, or undefined if not selected
  currentUser: SupabaseUser;  // The current user performing the action
  renderFunc: null | ((target: SupabaseUser) => void);  // Function to trigger re-render after deleting a contact
}

export default function ContactDetails ({
  contact,
  currentUser,
  renderFunc
}
: ContactDetailProps) {
  if (!contact) {
    return <Empty description="Select a contact to view details" />;
  }

  return (
    <Card title={contact.username} className="w-full h-full" bodyStyle={{ padding: 24 }}>
      <div className="flex flex-col items-center gap-4">
        <Avatar
          size={96}
          src={contact.avatar_id ? `/sprites/avatar-${contact.avatar_id}.png` : undefined}
          style={{ backgroundColor: "#1677ff" }}
        >
          {contact.username?.charAt(0)?.toUpperCase() ?? "?"}
        </Avatar>
        <Text>Email: {contact.email || "N/A"}</Text>
        <Text>ID: {contact.id}</Text>
        { 
          renderFunc &&
          <ButtonChanged
            display={<RestOutlined>Delete Contact</RestOutlined>}
            fn={async () => await deleteContact(currentUser, contact, renderFunc)}
            text={""}
          />
        }
      </div>
    </Card>
  );
};