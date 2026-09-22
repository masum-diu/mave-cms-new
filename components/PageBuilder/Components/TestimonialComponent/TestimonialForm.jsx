import React, { useState } from "react";
import { Form, Input, Rate, Button, Space } from "antd";
import {
  TranslationOutlined,
  StarOutlined,
  PictureOutlined,
  CheckCircleFilled,
} from "@ant-design/icons";
import Image from "next/image";

const Section = ({ icon, title, children }) => (
  <div style={{ marginBottom: 20 }}>
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 12,
        paddingBottom: 8,
        borderBottom: "1px solid #f3f4f6",
      }}
    >
      <span style={{ color: "var(--theme)", fontSize: 15 }}>{icon}</span>
      <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "#111827" }}>
        {title}
      </span>
    </div>
    {children}
  </div>
);

const TestimonialForm = ({
  form,
  onFinish,
  selectedImage,
  onImageSelect,
  onCancel,
  isEdit = false,
}) => {
  const [langTab, setLangTab] = useState("en");

  const quoteEn = Form.useWatch("quote_en", form);
  const authorEn = Form.useWatch("author_en", form);
  const quoteBn = Form.useWatch("quote_bn", form);
  const authorBn = Form.useWatch("author_bn", form);

  const enFilled = Boolean(quoteEn && authorEn);
  const bnFilled = Boolean(quoteBn && authorBn);

  const getImageUrl = () => {
    if (!selectedImage) return null;
    const imagePath =
      typeof selectedImage === "string"
        ? selectedImage
        : selectedImage.file_path;
    const baseUrl = process.env.NEXT_PUBLIC_MEDIA_URL || "";
    return `${baseUrl}/${imagePath}`;
  };

  const handleSubmit = (values) => {
    if (!values.quote_en || !values.author_en) return;

    onFinish({
      ...values,
      image: selectedImage,
    });
  };

  return (
    <Form
      layout="vertical"
      form={form}
      onFinish={handleSubmit}
      initialValues={{
        rating: 5,
        image: selectedImage,
      }}
    >
      <Section icon={<TranslationOutlined />} title="Content">
        <div
          style={{
            display: "flex",
            borderRadius: 8,
            overflow: "hidden",
            border: "1px solid var(--theme-dark)",
            marginBottom: 8,
          }}
        >
          {[
            { key: "en", label: "English", filled: enFilled },
            { key: "bn", label: "বাংলা", filled: bnFilled },
          ].map(({ key, label, filled }) => (
            <button
              key={key}
              type="button"
              onClick={() => setLangTab(key)}
              style={{
                flex: 1,
                height: 38,
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                background: langTab === key ? "var(--theme)" : "#f9fafb",
                color: langTab === key ? "#000" : "#6b7280",
                fontWeight: langTab === key ? 700 : 500,
                fontSize: "0.85rem",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {label}
              {filled && (
                <CheckCircleFilled
                  style={{
                    fontSize: 12,
                    color: langTab === key ? "#000" : "#22c55e",
                  }}
                />
              )}
            </button>
          ))}
        </div>
        <p
          style={{
            fontSize: "0.75rem",
            color: "#9ca3af",
            marginBottom: 14,
          }}
        >
          English required, বাংলা optional — tab bodlale kono data muche jabe
          na.
        </p>

        <div style={{ display: langTab === "en" ? "block" : "none" }}>
          <Form.Item
            label="Quote (English)"
            name="quote_en"
            rules={[{ required: true, message: "Please enter the quote." }]}
          >
            <Input.TextArea
              rows={4}
              placeholder="Enter customer quote in English"
            />
          </Form.Item>
          <Form.Item
            label="Author (English)"
            name="author_en"
            rules={[
              { required: true, message: "Please enter the author's name." },
            ]}
          >
            <Input placeholder="Enter author's name in English" />
          </Form.Item>
        </div>

        <div style={{ display: langTab === "bn" ? "block" : "none" }}>
          <Form.Item label="উক্তি (Quote in বাংলা)" name="quote_bn">
            <Input.TextArea rows={4} placeholder="বাংলায় উক্তি লিখুন" />
          </Form.Item>
          <Form.Item label="লেখকের নাম (Author in বাংলা)" name="author_bn">
            <Input placeholder="বাংলায় লেখকের নাম লিখুন" />
          </Form.Item>
        </div>
      </Section>

      <Section icon={<StarOutlined />} title="Rating">
        <Form.Item name="rating" initialValue={5} style={{ marginBottom: 0 }}>
          <Rate />
        </Form.Item>
      </Section>

      <Section icon={<PictureOutlined />} title="Image">
        <Form.Item name="image" style={{ marginBottom: 0 }}>
          <Button onClick={onImageSelect}>
            {selectedImage ? "Change Image" : "Select Image"}
          </Button>
          {selectedImage && (
            <div className="mt-2">
              <div className="relative w-[100px] h-[100px]">
                <Image
                  src={getImageUrl()}
                  alt={
                    typeof selectedImage === "string"
                      ? "Selected"
                      : selectedImage.title || "Selected"
                  }
                  width={100}
                  height={100}
                  className="object-cover rounded-md"
                  unoptimized
                />
              </div>
            </div>
          )}
        </Form.Item>
      </Section>

      <Form.Item style={{ marginBottom: 0 }}>
        <Space>
          <Button className="mavebutton" type="primary" htmlType="submit">
            {isEdit ? "Update Testimonial" : "Add Testimonial"}
          </Button>
          <Button className="mavecancelbutton" onClick={onCancel}>
            Cancel
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default TestimonialForm;
