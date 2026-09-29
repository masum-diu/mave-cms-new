import React, { useEffect, useState } from "react";
import { Modal, Table, Button, Avatar, message, Input } from "antd";
import {
  CopyOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
} from "@ant-design/icons";
import moment from "moment";
import { getRoleLabel } from "../../../utils/roles";
import { getRememberedUserPassword } from "../../../utils/userTempPasswords";

const UserViewModal = ({
  visible,
  user,
  onCancel,
  onEdit,
  roles = [],
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [savedPassword, setSavedPassword] = useState(null);

  useEffect(() => {
    if (visible && user) {
      setSavedPassword(getRememberedUserPassword(user));
      setShowPassword(false);
    } else {
      setSavedPassword(null);
      setShowPassword(false);
    }
  }, [visible, user]);

  const columns = [
    { title: "Field", dataIndex: "field", key: "field", width: "30%" },
    { title: "Value", dataIndex: "value", key: "value", width: "70%" },
  ];

  const dataSource = [
    {
      key: "avatar",
      field: "Avatar",
      value: user?.profile_picture ? (
        <Avatar src={user.profile_picture} size={64} />
      ) : (
        <Avatar size={64}>{user?.name?.charAt(0)?.toUpperCase()}</Avatar>
      ),
    },
    { key: "name", field: "Name", value: user?.name || "N/A" },
    { key: "email", field: "Email", value: user?.email || "N/A" },
    { key: "phone", field: "Phone", value: user?.phone || "N/A" },
    {
      key: "role",
      field: "Role",
      value: getRoleLabel(user?.role_id, roles),
    },
    {
      key: "created",
      field: "Created At",
      value: user?.created_at
        ? moment(user.created_at).format("YYYY-MM-DD HH:mm:ss")
        : "N/A",
    },
    {
      key: "updated",
      field: "Last Updated",
      value: user?.updated_at
        ? moment(user.updated_at).format("YYYY-MM-DD HH:mm:ss")
        : "N/A",
    },
  ];

  const copyPassword = async () => {
    if (!savedPassword) return;
    try {
      await navigator.clipboard.writeText(savedPassword);
      message.success("Password copied");
    } catch (_) {
      message.error("Could not copy");
    }
  };

  return (
    <Modal
      title="User Details"
      open={visible}
      onCancel={onCancel}
      width={600}
      footer={[
        <Button key="close" onClick={onCancel} danger>
          Close
        </Button>,
        <Button
          key="edit"
          type="primary"
          onClick={onEdit}
          style={{
            backgroundColor: "var(--theme)",
            borderColor: "var(--theme)",
          }}
        >
          Edit User
        </Button>,
      ]}
    >
      <Table
        columns={columns}
        dataSource={dataSource}
        pagination={false}
        showHeader={false}
        bordered
      />

      <div
        style={{
          marginTop: 16,
          padding: 12,
          background: "#f9fafb",
          border: "1px solid #e5e7eb",
          borderRadius: 8,
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Password</div>

        {savedPassword ? (
          <>
            <Input
              value={savedPassword}
              type={showPassword ? "text" : "password"}
              readOnly
              addonAfter={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
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
            <div style={{ marginTop: 8 }}>
              <Button icon={<CopyOutlined />} onClick={copyPassword}>
                Copy password
              </Button>
            </div>
            {showPassword && (
              <div
                style={{
                  marginTop: 10,
                  padding: "8px 10px",
                  background: "#fffbeb",
                  border: "1px solid #fcd34d",
                  borderRadius: 8,
                  fontSize: 13,
                }}
              >
                Password:{" "}
                <code style={{ fontWeight: 700 }}>{savedPassword}</code>
              </div>
            )}
          </>
        ) : (
          <div style={{ fontSize: 13, color: "#6b7280" }}>
            No password available for this user. Password from{" "}
            <b>Add User</b> can be viewed here only in this browser session
            after create.
          </div>
        )}
      </div>
    </Modal>
  );
};

export default UserViewModal;
