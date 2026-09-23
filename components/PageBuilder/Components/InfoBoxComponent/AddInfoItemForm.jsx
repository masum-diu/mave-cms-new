import React, { useState } from "react";
import { Form, Input, Button, Radio, Select } from "antd";
import {
  FileTextOutlined,
  PictureOutlined,
  AppstoreAddOutlined,
  LinkOutlined,
  GlobalOutlined,
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

/**
 * Form for one info item — Title/Description (required) plus optional
 * Secondary and Alternative content blocks, each switchable between
 * English and বাংলা with the same toggle, and Media.
 */
const AddInfoItemForm = ({
  form,
  onFinish,
  onMediaSelect,
  selectedMedia,
  submitLabel = "Add",
  editorKey = "new",
  pages = [],
}) => {
  const [langTab, setLangTab] = useState("en");
  const [showSecond, setShowSecond] = useState(
    Boolean(
      form.getFieldValue("secondTitle") ||
        form.getFieldValue("secondTitle_bn") ||
        form.getFieldValue("secondDescription") ||
        form.getFieldValue("secondDescription_bn")
    )
  );
  const [showAlt, setShowAlt] = useState(
    Boolean(
      form.getFieldValue("altTitle") ||
        form.getFieldValue("altTitle_bn") ||
        form.getFieldValue("altDescription") ||
        form.getFieldValue("altDescription_bn")
    )
  );
  const [showLink, setShowLink] = useState(
    Boolean(form.getFieldValue("link") || form.getFieldValue("linkPageId"))
  );
  const linkType = Form.useWatch("linkType", form) || "independent";

  const isBn = langTab === "bn";
  const suffix = isBn ? "_bn" : "";
  const titlePlaceholder = isBn ? "বাংলায় শিরোনাম লিখুন" : "Enter title in English";
  const requiredRule = (message) => (isBn ? [] : [{ required: true, message }]);

  const titleName = `title${suffix}`;
  const descName = `description${suffix}`;
  const secondTitleName = `secondTitle${suffix}`;
  const secondDescName = `secondDescription${suffix}`;
  const altTitleName = `altTitle${suffix}`;
  const altDescName = `altDescription${suffix}`;

  return (
    <div className="bg-white p-4 rounded-md shadow-sm border border-gray-200">
      <Form layout="vertical" form={form} onFinish={onFinish}>
        <LangToggle langTab={langTab} setLangTab={setLangTab} />

        <Section icon={<FileTextOutlined />} title="Content">
          <Form.Item
            label={`Title (${langTab})`}
            name={titleName}
            rules={requiredRule("Please enter the title.")}
          >
            <Input placeholder={titlePlaceholder} />
          </Form.Item>

          <Form.Item
            label={`Description (${langTab})`}
            name={descName}
            rules={requiredRule("Please enter the description.")}
          >
            <RichTextEditor
              key={`item-desc-${langTab}-${editorKey}`}
              defaultValue={form.getFieldValue(descName) || ""}
              onChange={(html) => form.setFieldsValue({ [descName]: html })}
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
            <Form.Item label={`Second Title (${langTab})`} name={secondTitleName}>
              <Input placeholder="Optional" />
            </Form.Item>
            <Form.Item
              label={`Second Description (${langTab})`}
              name={secondDescName}
            >
              <RichTextEditor
                key={`item-second-desc-${langTab}-${editorKey}`}
                defaultValue={form.getFieldValue(secondDescName) || ""}
                onChange={(html) =>
                  form.setFieldsValue({ [secondDescName]: html })
                }
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
            <Form.Item label={`Alternative Title (${langTab})`} name={altTitleName}>
              <Input placeholder="Optional" />
            </Form.Item>
            <Form.Item
              label={`Alternative Description (${langTab})`}
              name={altDescName}
            >
              <RichTextEditor
                key={`item-alt-desc-${langTab}-${editorKey}`}
                defaultValue={form.getFieldValue(altDescName) || ""}
                onChange={(html) =>
                  form.setFieldsValue({ [altDescName]: html })
                }
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
            <Button className="mavebutton" onClick={onMediaSelect}>
              Select Media
            </Button>
            {selectedMedia && selectedMedia.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selectedMedia.map((media, index) => (
                  <Image
                    key={index}
                    src={`${process.env.NEXT_PUBLIC_MEDIA_URL}/${media.file_path}`}
                    alt={media.title || media.title_en || "Media"}
                    width={80}
                    height={80}
                    objectFit="cover"
                    className="rounded-md"
                  />
                ))}
              </div>
            ) : (
              <span className="text-gray-500 text-sm">No media selected</span>
            )}
          </div>
        </Section>

        {showLink ? (
          <Section
            icon={<LinkOutlined />}
            title="Link (optional)"
            extra={
              <Button size="small" onClick={() => setShowLink(false)}>
                Remove
              </Button>
            }
          >
            <Form.Item
              label="Link Type"
              name="linkType"
              initialValue="independent"
            >
              <Radio.Group>
                <Radio value="independent">Independent Link</Radio>
                <Radio value="page">Page Link</Radio>
              </Radio.Group>
            </Form.Item>

            {linkType === "page" ? (
              <Form.Item label="Select Page" name="linkPageId">
                <Select placeholder="Select a page">
                  {pages.map((page) => (
                    <Select.Option key={page.id} value={page.id}>
                      {page.page_name_en}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            ) : (
              <Form.Item label="Link URL" name="link">
                <Input placeholder="Enter URL" prefix={<GlobalOutlined />} />
              </Form.Item>
            )}

            <Form.Item label="Link Behavior">
              <div className="flex gap-4 flex-wrap">
                <Form.Item name="target" initialValue="_self" noStyle>
                  <Radio.Group>
                    <Radio value="_self">Same Tab</Radio>
                    <Radio value="_blank">New Tab</Radio>
                  </Radio.Group>
                </Form.Item>
                <Form.Item name="isExternal" initialValue={false} noStyle>
                  <Radio.Group>
                    <Radio value={true}>External</Radio>
                    <Radio value={false}>Internal</Radio>
                  </Radio.Group>
                </Form.Item>
              </div>
            </Form.Item>
          </Section>
        ) : (
          <AddMoreButton
            onClick={() => setShowLink(true)}
            label="Add link (optional)"
          />
        )}

        <Form.Item className="mb-0">
          <Button className="mavebutton" type="primary" htmlType="submit" block>
            {submitLabel}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default AddInfoItemForm;
