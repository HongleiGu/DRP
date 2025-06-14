"use client";
import { useState } from "react";
import { Modal, Form, Input, Button, Typography, message } from "antd";
import { useStreamVideoClient } from "@stream-io/video-react-sdk";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";

interface Props {
  enable: boolean;
  setEnable: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function InstantMeeting({ enable, setEnable }: Props) {
  const [showMeetingLink, setShowMeetingLink] = useState(false);
  const [facetimeLink, setFacetimeLink] = useState<string>("");

  const closeModal = () => {
    setEnable(false);
    // Reset state when modal closes
    setTimeout(() => {
      setShowMeetingLink(false);
      setFacetimeLink("");
    }, 300);
  };

  return (
    <Modal
      open={enable}
      onCancel={closeModal}
      footer={null}
      centered
      className="max-w-2xl w-full"
    >
      <div className="p-6">
        {showMeetingLink ? (
          <MeetingLink facetimeLink={facetimeLink} />
        ) : (
          <MeetingForm
            setShowMeetingLink={setShowMeetingLink}
            setFacetimeLink={setFacetimeLink}
          />
        )}
      </div>
    </Modal>
  );
}

const MeetingForm = ({
  setShowMeetingLink,
  setFacetimeLink,
}: {
  setShowMeetingLink: React.Dispatch<React.SetStateAction<boolean>>;
  setFacetimeLink: React.Dispatch<React.SetStateAction<string>>;
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const client = useStreamVideoClient();
  const { user } = useUser();

  const handleStartMeeting = async (values: { description: string }) => {
		// console.log(client, user)
    if (!client || !user) return;
    
    setLoading(true);
    try {
      const id = crypto.randomUUID();
      const call = client.call("default", id);
      if (!call) throw new Error("Failed to create meeting");

      await call.getOrCreate({
        data: {
          starts_at: new Date(Date.now()).toISOString(),
          custom: {
            description: values.description,
          },
        },
      });

      setFacetimeLink(call.id);
      setShowMeetingLink(true);
    } catch (error) {
      console.error(error);
      message.error("Failed to create Meeting");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Typography.Title
        level={3}
        className="text-center !text-green-600 !mb-2"
      >
        Create Instant FaceTime
      </Typography.Title>

      <Typography.Text type="secondary" className="block text-center mb-6">
        You can start a new FaceTime instantly.
      </Typography.Text>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleStartMeeting}
        className="w-full"
      >
        <Form.Item
          label="Meeting Description"
          name="description"
          rules={[
            { required: true, message: "Please enter a meeting description" }
          ]}
        >
          <Input
            placeholder="Enter a description for the meeting"
            size="large"
          />
        </Form.Item>

        <Button
          type="primary"
          htmlType="submit"
          size="large"
          loading={loading}
          className="w-full bg-green-600 hover:bg-green-700 !text-white"
        >
          Proceed
        </Button>
      </Form>
    </>
  );
};

const MeetingLink = ({ facetimeLink }: { facetimeLink: string }) => {
  const fullLink = `${process.env.NEXT_PUBLIC_FACETIME_HOST}/${facetimeLink}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullLink);
    message.success("Link copied to clipboard!");
  };

  return (
    <>
      <Typography.Title
        level={3}
        className="text-center !text-green-600 !mb-2"
      >
        Copy FaceTime Link
      </Typography.Title>

      <Typography.Text type="secondary" className="block text-center mb-6">
        Share this link with others to join the FaceTime
      </Typography.Text>

      <div className="flex items-center mb-6">
        <Input
          value={fullLink}
          readOnly
          className="flex-1"
          size="large"
        />
        <Button
          // icon={<FaCopy />}
          onClick={handleCopy}
          className="ml-2 h-10 flex items-center"
        />
      </div>

      <Link href={fullLink}>
        <Button
          type="primary"
          size="large"
          className="w-full bg-green-600 hover:bg-green-700 !text-white"
        >
          Start FaceTime
        </Button>
      </Link>
    </>
  );
};