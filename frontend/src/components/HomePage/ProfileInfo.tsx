"use client"

import React, { useEffect, useState } from "react"
import { Typography } from "antd"
import { LumiAvatar } from "../LumiAvatar"
import globalStore from "@/store"
import { SupabaseUser } from "@/types/datatypes"
import { LoadingSpinner } from "../Lumiroom/LoadingSpinner"
// import { useGlobalStore } from "@/store"
// import { paths } from "@/game/config/resources"

const { Title, Text } = Typography

export default function ProfileInfo() {
  const [user, setUser] = useState<SupabaseUser>(null!)

  useEffect(() => {
    const helper = async() => {
      const u = await globalStore.getItem<SupabaseUser>('lumiroom-user')
      if (!u || !u.id) {
        window.location.href = "/auth"
        return;
      }
      setUser(u)
    }
    helper()
  })

  if (!user) {
    return (
      <div className="flex justify-center items-center h-96">
        <LoadingSpinner/>
        <Text type="danger">User not found.</Text>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto mt-10 px-4 md:px-6">
      <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center text-center">
        <div className="w-36 h-36 rounded-full overflow-hidden border-4 border-gray-200 mb-6">
          <LumiAvatar avatarId={user.avatar_id}/>
        </div>

        <Title level={3} className="!mb-6">My Profile</Title>

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
