import React, { useState } from "react";
import { Form, Input, Button } from "antd";
import {
  FileTextOutlined,
  PictureOutlined,
  AppstoreAddOutlined,
} from "@ant-design/icons";
import Image from "next/image";
import RichTextEditor from "../../../RichTextEditor";

const Section = ({ icon, title, extra, children }) => (
  <div style={{ marginBottom: 20 }}>
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
        marginBottom: 12,
        paddingBottom: 8,
        borderBottom: "1px solid #f3f4f6",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ color: "var(--theme)", fontSize: 15 }}>{icon}</span>
        <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "#111827" }}>
          {title}
        </span>
      </div>
      {extra}
    </div>
    {children}
  </div>
);

const LangToggle = ({ langTab, setLangTab }) => (
  <div
    style={{
      display: "flex",
      borderRadius: 8,
      overflow: "hidden",
      border: "1px solid var(--theme-dark)",
      marginBottom: 16,
    }}
  >
    {[
      { key: "en", label: "EN" },
      { key: "bn", label: "BN" },
    ].map(({ key, label }) => (
      <button
        key={key}
        type="button"
        onClick={() => setLangTab(key)}
        style={{
          flex: 1,
          height: 38,
          border: "none",
          background: langTab === key ? "var(--theme)" : "#f9fafb",
          color: langTab === key ? "#000" : "#6b7280",
          fontWeight: langTab === key ? 700 : 500,
          fontSize: "0.85rem",
          cursor: "pointer",
          transition: "all 0.15s",
        }}
      >
        {label}
      </button>
    ))}
  </div>
);

const AddMoreButton = ({ onClick, label }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      width: "100%",
      height: 36,
      borderRadius: 8,
      border: "1px dashed #d1d5db",
      background: "transparent",
      color: "#6b7280",
      cursor: "pointer",
      fontSize: "0.8rem",
      fontWeight: 600,
      marginBottom: 20,
    }}
  >
    + {label}
  </button>
);

const MainContentSection = ({
  infoBox,
  onInfoBoxChange,
  onMediaSelect,
  media,
}) => {
  const [langTab, setLangTab] = useState("en");
  const [showSecond, setShowSecond] = useState(
    Boolean(
      infoBox.secondTitle ||
        infoBox.secondTitle_bn ||
        infoBox.secondDescription ||
        infoBox.secondDescription_bn
    )
  );
  const [showAlt, setShowAlt] = useState(
    Boolean(
      infoBox.altTitle ||
        infoBox.altTitle_bn ||
        infoBox.altDescription ||
        infoBox.altDescription_bn
    )
  );

  const setField = (key, value) => {
    onInfoBoxChange({ ...infoBox, [key]: value });
  };

  const isBn = langTab === "bn";
  const suffix = isBn ? "_bn" : "";
  const titlePlaceholder = isBn ? "বাংলায় শিরোনাম লিখুন" : "Enter title in English";

  const titleKey = `title${suffix}`;
  const descKey = `description${suffix}`;
  const secondTitleKey = `secondTitle${suffix}`;
  const secondDescKey = `secondDescription${suffix}`;
  const altTitleKey = `altTitle${suffix}`;
  const altDescKey = `altDescription${suffix}`;
  const editorKey = infoBox._editorKey || "main";

  return (
    <div className="mb-4">
      <Form layout="vertical">
        <LangToggle langTab={langTab} setLangTab={setLangTab} />

        <Section icon={<FileTextOutlined />} title="Main Content">
          <Form.Item label={`Title (${langTab})`}>
            <Input
              value={infoBox[titleKey] || ""}
              onChange={(e) => setField(titleKey, e.target.value)}
              placeholder={titlePlaceholder}
            />
          </Form.Item>
          <Form.Item label={`Description (${langTab})`}>
            <RichTextEditor
              key={`desc-${langTab}-${editorKey}`}
              defaultValue={infoBox[descKey] || ""}
              onChange={(html) => setField(descKey, html)}
              editMode
              maxLength={2000}
            />
          </Form.Item>
        </Section>

        {showSecond ? (
          <Section
            icon={<AppstoreAddOutlined />}
            title="Secondary Content (optional)"
            extra={
              <Button size="small" onClick={() => setShowSecond(false)}>
                Remove
              </Button>
            }
          >
            <Form.Item label={`Second Title (${langTab})`}>
              <Input
                value={infoBox[secondTitleKey] || ""}
                onChange={(e) => setField(secondTitleKey, e.target.value)}
                placeholder="Optional"
              />
            </Form.Item>
            <Form.Item label={`Second Description (${langTab})`}>
              <RichTextEditor
                key={`second-desc-${langTab}-${editorKey}`}
                defaultValue={infoBox[secondDescKey] || ""}
                onChange={(html) => setField(secondDescKey, html)}
                editMode
                maxLength={2000}
              />
            </Form.Item>
          </Section>
        ) : (
          <AddMoreButton
            onClick={() => setShowSecond(true)}
            label="Add secondary content (optional)"
          />
        )}

        {showAlt ? (
          <Section
            icon={<AppstoreAddOutlined />}
            title="Alternative Content (optional)"
            extra={
              <Button size="small" onClick={() => setShowAlt(false)}>
                Remove
              </Button>
            }
          >
            <Form.Item label={`Alternative Title (${langTab})`}>
              <Input
                value={infoBox[altTitleKey] || ""}
                onChange={(e) => setField(altTitleKey, e.target.value)}
                placeholder="Optional"
              />
            </Form.Item>
            <Form.Item label={`Alternative Description (${langTab})`}>
              <RichTextEditor
                key={`alt-desc-${langTab}-${editorKey}`}
                defaultValue={infoBox[altDescKey] || ""}
                onChange={(html) => setField(altDescKey, html)}
                editMode
                maxLength={2000}
              />
            </Form.Item>
          </Section>
        ) : (
          <AddMoreButton
            onClick={() => setShowAlt(true)}
            label="Add alternative content (optional)"
          />
        )}

        <Section icon={<PictureOutlined />} title="Media">
          <div className="flex gap-2 items-center flex-wrap">
            <Button
              className="mavebutton"
              onClick={() => onMediaSelect("multiple")}
            >
              Select Media
            </Button>
            {media && media.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2 cursor-pointer">
                {media.map((mediaItem, index) => (
                  <div
                    key={index}
                    className="relative cursor-pointer"
                    onClick={() => onMediaSelect("multiple")}
                  >
                    <Image
                      src={`${process.env.NEXT_PUBLIC_MEDIA_URL}/${mediaItem.file_path}`}
                      alt={mediaItem.title || mediaItem.title_en || "Media"}
                      width={120}
                      height={120}
                      objectFit="cover"
                      className="rounded-md"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-gray-500 text-sm">No media selected</span>
            )}
          </div>
        </Section>
      </Form>
    </div>
  );
};

export default MainContentSection;
