// components/ProtectedContent.tsx
"use client"
import { useUser } from "@clerk/nextjs";
import { RedirectToSignIn } from "@clerk/nextjs";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "antd";

export default function ProtectedContent() {
  // Properly access user data
  const { isLoaded, user } = useUser();
  const router = useRouter();

  // Handle loading state
  if (!isLoaded) return <LoadingSpinner />;
  
  // Redirect if no user
  if (!user) return <RedirectToSignIn />;

  return (
    <div className="protected-content">
      <h1>Welcome back, {user.fullName ?? "User"}!</h1>
      <div className="user-details">
        {user.imageUrl && (
          <Image
            src={user.imageUrl}
            alt="Profile"
            className="avatar"
            width={80}
            height={80}
          />
        )}
        <div className="user-info">
          <p>
            <strong>Email:</strong>{" "}
            {user.primaryEmailAddress?.emailAddress ?? "No email"}
          </p>
          <p>
            <strong>User ID:</strong> {user.id}
          </p>
          {user.publicMetadata && (
            <p>
              <strong>Role: {user?.publicMetadata.applicationType}</strong>
            </p>
          )}
        </div>
        <Button
          onClick={() => router.push("/chatroom")}
        />
      </div>
    </div>
  );
}