'use server'

// this needs fix, but later, right now we will use a dummy function
import { registerUser } from '@/utils/api'
import { auth, clerkClient } from '@clerk/nextjs/server'

export const completeOnboarding = async (formData: CustomJwtSessionClaims) => {
  const { userId } = await auth()

  if (!userId) {
    return { message: 'No Logged In User' }
  }

  const client = await clerkClient()

  try {
    const user = await client.users.getUser(userId)
    await registerUser(userId, user, formData)
    const res = await client.users.updateUser(userId, {
      publicMetadata: {
        onboardingComplete: formData.metadata.onboardingComplete,
        nickname: formData.metadata.nickname
      },
    })
    return { message: res.publicMetadata }
  } catch (err) {
    return { error: `There was an error updating the user metadata. ${err}` }
  }
}