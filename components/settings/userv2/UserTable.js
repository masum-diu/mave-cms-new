import React, { useState, useEffect } from "react";
import {
  Table,
  Avatar,
  Button,
  Input,
  Select,
  Popconfirm,
  message,
  Modal,
  Checkbox,
  Spin,
} from "antd";
import { EditOutlined, DeleteOutlined, EyeOutlined } from "@ant-design/icons";
import TopBar from "./TopBar";
import UserEditModal from "./UserEditModal";
import UserViewModal from "./UserViewModal";
import FilterDrawer from "./FilterDrawer";
import instance from "../../../axios";
import { getRoleLabel, isAdminRole, canManageUsers } from "../../../utils/roles";

const { Option } = Select;

const UserTable = ({ users, fetchUsers, roles, currentUser }) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [isFilterDrawerVisible, setIsFilterDrawerVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [filteredUsers, setFilteredUsers] = useState(users);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    setFilteredUsers(users);
  }, [users]);

  const isAdmin = canManageUsers(currentUser);

  // Handle selection of all rows (not header)
  const handleSelectAll = () => {
    if (selectedRowKeys.length === filteredUsers.length) {
      // Deselect all if already selected
      setSelectedRowKeys([]);
    } else {
      // Select all
      setSelectedRowKeys(filteredUsers?.map((user) => user.id));
    }
  };

  // Handle individual row selection
  const handleSelect = (id) => {
    setSelectedRowKeys((prev) =>
      prev.includes(id) ? prev.filter((key) => key !== id) : [...prev, id]
    );
  };

  // Handle search by name
  const handleSearch = (value) => {
    setSearchTerm(value);
    const filtered = users.filter((user) =>
      user.name.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredUsers(filtered);
  };

  // Handle edit button click
  const handleEditUser = (user) => {
    setSelectedUser(user);
    setIsEditModalVisible(true);
  };

  // Handle view button click
  const handleViewUser = (user) => {
    setSelectedUser(user);
    setIsViewModalVisible(true);
  };

  // Handle delete button click
  const handleDeleteUser = async (id) => {
    const targetUser = users.find((u) => u.id === id);

    // Only block primary Admin (role_id 1). Created Users must be deletable.
    if (isAdminRole(targetUser?.role_id)) {
      message.error("You cannot delete admin users");
      return;
    }

    // Prevent deleting own account
    if (
      targetUser?.id === currentUser?.id ||
      String(targetUser?.id) === String(currentUser?.id)
    ) {
      message.error("You cannot delete your own account");
      return;
    }

    try {
      await instance.delete(`/admin/user/${id}`);
      message.success("User deleted successfully");
      fetchUsers();
    } catch (error) {
      message.error(
        error.response?.data?.message || "Failed to delete user"
      );
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    const hasAdmin = selectedRowKeys.some((id) => {
      const user = users.find((u) => u.id === id);
      return isAdminRole(user?.role_id);
    });

    if (hasAdmin) {
      message.error("You cannot delete admin users");
      return;
    }

    const hasSelf = selectedRowKeys.some(
      (id) => String(id) === String(currentUser?.id)
    );
    if (hasSelf) {
      message.error("You cannot delete your own account");
      return;
    }

    try {
      await Promise.all(
        selectedRowKeys?.map((id) => instance.delete(`/admin/user/${id}`))
      );
      message.success("Selected users deleted successfully");
      fetchUsers();
      setSelectedRowKeys([]);
    } catch (error) {
      message.error(
        error.response?.data?.message || "Failed to delete selected users"
      );
    }
  };

  // Column definitions for Ant Design Table
  const columns = [
    {
      title: "Select",
      dataIndex: "select",
      key: "select",
      render: (_, record) => (
        <Checkbox
          checked={selectedRowKeys.includes(record.id)}
          onChange={() => handleSelect(record.id)}
        />
      ),
    },
    {
      title: "Avatar",
      dataIndex: "avatar",
      key: "avatar",
      render: (_, record) => (
        <Avatar
          src={record.profile_picture || "/images/profile_avatar.png"}
          style={{
            border: "2px solid var(--theme)",
          }}
        />
      ),
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Role",
      dataIndex: "role_id",
      key: "role",
      render: (role_id) => getRoleLabel(role_id, roles),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => {
        const isSelf =
          record.id === currentUser?.id ||
          String(record.id) === String(currentUser?.id);
        // Only role_id 1 is protected; created Users (role_id 2) can be deleted
        const isTargetAdmin = isAdminRole(record.role_id);
        const canEdit = isAdmin && (!isTargetAdmin || isSelf);
        const canDelete = isAdmin && !isTargetAdmin && !isSelf;

        return (
          <div style={{ display: "flex", gap: "1rem" }}>
            <Button
              icon={<EyeOutlined />}
              onClick={() => handleViewUser(record)}
              style={{ backgroundColor: "var(--theme)", color: "white" }}
            />
            {canEdit && (
              <Button
                icon={<EditOutlined />}
                onClick={() => handleEditUser(record)}
                style={{
                  backgroundColor: "transparent",
                  color: "var(--theme)",
                  border: "2px solid var(--theme)",
                }}
              />
            )}
            {canDelete && (
              <Popconfirm
                title="Are you sure to delete this user?"
                onConfirm={() => handleDeleteUser(record.id)}
                onCancel={() => message.info("User not deleted")}
                okText="Yes"
                cancelText="No"
                okButtonProps={{ danger: true }}
              >
                <Button icon={<DeleteOutlined />} danger />
              </Popconfirm>
            )}
          </div>
        );
      },
    },
  ];

  // If not admin, don't show the checkbox column
  if (!isAdmin) {
    columns.shift(); // Remove the Select column
  }

  return (
    <>
      {isAdmin && (
        <TopBar
          selectedRowKeys={selectedRowKeys}
          onSearch={handleSearch}
          onDelete={handleBulkDelete}
          setIsFilterDrawerVisible={setIsFilterDrawerVisible}
          setFilteredUsers={setFilteredUsers}
          users={users}
          onSelectAll={handleSelectAll}
        />
      )}
      <Table
        columns={columns}
        dataSource={filteredUsers}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        loading={!users}
      />

      {users && roles && (
        <>
          <UserEditModal
            visible={isEditModalVisible}
            user={selectedUser}
            onCancel={() => setIsEditModalVisible(false)}
            fetchUsers={fetchUsers}
            roles={roles}
            currentUser={currentUser}
          />
          <UserViewModal
            visible={isViewModalVisible}
            user={selectedUser}
            onCancel={() => setIsViewModalVisible(false)}
            onEdit={() => handleEditUser(selectedUser)}
            roles={roles}
          />
          <FilterDrawer
            visible={isFilterDrawerVisible}
            onClose={() => setIsFilterDrawerVisible(false)}
            setFilteredUsers={setFilteredUsers}
            users={users}
          />
        </>
      )}
    </>
  );
};

export default UserTable;
