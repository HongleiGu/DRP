export {}

declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      onboardingComplete?: boolean
      nickname: string, // a random attribute for testing
    }
  }
}