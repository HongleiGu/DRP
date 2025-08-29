"use client";

import React, { useState } from "react";
import { Form, Input, Button, Typography, Alert, Card, Tabs } from "antd";
import { LoginOutlined, UserOutlined } from "@ant-design/icons";
import { LumiAvatar } from "@/components/LumiAvatar";
import { signIn, signOut, verifyOtp, requestOtp, checkUsername } from "@/utils/user";
import { SupabaseUser, SignInArgs } from "@/types/datatypes";
import globalStore from "@/store";
import { debounce } from "lodash";
import { useRouter } from "next/navigation";
import "@/app/globals.css";


const { Title } = Typography;

export default function AuthPage() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [formType, setFormType] = useState<"login" | "register">("login");
  const [step, setStep] = useState<"register" | "verify">("register");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  const [loginForm] = Form.useForm();
  const [registerForm] = Form.useForm();
  const [verifyForm] = Form.useForm();

  const router = useRouter();

  const debouncedCheck = debounce(async (field: "username" | "email", value: string) => {
    if (!value) {
      if (field === "username")
        setUsernameError(null)
      else
        setEmailError(null);
      return;
    }
    try {
      const available = !(await checkUsername(value));
      if (field === "username") setUsernameError(available ? null : "Username is already taken");
      else setEmailError(available ? null : "Email is already registered");
    } catch {
      if (field === "username") 
        setUsernameError(null)
      else 
        setEmailError(null);
    }
  }, 500);

  const onRegister = async (values: Omit<SupabaseUser, "id" | "created_at" | "onboarding_complete"> & { password: string }) => {
    setLoading(true);
    setError(null);
    const { username, email } = values;
    try {
      setEmail(email);
      await requestOtp(email, username, values.password);
      setStep("verify");
    } catch (err) {
      if (err instanceof Error) setError(err.message || "Registration failed.");
      else setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const onVerify = async (values: { token: string }) => {
    setLoading(true);
    setError(null);
    try {
      const data = await verifyOtp(values.token, email);
      if (!data || !data.user || !data.token) throw new Error("Verification returned invalid user data");
      await globalStore.setItem<SupabaseUser>('lumiroom-user', data.user);
      await globalStore.setItem<string>('jwt-token', data.token);
      console.log("onVerify", user);
      router.push("/");
    } catch (err) {
      if (err instanceof Error) setError(err.message || "Verification failed.");
      else setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const onLogin = async (values: SignInArgs) => {
    setLoading(true);
    setError(null);
    try {
      const emailToUse = values.email || values.username;
      if (!emailToUse) throw new Error("Either username or email must be provided");

      const resUser = await signIn({ identifier: emailToUse, password: values.password });
      if (resUser) {
        setUser(resUser);
        await globalStore.setItem<SupabaseUser>('lumiroom-user', resUser);
        console.log("onLogin");
        router.push("/")
      } else setError("Invalid username/email or password");
    } catch (err) {
      if (err instanceof Error) setError(err.message || "Login failed.");
      else setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const onLogout = async () => {
    setLoading(true);
    try {
      await signOut();
      setUser(null);
      await globalStore.removeItem('lumiroom-user');
    } catch (err) {
      if (err instanceof Error) setError(err.message || "Logout failed.");
      else setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const LoginForm = () => (
    <Form form={loginForm} layout="vertical" onFinish={onLogin} autoComplete="off">
      <Form.Item
        label="Username or Email"
        name="username"
        rules={[{ required: true, message: "Please enter username or email" }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        label="Password"
        name="password"
        rules={[{ required: true, message: "Please enter your password" }]}
      >
        <Input.Password />
      </Form.Item>
      {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />}
      <Button type="primary" htmlType="submit" loading={loading} block>
        Login
      </Button>
    </Form>
  );

  const RegisterForm = () => (
    <Form form={registerForm} layout="vertical" onFinish={onRegister} autoComplete="off">
      <Form.Item
        label="Username"
        name="username"
        validateStatus={usernameError ? "error" : undefined}
        help={usernameError}
        rules={[
          { required: true, message: "Please enter a username" },
          { min: 3, message: "Username must be at least 3 characters" },
          { max: 20, message: "Username must be at most 20 characters" },
        ]}
      >
        <Input onChange={(e) => debouncedCheck("username", e.target.value)} />
      </Form.Item>

      <Form.Item
        label="Email"
        name="email"
        validateStatus={emailError ? "error" : undefined}
        help={emailError}
        rules={[
          { required: true, message: "Please enter an email" },
          { type: "email", message: "Please enter a valid email" },
        ]}
      >
        <Input onChange={(e) => debouncedCheck("email", e.target.value)} />
      </Form.Item>

      <Form.Item
        label="Password"
        name="password"
        rules={[
          { required: true, message: "Please enter a password" },
          { min: 3, message: "Password must be at least 3 characters" },
        ]}
      >
        <Input.Password />
      </Form.Item>

      {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />}
      <Button type="primary" htmlType="submit" loading={loading} block>
        Register & Send OTP
      </Button>
    </Form>
  );

  const VerifyOtpForm = () => (
    <Form form={verifyForm} layout="vertical" onFinish={onVerify} autoComplete="off">
      <Form.Item
        label="Enter the confirmation code from your email"
        name="token"
        rules={[{ required: true, message: "Please enter the verification code" }]}
      >
        <Input.OTP
          length={6}
          separator={<span>/</span>}
          onChange={(val) => verifyForm.setFieldsValue({ token: val })}
          autoFocus
        />
      </Form.Item>

      {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />}
      <div className="flex gap-2">
        <Button type="primary" htmlType="submit" loading={loading} className="flex-1">
          Verify Email
        </Button>
        <Button type="default" onClick={() => setStep("register")} className="flex-1">
          Return
        </Button>
      </div>
    </Form>
  );

  if (user) {
    return (
      <Card style={{ maxWidth: 500, margin: "40px auto", textAlign: "center" }}>
        <Title level={3}>Welcome, {user.username}</Title>
        <div key={user.avatar_id} className="transition-opacity duration-300 ease-in-out opacity-100" style={{ marginBottom: 16 }}>
          <LumiAvatar avatarId={user.avatar_id} />
        </div>
        <Button type="primary" danger onClick={onLogout} loading={loading} style={{ marginTop: 24 }} block>
          Logout
        </Button>
      </Card>
    );
  }

  const items = [
    { key: "login", label: <><LoginOutlined />Login</>, children: <LoginForm /> },
    { key: "register", label: <><UserOutlined />Register</>, children: step === "register" ? <RegisterForm /> : <VerifyOtpForm /> },
  ];

  return (
    <div style={{ maxWidth: 500, margin: "60px auto", padding: 24 }}>
      <Card>
        <Tabs
          activeKey={formType}
          onChange={(key) => {
            setFormType(key as "login" | "register");
            setStep("register");
            setError(null);
            setUsernameError(null);
            setEmailError(null);
            loginForm.resetFields();
            registerForm.resetFields();
            verifyForm.resetFields();
          }}
          items={items}
        />
      </Card>
    </div>
  );
}
