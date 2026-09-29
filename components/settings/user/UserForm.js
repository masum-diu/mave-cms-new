import React, { useEffect, useMemo, useState } from "react";
import { Form, Input, Button, Modal, message, Progress, Typography } from "antd";
import { CopyOutlined, CheckOutlined, EyeOutlined, EyeInvisibleOutlined } from "@ant-design/icons";
import instance from "../../../axios";
import {
  canManageUsers,
  resolveUserRoleId,
  formatRoleIdForApi,
  unwrapRoleId,
} from "../../../utils/roles";
import { rememberCreatedUserPassword } from "../../../utils/userTempPasswords";

const { Text } = Typography;

const CopyRow = ({ label, value }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(String(value));
      setCopied(true);
      message.success(`${label} copied`);
      setTimeout(() => setCopied(false), 1500);
    } catch (_) {
      message.error("Could not copy");
    }
  };

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>
        {label}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "#f9fafb",
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          padding: "8px 10px",
        }}
      >
        <code
          style={{
            flex: 1,
            fontSize: 14,
            wordBreak: "break-all",
            color: "#111827",
          }}
        >
          {value || "—"}
        </code>
        <Button
          type="text"
          size="small"
          icon={copied ? <CheckOutlined /> : <CopyOutlined />}
          onClick={handleCopy}
          disabled={!value}
        >
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
    </div>
  );
};

