// components/FormResponses/FormResponsesGrid.jsx

import React, { useState } from "react";
import { Button, Popconfirm, message, Tag } from "antd";
import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  DownloadOutlined,
  MailOutlined,
  SolutionOutlined,
  FormOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import ViewDetailsDrawer from "./ViewDetailsDrawer";
import EditResponseDrawer from "./EditResponseDrawer";
import instance from "../../axios";
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

const FormResponsesGrid = ({ responses, refreshData, currentUser }) => {
  const [viewDrawerVisible, setViewDrawerVisible] = useState(false);
  const [editDrawerVisible, setEditDrawerVisible] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState(null);

  // Check if user is admin
  const isAdmin = currentUser?.role_id === "1";

  // Handle Delete Action
  const handleDelete = async (id) => {
    if (!isAdmin) {
      message.error("You don't have permission to delete responses");
      return;
    }

    try {
      const response = await instance.delete(`/form-submission/${id}`);
      if (response.status === 200) {
        message.success("Form response deleted successfully.");
        refreshData();
      } else {
        message.error("Failed to delete the form response.");
      }
    } catch (error) {
      console.error("Error deleting form response:", error);
      message.error("An error occurred while deleting the form response.");
    }
  };

  // Function to format a raw field key ("first_name") into a label ("First Name")
  const formatFieldLabel = (key) =>
    key.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

  // Preview the first couple of scalar fields from an arbitrary form_data payload
  const getPreviewFields = (formData, limit = 2) => {
    if (!formData || typeof formData !== "object") return [];
    return Object.entries(formData)
      .filter(
        ([, value]) =>
          value !== null && value !== undefined && value !== "" && typeof value !== "object"
      )
      .slice(0, limit);
  };

  // Function to get CV URL
  const getCvUrl = (mediaList) => {
    if (mediaList?.cv?.file_path) {
      return `${process.env.NEXT_PUBLIC_MEDIA_URL}/${mediaList.cv.file_path}`;
    }
    return null;
  };

  // Function to handle CV download
  const handleDownloadCV = (mediaList) => {
    const cvUrl = getCvUrl(mediaList);
    if (cvUrl) {
      window.open(cvUrl, "_blank");
    } else {
      message.error("CV file not available");
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {responses.map((response) => {
          const { accent, badgeBg, badgeText, icon } = getTypeStyle(
            response.form_type
          );
          const previewFields = getPreviewFields(response.form_data);

          return (
            <div
              key={response.id}
              className="group relative rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col"
            >
              {/* Accent bar */}
              <div className="h-1.5 w-full" style={{ backgroundColor: accent }} />

              <div className="p-5 flex flex-col flex-1">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg"
                      style={{ backgroundColor: badgeBg, color: badgeText }}
                    >
                      {icon}
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold tracking-wide text-gray-400">
                        RESPONSE #{response.id}
                      </div>
                      <Tag color={accent} style={{ marginTop: 2, borderRadius: 999 }}>
                        {response.form_type?.toUpperCase() || "GENERAL"}
                      </Tag>
                    </div>
                  </div>

                  {response.form_type === "career" && response.media_list?.cv && (
                    <Button
                      type="text"
                      size="small"
                      icon={<DownloadOutlined />}
                      onClick={() => handleDownloadCV(response.media_list)}
                      title="Download CV"
                    />
                  )}
                </div>

                {/* Preview */}
                <div className="space-y-1.5 mb-4 flex-1">
                  {previewFields.length > 0 ? (
                    previewFields.map(([key, value]) => (
                      <div key={key} className="text-sm flex gap-1.5">
                        <span className="text-gray-400 shrink-0">
                          {formatFieldLabel(key)}:
                        </span>
                        <span className="text-gray-700 font-medium truncate">
                          {String(value)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 italic text-sm">
                      No preview available — click view for details
                    </p>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <ClockCircleOutlined />
                    {moment(response.created_at).fromNow()}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      type="text"
                      size="small"
                      shape="circle"
                      icon={<EyeOutlined />}
                      onClick={() => {
                        setSelectedResponse(response);
                        setViewDrawerVisible(true);
                      }}
                    />
                    {isAdmin && (
                      <Button
                        type="text"
                        size="small"
                        shape="circle"
                        icon={<EditOutlined />}
                        onClick={() => {
                          setSelectedResponse(response);
                          setEditDrawerVisible(true);
                        }}
                      />
                    )}
                    {isAdmin && (
                      <Popconfirm
                        title="Are you sure you want to delete this response?"
                        onConfirm={() => handleDelete(response.id)}
                        okText="Yes"
                        cancelText="No"
                        okButtonProps={{ danger: true }}
                      >
                        <Button
                          type="text"
                          size="small"
                          shape="circle"
                          danger
                          icon={<DeleteOutlined />}
                        />
                      </Popconfirm>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* View Details Drawer */}
      <ViewDetailsDrawer
        visible={viewDrawerVisible}
        onClose={() => setViewDrawerVisible(false)}
        data={selectedResponse?.form_data}
        mediaList={selectedResponse?.media_list}
        formType={selectedResponse?.form_type}
        currentUser={currentUser}
        onEdit={() => {
          setViewDrawerVisible(false);
          setEditDrawerVisible(true);
        }}
      />

      {/* Edit Response Drawer */}
      {isAdmin && (
        <EditResponseDrawer
          visible={editDrawerVisible}
          onClose={() => setEditDrawerVisible(false)}
          data={selectedResponse}
          onUpdate={refreshData}
        />
      )}
    </>
  );
};

export default FormResponsesGrid;
