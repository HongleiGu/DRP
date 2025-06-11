'use client'

import React, { useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { completeOnboarding } from '@/actions/onboarding'
import { Form, Input, Button, Typography } from 'antd'
import { z } from 'zod'
// import { getUsers } from '@/utils/api'
const { Title } = Typography

// Zod schema matching your custom JWT claims
const onboardingSchema = z.object({
  nickname: z.string().min(2, 'Nickname must be at least 2 characters'),
  avatarId: z.string(),
  onboardingComplete: z.literal(true)
})

type OnboardingFormValues = z.infer<typeof onboardingSchema>

export default function OnboardingComponent() {
  const [error, setError] = React.useState<string>('')
  // const { userId } = useAuth()
  const { user } = useUser()
  const router = useRouter()
  const [form] = Form.useForm()

  useEffect(() => {
    if (user?.publicMetadata?.nickname) {
      router.replace("/")
      return
    }
  }, [user, router]);

  const onFinish = async (values: Omit<OnboardingFormValues, 'onboardingComplete'>) => {
    try {
      // Validate with Zod
      const validatedValues = onboardingSchema.parse({
        ...values,
        onboardingComplete: true
      })

      const res = await completeOnboarding({metadata: validatedValues} as CustomJwtSessionClaims)

      if (res?.message) {
        await user?.reload()
        router.push('/')
      }
      if (res?.error) {
        setError(res.error)
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        // Handle Zod validation errors
        const errorMessages = err.errors.map(e => e.message).join(', ')
        setError(`Validation error: ${errorMessages}`)
      } else {
        setError('An unexpected error occurred')
      }
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <Title level={1} style={{ textAlign: 'center' }}>Welcome</Title>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        autoComplete="off"
      >
        <Form.Item
          label="Nickname"
          name="nickname"
          help="Enter your preferred nickname (min 2 characters)"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="AvatarID"
          name="avatarId"
          help="Enter a number from 1 to 32"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>

        {error && (
          <div style={{ color: '#ff4d4f', marginBottom: 16 }}>
            Error: {error}
          </div>
        )}

        <Form.Item>
          <Button type="primary" htmlType="submit" block>
            Complete Onboarding
          </Button>
        </Form.Item>
      </Form>
    </div>
  )
}