const UserForm = ({
  visible,
  fetchUsers,
  onCancel,
  initialValues,
  roles = [],
  currentUser,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [plainPassword, setPlainPassword] = useState("");
  const [createdCreds, setCreatedCreds] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const canCreateUser = canManageUsers(currentUser);
  const userRoleId = useMemo(() => resolveUserRoleId(roles), [roles]);

  useEffect(() => {
    if (visible && !canCreateUser) {
      message.error("You don't have permission to create users");
      onCancel();
    }
  }, [visible, canCreateUser, onCancel]);

  useEffect(() => {
    if (visible) {
      form.resetFields();
      form.setFieldsValue({
        role_id: userRoleId,
        ...(initialValues || {}),
      });
      setPasswordStrength(0);
      setPlainPassword("");
      setCreatedCreds(null);
      setShowPassword(false);
    }
  }, [visible, form, initialValues, userRoleId]);

  const closeAll = () => {
    setCreatedCreds(null);
    form.resetFields();
    setPlainPassword("");
    onCancel?.();
  };

  const handleCreateUser = async () => {
    if (!canCreateUser) {
      message.error("You don't have permission to create users");
      return;
    }

    try {
      const values = await form.validateFields();
      setLoading(true);

      const payload = {
        name: values.name,
        email: values.email,
        phone: values.phone || "",
        password: values.password,
        password_confirmation: values.password_confirmation,
        role_id: formatRoleIdForApi(userRoleId),
      };

      const response = await instance.post("/admin/user", payload);
      if (response.status === 201 || response.status === 200) {
        const created = response?.data?.data || response?.data?.user || response?.data;
        const createdId = created?.id;

        if (
          createdId &&
          String(unwrapRoleId(created?.role_id)) !== String(userRoleId)
        ) {
          try {
            await instance.put(`/admin/user/${createdId}`, {
              name: created.name || values.name,
              email: created.email || values.email,
              phone: created.phone || values.phone || "",
              role_id: formatRoleIdForApi(userRoleId),
            });
          } catch (_) {}
        }

        fetchUsers?.();

        // Keep password for User Details (See) in this browser session
        if (createdId) rememberCreatedUserPassword(createdId, values.password);
        if (values.email) {
          rememberCreatedUserPassword(
            values.email.toLowerCase(),
            values.password
          );
        }

        setCreatedCreds({
          name: values.name,
          email: values.email,
          password: values.password,
        });
        message.success("User created — password is available in User Details");
      }
    } catch (error) {
      if (error?.errorFields) return;
      if (error.response?.status === 403) {
        message.error("You don't have permission to create users");
      } else {
        const apiMessage =
          error.response?.data?.message ||
          (error.response?.data?.errors &&
            Object.values(error.response.data.errors).flat()[0]);
        message.error(
          apiMessage || "Something went wrong while creating the user."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const passwordGenerator = () => {
    const randomPassword =
      Math.random().toString(36).slice(-6) +
      Math.random().toString(36).slice(-4).toUpperCase() +
      "1!";
    form.setFieldsValue({
      password: randomPassword,
      password_confirmation: randomPassword,
    });
    setPlainPassword(randomPassword);
    setShowPassword(true);
    checkPasswordStrength(randomPassword);
  };

  const checkPasswordStrength = (password) => {
    if (!password) {
      setPasswordStrength(0);
      return;
    }
    let strength = 0;
    if (password.length >= 6) strength += 30;
    if (/[A-Z]/.test(password)) strength += 20;
    if (/[0-9]/.test(password)) strength += 20;
    if (/[^A-Za-z0-9]/.test(password)) strength += 30;
    setPasswordStrength(strength);
  };

  const copyAllCreds = async () => {
    if (!createdCreds) return;
    const text = `Name: ${createdCreds.name}\nEmail: ${createdCreds.email}\nPassword: ${createdCreds.password}`;
    try {
      await navigator.clipboard.writeText(text);
      message.success("All credentials copied");
    } catch (_) {
      message.error("Could not copy");
    }
  };

  if (!visible || !canCreateUser) {
    return null;
  }

  // After create — show password so admin can share it
  if (createdCreds) {
    return (
      <Modal
        open
        title="User created — share these credentials"
        onCancel={closeAll}
        footer={[
          <Button key="copy" icon={<CopyOutlined />} onClick={copyAllCreds}>
            Copy all
          </Button>,
          <Button
            key="done"
            type="primary"
            onClick={closeAll}
            style={{
              backgroundColor: "var(--theme)",
              borderColor: "var(--theme)",
              color: "#111",
              fontWeight: 600,
            }}
          >
            Done
          </Button>,
        ]}
      >
        <Text type="secondary" style={{ display: "block", marginBottom: 14 }}>
          Password is only shown once. Copy it now and send to the user.
        </Text>
        <CopyRow label="Name" value={createdCreds.name} />
        <CopyRow label="Email" value={createdCreds.email} />
        <CopyRow label="Password" value={createdCreds.password} />
      </Modal>
    );
  }

  return (
    <Modal
      open={visible}
      title="Create New User"
      onCancel={onCancel}
      footer={[
        <Button key="back" onClick={onCancel} danger>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={handleCreateUser}
          style={{
            backgroundColor: "var(--theme)",
            borderColor: "var(--theme)",
            color: "white",
            fontWeight: 600,
          }}
        >
          Create
        </Button>,
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        name="userForm"
        initialValues={{ role_id: userRoleId, ...(initialValues || {}) }}
        onValuesChange={(changedValues) => {
          if (changedValues.password !== undefined) {
            setPlainPassword(changedValues.password || "");
            checkPasswordStrength(changedValues.password || "");
          }
        }}
      >
        <Form.Item
          name="name"
          label="Name"
          rules={[{ required: true, message: "Please input the name!" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item name="phone" label="Phone">
          <Input />
        </Form.Item>
        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: "Please input the email!" },
            { type: "email", message: "Please enter a valid email!" },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="password"
          label="Password"
          rules={[
            { required: true, message: "Please input the password!" },
            { min: 6, message: "Password must be at least 6 characters!" },
          ]}
        >
          <Input
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            addonAfter={
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  const pwd =
                    form.getFieldValue("password") || plainPassword || "";
                  setPlainPassword(pwd);
                  setShowPassword((v) => !v);
                }}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "#374151",
                  fontWeight: 700,
                  cursor: "pointer",
                  padding: "0 10px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                {showPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                {showPassword ? "Hide" : "See"}
              </button>
            }
          />
        </Form.Item>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 8,
            flexWrap: "wrap",
          }}
        >
          <Button onClick={passwordGenerator}>Generate Password</Button>
          {plainPassword ? (
            <Button
              icon={<CopyOutlined />}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(plainPassword);
                  message.success("Password copied");
                } catch (_) {
                  message.error("Could not copy");
                }
              }}
            >
              Copy password
            </Button>
          ) : null}
        </div>
        {showPassword && plainPassword ? (
          <div
            style={{
              marginBottom: 10,
              padding: "8px 10px",
              background: "#fffbeb",
              border: "1px solid #fcd34d",
              borderRadius: 8,
              fontSize: 13,
            }}
          >
            Password: <code style={{ fontWeight: 700 }}>{plainPassword}</code>
          </div>
        ) : null}
        <Progress
          percent={passwordStrength}
          showInfo={false}
          strokeColor={{
            "0%": "#ff4d4f",
            "100%": "#52c41a",
          }}
          style={{ marginBottom: 8 }}
        />
        <Form.Item
          name="password_confirmation"
          label="Confirm Password"
          rules={[
            { required: true, message: "Please confirm the password!" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("password") === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error("Passwords do not match!"));
              },
            }),
          ]}
        >
          <Input
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
          />
        </Form.Item>
        <Form.Item name="role_id" hidden>
          <Input type="hidden" />
        </Form.Item>
        <Form.Item label="Role">
          <Input value="User" disabled />
          <div style={{ marginTop: 6, fontSize: 12, color: "#6b7280" }}>
            Created accounts always get the User role (not Admin).
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default UserForm;
