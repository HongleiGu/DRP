export async function getUserId(): Promise<string> {
  const res = await fetch('/api/user/userId');
  const data = (await res.json() as { userId: string }).userId
  return data
}