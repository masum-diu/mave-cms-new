import React from "react";
import { Form, Input, Button } from "antd";
import Image from "next/image";
import RichTextEditor from "../../../RichTextEditor";

/**
 * Form for one info item — same fields as the box header:
 * Title, Description, Second Title/Description, Alternative Title/Description, Media
 */
const AddInfoItemForm = ({
  form,
  onFinish,
  onMediaSelect,
  selectedMedia,
  submitLabel = "Add Item",
  editorKey = "new",
}) => {
  return (
    <div className="bg-white p-4 rounded-md shadow-sm border border-gray-200">
      <Form layout="vertical" form={form} onFinish={onFinish}>
        <Form.Item
          label="Title"
          name="title"
          rules={[{ required: true, message: "Please enter the title." }]}
        >
          <Input placeholder="Enter title" />
        </Form.Item>

        <Form.Item
          label="Description"
          name="description"
          rules={[{ required: true, message: "Please enter the description." }]}
        >
          <RichTextEditor
            key={`item-desc-${editorKey}`}
            defaultValue={form.getFieldValue("description") || ""}
            onChange={(html) => form.setFieldsValue({ description: html })}
            editMode
            maxLength={2000}
          />
        </Form.Item>

        <Form.Item label="Second Title" name="secondTitle">
          <Input placeholder="Enter second title" />
        </Form.Item>

        <Form.Item label="Second Description" name="secondDescription">
          <RichTextEditor
            key={`item-second-desc-${editorKey}`}
            defaultValue={form.getFieldValue("secondDescription") || ""}
            onChange={(html) => form.setFieldsValue({ secondDescription: html })}
            editMode
            maxLength={2000}
          />
        </Form.Item>

        <Form.Item label="Alternative Title" name="altTitle">
          <Input placeholder="Enter alternative title" />
        </Form.Item>

        <Form.Item label="Alternative Description" name="altDescription">
          <RichTextEditor
            key={`item-alt-desc-${editorKey}`}
            defaultValue={form.getFieldValue("altDescription") || ""}
            onChange={(html) => form.setFieldsValue({ altDescription: html })}
            editMode
            maxLength={2000}
          />
        </Form.Item>

        <Form.Item label="Media">
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
        </Form.Item>

        <Form.Item className="mb-0">
          <Button className="mavebutton" type="primary" htmlType="submit">
            {submitLabel}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default AddInfoItemForm;
