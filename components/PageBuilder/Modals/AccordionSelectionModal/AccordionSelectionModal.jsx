// components/PageBuilder/Modals/AccordionSelectionModal/AccordionSelectionModal.jsx

import React, { useState, useEffect } from "react";
import {
  Drawer,
  Form,
  Input,
  Button,
  Space,
  Select,
  ColorPicker,
  Collapse,
  ConfigProvider,
} from "antd";
import {
  PlusOutlined,
  MinusOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import RichTextEditor from "../../../RichTextEditor";

const { Option } = Select;
const { Panel } = Collapse;

const toAccordionItems = (value) => {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") {
    if (Array.isArray(value.items)) return value.items;
    if (Array.isArray(value.data)) return value.data;
  }
  return [];
};

// Fills title_en/title_bn/content_en/content_bn from legacy flat
// title/content fields so older accordion items keep editing correctly.
const normalizeItem = (item) => ({
  ...item,
  title_en: item.title_en ?? item.title ?? "",
  title_bn: item.title_bn ?? "",
  content_en: item.content_en ?? item.content ?? "",
  content_bn: item.content_bn ?? "",
});

const AccordionSelectionModal = ({
  isVisible,
  onClose,
  onSelectAccordion,
  initialData = [],
}) => {
  const [form] = Form.useForm();
  const [accordionItems, setAccordionItems] = useState(() =>
    toAccordionItems(initialData).map(normalizeItem)
  );
  const [showStyleConfig, setShowStyleConfig] = useState({});
  const [langTab, setLangTab] = useState("en");

  useEffect(() => {
    const items = toAccordionItems(initialData).map(normalizeItem);
    setAccordionItems(items);
    // Initialize showStyleConfig for each item
    const initialStyleConfig = {};
    items.forEach((_, index) => {
      initialStyleConfig[index] = false;
    });
    setShowStyleConfig(initialStyleConfig);
  }, [initialData]);

  const handleAddItem = () => {
    const newItem = {
      title_en: "",
      title_bn: "",
      content_en: "",
      content_bn: "",
      contentType: "text",
      style: {
        headerBg: "#ffffff",
        headerTextColor: "#000000",
        contentBg: "#ffffff",
        contentTextColor: "#000000",
        borderColor: "#e5e7eb",
        borderRadius: "8px",
      },
    };
    setAccordionItems([...accordionItems, newItem]);
    setShowStyleConfig({ ...showStyleConfig, [accordionItems.length]: false });
  };

  const handleRemoveItem = (index) => {
    const newItems = [...accordionItems];
    newItems.splice(index, 1);
    setAccordionItems(newItems);
    const newStyleConfig = { ...showStyleConfig };
    delete newStyleConfig[index];
    setShowStyleConfig(newStyleConfig);
  };

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      const updatedItems = accordionItems.map((item, index) => {
        const { title, content, ...rest } = item; // drop legacy flat fields
        return {
          ...rest,
          title_en: values[`title_en_${index}`],
          title_bn: values[`title_bn_${index}`],
          contentType: values[`contentType_${index}`],
          style: {
            headerBg: values[`headerBg_${index}`] || "#ffffff",
            headerTextColor: values[`headerTextColor_${index}`] || "#000000",
            contentBg: values[`contentBg_${index}`] || "#ffffff",
            contentTextColor: values[`contentTextColor_${index}`] || "#000000",
            borderColor: values[`borderColor_${index}`] || "#e5e7eb",
            borderRadius: values[`borderRadius_${index}`] || "8px",
          },
        };
      });
      onSelectAccordion(updatedItems);
    });
  };

  const handleContentChange = (content, index, lang) => {
    const field = lang === "bn" ? "content_bn" : "content_en";
    const newItems = accordionItems.map((item, i) => {
      if (i === index) {
        return { ...item, [field]: content };
      }
      return item;
    });
    setAccordionItems(newItems);
  };

  const toggleStyleConfig = (index) => {
    setShowStyleConfig({
      ...showStyleConfig,
      [index]: !showStyleConfig[index],
    });
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#fcb813",
          colorTextLightSolid: "#000000",
        },
      }}
    >
    <Drawer
      title="Configure Accordion"
      placement="right"
      width={800}
      onClose={onClose}
      open={isVisible}
      extra={
        <Space>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" onClick={handleSubmit}>
            Save
          </Button>
        </Space>
      }
    >
      <div
        style={{
          display: "flex",
          borderRadius: 8,
          overflow: "hidden",
          border: "1px solid var(--theme-dark)",
          marginBottom: 20,
        }}
      >
        {[
          { key: "en", label: "English" },
          { key: "bn", label: "বাংলা" },
        ].map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setLangTab(key)}
            style={{
              flex: 1,
              height: 40,
              border: "none",
              background: langTab === key ? "var(--theme)" : "#f9fafb",
              color: langTab === key ? "#000" : "#6b7280",
              fontWeight: langTab === key ? 700 : 500,
              fontSize: "0.9rem",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <Form form={form} layout="vertical">
        {accordionItems.map((item, index) => (
          <div
            key={index}
            className="mb-6 p-4 border border-gray-200 rounded-lg"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Item {index + 1}</h3>
              <Space>
                <Button
                  type="text"
                  icon={<SettingOutlined />}
                  onClick={() => toggleStyleConfig(index)}
                >
                  Advanced
                </Button>
                <Button
                  icon={<MinusOutlined />}
                  onClick={() => handleRemoveItem(index)}
                  danger
                  type="text"
                />
              </Space>
            </div>

            <div style={{ display: langTab === "en" ? "block" : "none" }}>
              <Form.Item
                label="Title (English)"
                name={`title_en_${index}`}
                initialValue={item.title_en}
                rules={[{ required: true, message: "Please enter a title" }]}
              >
                <Input placeholder="Enter title in English" />
              </Form.Item>
            </div>

            <div style={{ display: langTab === "bn" ? "block" : "none" }}>
              <Form.Item
                label="শিরোনাম (Title in বাংলা)"
                name={`title_bn_${index}`}
                initialValue={item.title_bn}
              >
                <Input placeholder="বাংলায় শিরোনাম লিখুন" />
              </Form.Item>
            </div>

            <Form.Item
              label="Content Type"
              name={`contentType_${index}`}
              initialValue={item.contentType}
            >
              <Select>
                <Option value="text">Text</Option>
                <Option value="accordion">Nested Accordion</Option>
              </Select>
            </Form.Item>

            <div style={{ display: langTab === "en" ? "block" : "none" }}>
              <Form.Item label="Content (English)">
                <RichTextEditor
                  defaultValue={item.content_en}
                  onChange={(content) =>
                    handleContentChange(content, index, "en")
                  }
                  editMode={true}
                />
              </Form.Item>
            </div>

            <div style={{ display: langTab === "bn" ? "block" : "none" }}>
              <Form.Item label="বিবরণ (Content in বাংলা)">
                <RichTextEditor
                  defaultValue={item.content_bn}
                  onChange={(content) =>
                    handleContentChange(content, index, "bn")
                  }
                  editMode={true}
                />
              </Form.Item>
            </div>

            {showStyleConfig[index] && (
              <div className="mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <Form.Item
                    label="Header Background"
                    name={`headerBg_${index}`}
                    initialValue={item.style?.headerBg}
                  >
                    <ColorPicker />
                  </Form.Item>

                  <Form.Item
                    label="Header Text Color"
                    name={`headerTextColor_${index}`}
                    initialValue={item.style?.headerTextColor}
                  >
                    <ColorPicker />
                  </Form.Item>

                  <Form.Item
                    label="Content Background"
                    name={`contentBg_${index}`}
                    initialValue={item.style?.contentBg}
                  >
                    <ColorPicker />
                  </Form.Item>

                  <Form.Item
                    label="Content Text Color"
                    name={`contentTextColor_${index}`}
                    initialValue={item.style?.contentTextColor}
                  >
                    <ColorPicker />
                  </Form.Item>

                  <Form.Item
                    label="Border Color"
                    name={`borderColor_${index}`}
                    initialValue={item.style?.borderColor}
                  >
                    <ColorPicker />
                  </Form.Item>

                  <Form.Item
                    label="Border Radius"
                    name={`borderRadius_${index}`}
                    initialValue={item.style?.borderRadius}
                  >
                    <Select>
                      <Option value="0px">None</Option>
                      <Option value="4px">Small</Option>
                      <Option value="8px">Medium</Option>
                      <Option value="12px">Large</Option>
                      <Option value="16px">Extra Large</Option>
                    </Select>
                  </Form.Item>
                </div>
              </div>
            )}
          </div>
        ))}

        <Button
          type="dashed"
          onClick={handleAddItem}
          block
          icon={<PlusOutlined />}
          className="mt-4"
        >
          Add Item
        </Button>
      </Form>
    </Drawer>
    </ConfigProvider>
  );
};

export default AccordionSelectionModal;
