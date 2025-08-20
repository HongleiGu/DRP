"use client"

import React, { useState } from "react"
import { Typography, Button, Row, Col, Input, Form } from "antd"
import { LeftOutlined, RightOutlined } from "@ant-design/icons"
import { LumiAvatar } from "../LumiAvatar"
// import globalStore from "@/store"
import { SupabaseUser } from "@/types/datatypes"
import { LoadingSpinner } from "../Lumiroom/LoadingSpinner"
import { updateUserProfile } from "@/utils/user"
// import { usePathname, useRouter } from "next/navigation"

const { Title, Text } = Typography

export default function ProfilePage({user}: {user: SupabaseUser}) {
  // const [user, setUser] = useState<SupabaseUser>(null!)
  const [isEditing, setIsEditing] = useState(false)
  const [avatarId, setAvatarId] = useState<number>(1)
  // const router = useRouter()
  // const pathname = usePathname()

  // useEffect(() => {
  //   if (pathname !== "/") return;
  //   const helper = async () => {
  //     const u = await globalStore.getItem<SupabaseUser>("lumiroom-user")
  //     if (!u || !u.id) {
  //       router.push("/auth")
  //       return
  //     }
  //     setUser(u)
  //     setAvatarId(u.avatar_id)
  //   }
  //   helper()
  // }, [router, pathname])

  const handleAvatarNavigation = (direction: "prev" | "next") => {
    setAvatarId((prev) => {
      if (direction === "prev") return prev > 1 ? prev - 1 : 32
      return prev < 32 ? prev + 1 : 1
    })
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center h-96">
        <LoadingSpinner />
        <Text type="danger">User not found.</Text>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto mt-10 px-4 md:px-6">
      <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center text-center">
        <div className="w-36 h-36 rounded-full overflow-hidden border-4 border-gray-200 mb-6">
          <LumiAvatar avatarId={avatarId} />
        </div>

        {!isEditing ? (
          <Button type="primary" onClick={() => setIsEditing(true)}>
            Edit Avatar
          </Button>
        ) : (
          <div className="w-full mt-4">
            <Form layout="vertical">
              <Form.Item label="Avatar">
                <Row justify="center" align="middle" gutter={16}>
                  <Col>
                    <Button icon={<LeftOutlined />} onClick={() => handleAvatarNavigation("prev")} />
                  </Col>
                  <Col>
                    <div
                      key={avatarId}
                      className="transition-opacity duration-300 ease-in-out opacity-100"
                    >
                      <LumiAvatar avatarId={avatarId} />
                    </div>
                  </Col>
                  <Col>
                    <Button icon={<RightOutlined />} onClick={() => handleAvatarNavigation("next")} />
                  </Col>
                </Row>
              </Form.Item>

              <Form.Item
                label="Avatar ID"
                name="avatar_id"
                rules={[
                  { required: true, message: "Please enter an avatar ID" },
                  {
                    pattern: /^\d+$/,
                    message: "Avatar ID must be a number",
                  },
                  {
                    validator: (_, value) =>
                      value >= 1 && value <= 32
                        ? Promise.resolve()
                        : Promise.reject(new Error("Avatar ID must be between 1 and 32")),
                  },
                ]}
                initialValue={avatarId}
              >
                <Input
                  type="number"
                  min={1}
                  max={32}
                  value={avatarId}
                  onChange={(e) => {
                    const val = Number(e.target.value)
                    setAvatarId(val)
                  }}
                />
              </Form.Item>

              <Row justify="center" gutter={16}>
                <Col>
                  <Button type="primary" onClick={() => {
                    setIsEditing(false)
                    updateUserProfile({id: user.id, avatar_id: avatarId}) // id must be present when updateing user profile
                  }}>
                    Save
                  </Button>
                </Col>
                <Col>
                  <Button onClick={() => {
                    setAvatarId(user.avatar_id)
                    setIsEditing(false)
                  }}>
                    Cancel
                  </Button>
                </Col>
              </Row>
            </Form>
          </div>
        )}

        <Title level={3} className="!mb-6 mt-6">My Profile</Title>

        <div className="space-y-4 w-full">
          <div className="bg-gray-50 p-4 rounded-lg text-left shadow-sm">
            <Text className="text-gray-500 block text-xl uppercase tracking-wide mb-1">Username</Text>
            <Text className="text-base text-gray-800">{user.username}</Text>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg text-left shadow-sm">
            <Text className="text-gray-500 block text-xl uppercase tracking-wide mb-1">Email</Text>
            <Text className="text-base text-gray-800">{user.email}</Text>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg text-left shadow-sm">
            <Text className="text-gray-500 block text-xl uppercase tracking-wide mb-1">User ID</Text>
            <Text className="text-base text-gray-800 break-all">{user.id}</Text>
          </div>
        </div>
      </div>
    </div>
  )
}
