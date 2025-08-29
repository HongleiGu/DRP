import { Room, SupabaseUser } from "@/types/datatypes";
import { getRoom } from "@/utils/api";
import { Badge, Modal, Row, Col } from "antd";
import { useCallback, useEffect, useState } from "react";
import { PlusOutlined } from "@ant-design/icons";
import { LumiAvatar } from "@/components/LumiAvatar";
import { SearchPanel } from "@/components/Contacts/SearchPanel";
import { sendInviteMessage } from "@/utils/messaging/templates";

interface GroupManagementPanelProps {
  visible: boolean;
  onClose: () => void;
  chatroomId: string;
  currentUser: SupabaseUser
}

export default function GroupManagementPanel({
  visible,
  onClose,
  chatroomId,
  currentUser
}: GroupManagementPanelProps) {
  const [room, setRoom] = useState<Room>(null!);
  const [showContactsPanel, setShowContactsPanel] = useState<boolean>(false);

  // Load members from server (replace with actual API logic)
  const loadMembers = useCallback(async () => {
    console.log("roomId", chatroomId)
    const room = await getRoom(chatroomId);
    console.log(room)
    setRoom(room);
  }, [chatroomId]);

  useEffect(() => {
    if (visible) {
      loadMembers();
    }
  }, [visible, loadMembers]);

  return (
    <Modal
      title="Group Management"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={600}
    >
      <Row gutter={[16, 16]}>
        {/* Display members in a grid */}
        {room && room.members.map((member) => (
          <Col span={6} key={member.id}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "8px",
                backgroundColor: member.id === room.creator_id ? "#e0f7fa" : "transparent",
                borderRadius: "8px",
              }}
            >
              <LumiAvatar avatarId={member.avatar_id} />
              <span className="font-semibold">{member.username}</span>
              {member.id === room.creator_id && <Badge status="success" text="Creator" />}
              <span>{member.id === room.creator_id ? "Creator" : "Member"}</span>
            </div>
          </Col>
        ))}

        {/* Placeholder for adding a new member */}
        {room && <Col span={6}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "8px",
              backgroundColor: "#f0f0f0",
              borderRadius: "8px",
              cursor: room.type === "personal" ? "not-allowed" : "pointer",
              height: "120px",
              border: "2px dashed #d9d9d9",
              opacity: room.type === "personal" ? 0.5 : 1, // dim if disabled
            }}
            onClick={() => {
              if (room.type !== "personal") {
                setShowContactsPanel(true);
              }
            }}
          >
            <PlusOutlined style={{ fontSize: "32px", color: "#1890ff" }} />
            <span>{room.type == 'public' ? 'Add New Member' : 'Not allowed to add member in a personal group'}</span>
          </div>
        </Col>}

      </Row>
      { showContactsPanel &&
        <SearchPanel 
          currentUser={currentUser} 
          open={showContactsPanel} 
          onClose={() => {setShowContactsPanel(false)}} 
          send={
            async (currentUser, target) => await sendInviteMessage(
              currentUser,
              room.id,
              [target.id]
            )
          }
        />
      }
    </Modal>
  );
}
