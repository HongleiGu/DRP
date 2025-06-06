'use server'

// this needs fix, but later, right now we will use a dummy function
import { registerUser } from '@/utils/api'
import { auth, clerkClient, User } from '@clerk/nextjs/server'

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

export async function getUserByNickname(nickname: string): Promise<User> {
  const client = await clerkClient()
  const users = await client.users.getUserList()
  return users.data.filter(it => (it.publicMetadata?.nickname as string) === nickname)[0]
}


export async function getNicknameById(userId: string): Promise<string> {
  const client = await clerkClient()
  return (await client.users.getUser(userId)).publicMetadata?.nickname as string ?? ""
  // return users.data.filter(it => it.username === username)[0].id
}