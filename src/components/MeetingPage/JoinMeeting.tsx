"use client";
import { useRouter } from "next/navigation";
import { Modal, Form, Input, Button, Typography } from "antd";

interface Props {
  enable: boolean;
  setEnable: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function JoinMeeting({ enable, setEnable }: Props) {
  const closeModal = () => setEnable(false);

  return (
    <Modal
      open={enable}
      onCancel={closeModal}
      footer={null}
      centered
      className="max-w-2xl w-full"
    >
      <MeetingForm />
    </Modal>
  );
}

const MeetingForm = () => {
  const [form] = Form.useForm();
  const router = useRouter();

  const handleStartMeeting = (values: { link: string }) => {
    router.push(values.link);
  };

  return (
    <>
      <Typography.Title
        level={3}
        className="text-center !text-green-600 !mb-6"
      >
        Join FaceTime
      </Typography.Title>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleStartMeeting}
        className="w-full"
      >
        <Form.Item
          label="Enter the FaceTime link"
          name="link"
          rules={[
            { required: true, message: "Please enter the FaceTime link" },
            { type: "url", message: "Please enter a valid URL" }
          ]}
        >
          <Input
            type="url"
            placeholder="Enter the FaceTime link"
            size="large"
          />
        </Form.Item>

        <Button
          type="primary"
          htmlType="submit"
          size="large"
          className="w-full bg-green-600 hover:bg-green-700 !text-white"
        >
          Join now
        </Button>
      </Form>
    </>
  );
};