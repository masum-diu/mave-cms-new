import React from "react";
import { Form, Input, Button } from "antd";
import Image from "next/image";
import RichTextEditor from "../../../RichTextEditor";

const MainContentSection = ({
  infoBox,
  onInfoBoxChange,
  onMediaSelect,
  media,
}) => {
  const setField = (key, value) => {
    onInfoBoxChange({ ...infoBox, [key]: value });
  };

  return (
    <div className="mb-4">
      <Form layout="vertical">
        <Form.Item label="Title">
          <Input
            value={infoBox.title || ""}
            onChange={(e) => setField("title", e.target.value)}
            placeholder="Enter title"
          />
        </Form.Item>
        <Form.Item label="Description">
          <RichTextEditor
            key={`desc-${infoBox._editorKey || "main"}`}
            defaultValue={infoBox.description || ""}
            onChange={(html) => setField("description", html)}
            editMode
            maxLength={2000}
          />
        </Form.Item>

        <Form.Item label="Second Title">
          <Input
            value={infoBox.secondTitle || ""}
            onChange={(e) => setField("secondTitle", e.target.value)}
            placeholder="Enter second title"
          />
        </Form.Item>
        <Form.Item label="Second Description">
          <RichTextEditor
            key={`second-desc-${infoBox._editorKey || "main"}`}
            defaultValue={infoBox.secondDescription || ""}
            onChange={(html) => setField("secondDescription", html)}
            editMode
            maxLength={2000}
          />
        </Form.Item>

        <Form.Item label="Alternative Title">
          <Input
            value={infoBox.altTitle || ""}
            onChange={(e) => setField("altTitle", e.target.value)}
            placeholder="Enter alternative title"
          />
        </Form.Item>
        <Form.Item label="Alternative Description">
          <RichTextEditor
            key={`alt-desc-${infoBox._editorKey || "main"}`}
            defaultValue={infoBox.altDescription || ""}
            onChange={(html) => setField("altDescription", html)}
            editMode
            maxLength={2000}
          />
        </Form.Item>

        <Form.Item label="Main Media">
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
        </Form.Item>
      </Form>
    </div>
  );
};

export default MainContentSection;
