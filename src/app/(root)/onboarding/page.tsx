'use client'

import React, { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { completeOnboarding } from '@/actions/onboarding'
import { Form, Input, Button, Typography, Row, Col, Image } from 'antd'
import { z } from 'zod'
import { paths } from '@/game/config/resources'
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
  const { user } = useUser()
  const router = useRouter()
  const [form] = Form.useForm()
  const [currentAvatarId, setCurrentAvatarId] = useState('1')

  // Generate avatar images array
  const avatarImages = Array.from({ length: 32 }, (_, i) => ({
    id: (i + 1).toString(),
    image: paths.Sprites.CharacterSpritePaths(i + 1)
  }))

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

  const handleAvatarIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setCurrentAvatarId(value)
    form.setFieldsValue({ avatarId: value })
  }

  const handleAvatarNavigation = (direction: 'prev' | 'next') => {
    let newId = parseInt(currentAvatarId)
    if (isNaN(newId)) newId = 1
    
    if (direction === 'prev') {
      newId = newId <= 1 ? 32 : newId - 1
    } else {
      newId = newId >= 32 ? 1 : newId + 1
    }
    
    const newIdString = newId.toString()
    setCurrentAvatarId(newIdString)
    form.setFieldsValue({ avatarId: newIdString })
  }

  const currentAvatar = avatarImages.find(avatar => avatar.id === currentAvatarId) || avatarImages[0]

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <Title level={1} style={{ textAlign: 'center' }}>Welcome</Title>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        autoComplete="off"
        initialValues={{ avatarId: '1' }}
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
          label="Avatar"
          help="Choose your avatar"
        >
          <Row gutter={16} align="middle" justify="center">
            <Col>
              <Button onClick={() => handleAvatarNavigation('prev')}>Previous</Button>
            </Col>
            <Col>
              <Image
                src={currentAvatar.image}
                alt={`Avatar ${currentAvatar.id}`}
                width={100}
                height={100}
                preview={false}
                style={{ 
                  borderRadius: '50%', 
                  objectFit: 'cover',
                  imageRendering: 'pixelated'
                }}
              />
            </Col>
            <Col>
              <Button onClick={() => handleAvatarNavigation('next')}>Next</Button>
            </Col>
          </Row>
        </Form.Item>

        <Form.Item
          label="AvatarID"
          name="avatarId"
          help="Enter a number from 1 to 32 or use the arrows above"
          rules={[{ required: true }]}
        >
          <Input 
            type="number" 
            min="1" 
            max="32" 
            onChange={handleAvatarIdChange}
          />
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