'use client'

import { Input } from 'antd';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Page() {
  const router = useRouter()
  const [value, setValue] = useState<string>("chatroom id")

  return (
    <div>
      <Input placeholder='chatroom id' value={value} onChange={(e) => setValue(e.target.value)}></Input>
      <p>{value}</p>
      <button
        onClick={() => router.push(`/chatroom/${value}`)}
      >go</button>
    </div>
  )
}