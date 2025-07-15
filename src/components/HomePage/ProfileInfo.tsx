"use client"

import React from "react"
import { useUser } from "@clerk/nextjs"
import { Typography, Spin } from "antd"
import { LumiAvatar } from "../LumiAvatar"
// import { paths } from "@/game/config/resources"

const { Title, Text } = Typography

export default function ProfileInfo() {
  const { user, isLoaded } = useUser()

  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spin size="large" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center h-96">
        <Text type="danger">User not found.</Text>
      </div>
    )
  }

  const nickname = user.publicMetadata?.nickname as string ?? "Mr. unknown"
  const avatarId = user.publicMetadata?.avatarId as string ?? "0"

  return (
    <div className="max-w-md mx-auto mt-10 px-4 md:px-6">
      <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center text-center">
        <div className="w-36 h-36 rounded-full overflow-hidden border-4 border-gray-200 mb-6">
          <LumiAvatar avatarId={avatarId}/>
        </div>

        <Title level={3} className="!mb-6">My Profile</Title>

        <div className="space-y-4 w-full">
          <div className="bg-gray-50 p-4 rounded-lg text-left shadow-sm">
            <Text className="text-gray-500 block text-xl uppercase tracking-wide mb-1">Nickname</Text>
            <Text strong className="text-lg text-gray-800">{nickname ?? "Not set"}</Text>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg text-left shadow-sm">
            <Text className="text-gray-500 block text-xl uppercase tracking-wide mb-1">Username</Text>
            <Text className="text-base text-gray-800">{user.username ?? "Not set"}</Text>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg text-left shadow-sm">
            <Text className="text-gray-500 block text-xl uppercase tracking-wide mb-1">Email</Text>
            <Text className="text-base text-gray-800">{user.emailAddresses?.[0]?.emailAddress ?? "Not set"}</Text>
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
