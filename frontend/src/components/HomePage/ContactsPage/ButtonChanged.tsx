import { CheckOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { ReactNode, useState } from "react";

export default function ButtonChanged({
  fn,
  display = <CheckOutlined style={{ color: "green" }} />,
  text
}: 
{
  fn: () => Promise<void>,
  display: ReactNode,
  text: string
}) {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    setLoading(true);
    await fn();
    // sendGreetings(user.id, user.username, target.id);
    setSent(true);
    setLoading(false);
  };

  return (
    <Button
      type={sent ? "default" : "dashed"} // dashed = border-only
      onClick={handleSend}
      icon={sent ? display : undefined}
      loading={loading}
      disabled={sent}
    >
      {!sent && text}
    </Button>
  );
};