// components/FormResponses/ViewDetailsDrawer.jsx

import React from "react";
import { Drawer, Table, Empty, Button, Space, Tag } from "antd";
import { DownloadOutlined, EditOutlined } from "@ant-design/icons";
import moment from "moment";

const ViewDetailsDrawer = ({
  visible,
  onClose,
  data,
  mediaList,
  formType,
  currentUser,
  onEdit,
}) => {
  // Safely handle cases where data is not an object
  const isValidData = data && typeof data === "object" && !Array.isArray(data);

  // Check if user is admin
  const isAdmin = currentUser?.role_id === "1";

  // Any uploaded file/image lands here, keyed by its form field name — each
  // value is either a single media object or an array of them (multi-file field).
  const mediaEntries =
    mediaList && typeof mediaList === "object" ? Object.entries(mediaList) : [];

  const getMediaUrl = (media) =>
    media?.file_path
      ? `${process.env.NEXT_PUBLIC_MEDIA_URL}/${media.file_path}`
      : null;

  const isImageMedia = (media) => !!media?.file_type?.startsWith("image/");

  const formatFieldLabel = (key) =>
    key.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

  // Function to format time to 12-hour format with AM/PM
  const formatTime = (time) => {
    return moment(time, "HH:mm").format("hh:mm A");
  };

  // Convert the form_data object into an array of key-value pairs for the table
  const dataSource = isValidData
    ? Object.entries(data)
        .filter(([_, value]) => value !== null) // Filter out null values
        .map(([key, value], index) => ({
          key: index,
          field: key,
          value:
            key === "callTime" && Array.isArray(value)
              ? `${formatTime(value[0])} - ${formatTime(value[1])}`
              : Array.isArray(value)
                ? value.join(", ")
                : typeof value === "object"
                  ? JSON.stringify(value)
                  : String(value), // Convert all non-null values to string
        }))
    : [];

  const columns = [
    {
      title: "Field",
      dataIndex: "field",
      key: "field",
      width: "30%",
      render: (text) => (
        <strong>
          {text
            .replace(/_/g, " ")
            .replace(/\b\w/g, (char) => char.toUpperCase())}
        </strong>
      ),
    },
    {
      title: "Value",
      dataIndex: "value",
      key: "value",
    },
  ];

  return (
    <Drawer
      title={
        <Space style={{ width: "100%", justifyContent: "space-between" }}>
          <Space>
            Form Response Details
            {formType && (
              <Tag color={formType === "career" ? "yellow" : "default"}>
                {formType.toUpperCase()}
              </Tag>
            )}
          </Space>
          {isAdmin && (
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={onEdit}
              style={{
                backgroundColor: "var(--theme)",
                borderColor: "var(--theme)",
              }}
            >
              Edit
            </Button>
          )}
        </Space>
      }
      placement="right"
      onClose={onClose}
      open={visible}
      width={"50%"}
    >
      {(isValidData && dataSource.length > 0) || mediaEntries.length > 0 ? (
        <>
          {dataSource.length > 0 && (
            <Table
              dataSource={dataSource}
              columns={columns}
              pagination={false}
              rowKey="key"
            />
          )}
          {mediaEntries.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <h4>Attachments</h4>
              <Space direction="vertical" style={{ width: "100%" }} size="middle">
                {mediaEntries.flatMap(([fieldName, entry]) => {
                  const files = Array.isArray(entry) ? entry : [entry];
                  return files.map((media, idx) => {
                    const url = getMediaUrl(media);
                    if (!url) return null;
                    return (
                      <Space key={`${fieldName}-${idx}`} align="center">
                        <strong>{formatFieldLabel(fieldName)}:</strong>
                        {isImageMedia(media) ? (
                          <a href={url} target="_blank" rel="noopener noreferrer">
                            <img
                              src={url}
                              alt={fieldName}
                              style={{
                                maxWidth: 120,
                                maxHeight: 120,
                                borderRadius: 4,
                                display: "block",
                              }}
                            />
                          </a>
                        ) : (
                          <Button
                            icon={<DownloadOutlined />}
                            onClick={() => window.open(url, "_blank")}
                          >
                            {media.file_name || "Download"}
                          </Button>
                        )}
                      </Space>
                    );
                  });
                })}
              </Space>
            </div>
          )}
        </>
      ) : (
        <Empty description="No Details Available" />
      )}
    </Drawer>
  );
};

export default ViewDetailsDrawer;
