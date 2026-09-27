// components/Navigation/NavbarPanel.js

import React, { useEffect, useState } from "react";
import { Button, Input, Popconfirm, Typography, message } from "antd";
import { DeleteOutlined, FileImageOutlined, SaveOutlined } from "@ant-design/icons";
import Image from "next/image";
import instance from "../../axios";
import MediaSelectionModal from "../PageBuilder/Modals/MediaSelectionModal";
import { getNavbarMenuId } from "./navigationUtils";

const mediaUrl = (media) =>
  media?.file_path
    ? `${process.env.NEXT_PUBLIC_MEDIA_URL}/${media.file_path}`
    : "/images/Image_placeholder.png";

const NavbarPanel = ({ navbar, onSaved, onDeleted }) => {
  const [titleEn, setTitleEn] = useState("");
  const [titleBn, setTitleBn] = useState("");
  const [logo, setLogo] = useState(null);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTitleEn(navbar.title_en || "");
    setTitleBn(navbar.title_bn || "");
    setLogo(navbar.logo || null);
  }, [navbar]);

  const dirty =
    titleEn !== (navbar.title_en || "") ||
    titleBn !== (navbar.title_bn || "") ||
    (logo?.id ?? null) !== (navbar.logo?.id ?? null);

  const handleSave = async () => {
    if (!titleEn.trim()) {
      message.error("Navbar title is required");
      return;
    }
    setSaving(true);
    try {
      const response = await instance.put(`/navbars/${navbar.id}`, {
        title_en: titleEn.trim(),
        title_bn: titleBn.trim(),
        logo_id: logo?.id ?? null,
        menu_id: getNavbarMenuId(navbar),
      });
      if (response.status !== 200) throw new Error();
      message.success("Navbar saved");
      onSaved();
    } catch {
      message.error("Error saving navbar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await instance.delete(`/navbars/${navbar.id}`);
      if (response.status !== 200 && response.status !== 204) throw new Error();
      message.success("Navbar deleted");
      onDeleted();
    } catch {
      message.error("Error deleting navbar");
    }
  };

  return (
    <div className="bg-white rounded-xl border p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <img src="/icons/mave/navbar.svg" alt="" className="w-5" />
          <h3 className="text-lg font-semibold m-0">Navbar</h3>
        </div>
        <Popconfirm
          title="Delete this navbar?"
          description="Its menu and menu items are kept."
          okButtonProps={{ danger: true }}
          onConfirm={handleDelete}
        >
          <Button danger type="text" icon={<DeleteOutlined />}>
            Delete
          </Button>
        </Popconfirm>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex flex-col items-center gap-2 shrink-0">
          <Image
            src={mediaUrl(logo)}
            alt={logo?.file_name || "Navbar logo"}
            width={88}
            height={88}
            className="object-contain rounded-lg border bg-gray-50"
          />
          <Button size="small" icon={<FileImageOutlined />} onClick={() => setMediaOpen(true)}>
            {logo ? "Change logo" : "Choose logo"}
          </Button>
        </div>
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Typography.Text strong>Title</Typography.Text>
            <Input className="mt-1" value={titleEn} onChange={(e) => setTitleEn(e.target.value)} />
          </div>
          <div>
            <Typography.Text strong>Title (alternate)</Typography.Text>
            <Input className="mt-1" value={titleBn} onChange={(e) => setTitleBn(e.target.value)} />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <Button
              className="mavebutton"
              icon={<SaveOutlined />}
              disabled={!dirty}
              loading={saving}
              onClick={handleSave}
            >
              Save navbar
            </Button>
          </div>
        </div>
      </div>

      <MediaSelectionModal
        isVisible={mediaOpen}
        onClose={() => setMediaOpen(false)}
        selectionMode="single"
        onSelectMedia={(selected) => {
          if (selected) setLogo(selected);
          setMediaOpen(false);
        }}
      />
    </div>
  );
};

export default NavbarPanel;
