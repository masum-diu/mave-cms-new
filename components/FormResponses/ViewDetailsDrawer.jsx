// components/FormResponses/ViewDetailsDrawer.jsx

import React from "react";
import { Drawer, Empty, Button, Tag } from "antd";
import {
  DownloadOutlined,
  EditOutlined,
  MailOutlined,
  SolutionOutlined,
  FormOutlined,
  PaperClipOutlined,
} from "@ant-design/icons";
import moment from "moment";

const TYPE_STYLE = {
  career: {
    accent: "#fcb813",
    badgeBg: "#fef3c7",
    badgeText: "#b45309",
    icon: <SolutionOutlined />,
  },
  contact: {
    accent: "#22c55e",
    badgeBg: "#dcfce7",
    badgeText: "#15803d",
    icon: <MailOutlined />,
  },
  default: {
    accent: "#3b82f6",
    badgeBg: "#dbeafe",
    badgeText: "#1d4ed8",
    icon: <FormOutlined />,
  },
};

const getTypeStyle = (formType) => TYPE_STYLE[formType] || TYPE_STYLE.default;

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

  const { accent, badgeBg, badgeText, icon } = getTypeStyle(formType);

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
  const formatTime = (time) => moment(time, "HH:mm").format("hh:mm A");

  // Convert the form_data object into label/value rows
  const fieldRows = isValidData
    ? Object.entries(data)
        .filter(([, value]) => value !== null)
        .map(([key, value]) => ({
          field: key,
          value:
            key === "callTime" && Array.isArray(value)
              ? `${formatTime(value[0])} - ${formatTime(value[1])}`
              : Array.isArray(value)
                ? value.join(", ")
                : typeof value === "object"
                  ? JSON.stringify(value)
                  : String(value),
        }))
    : [];

  const hasContent = fieldRows.length > 0 || mediaEntries.length > 0;

  return (
    <Drawer
      title={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full text-base"
              style={{ backgroundColor: badgeBg, color: badgeText }}
            >
              {icon}
            </div>
            <div>
              <div className="text-base font-semibold leading-none">
                Response Details
              </div>
              <Tag color={accent} style={{ marginTop: 6, borderRadius: 999 }}>
                {formType?.toUpperCase() || "GENERAL"}
              </Tag>
            </div>
          </div>
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
        </div>
      }
      placement="right"
      onClose={onClose}
      open={visible}
      width={"50%"}
    >
      {hasContent ? (
        <div className="space-y-6">
          {fieldRows.length > 0 && (
            <div className="rounded-2xl border border-gray-100 divide-y divide-gray-100 overflow-hidden">
              {fieldRows.map((row) => (
                <div
                  key={row.field}
                  className="flex items-start justify-between gap-6 px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <span className="w-2/5 shrink-0 text-xs font-semibold uppercase tracking-wide text-gray-400 pt-0.5">
                    {formatFieldLabel(row.field)}
                  </span>
                  <span className="flex-1 text-right text-sm font-medium text-gray-700 break-words">
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          )}

          {mediaEntries.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-gray-500">
                <PaperClipOutlined />
                Attachments
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {mediaEntries.flatMap(([fieldName, entry]) => {
                  const files = Array.isArray(entry) ? entry : [entry];
                  return files.map((media, idx) => {
                    const url = getMediaUrl(media);
                    if (!url) return null;
                    return (
                      <div
                        key={`${fieldName}-${idx}`}
                        className="rounded-xl border border-gray-100 p-3 flex flex-col items-center gap-2 text-center"
                      >
                        {isImageMedia(media) ? (
                          <a href={url} target="_blank" rel="noopener noreferrer">
                            <img
                              src={url}
                              alt={fieldName}
                              className="h-20 w-20 object-cover rounded-lg"
                            />
                          </a>
                        ) : (
                          <Button
                            shape="circle"
                            size="large"
                            icon={<DownloadOutlined />}
                            onClick={() => window.open(url, "_blank")}
                          />
                        )}
                        <span className="text-xs text-gray-400">
                          {formatFieldLabel(fieldName)}
                        </span>
                      </div>
                    );
                  });
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16">
          <Empty description="No Details Available" />
        </div>
      )}
    </Drawer>
  );
};

export default ViewDetailsDrawer;
