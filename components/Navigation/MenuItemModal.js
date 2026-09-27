// components/Navigation/MenuItemModal.js

import React, { useEffect, useMemo, useState } from "react";
import { Modal, Input, Select, Radio, Typography, message } from "antd";
import instance from "../../axios";
import { createMenuItem } from "./navigationApi";
import {
  apiErrorText,
  buildMenuItemLink,
  collectDescendantIds,
  getPageIdFromLink,
} from "./navigationUtils";

const { Option } = Select;

// Creates or edits a menu item. On create, the new item is also attached to
// the menu so it shows up in the navbar right away.
const MenuItemModal = ({
  open,
  onClose,
  menu,
  menuItems, // items already in this menu (parent choices)
  allMenuItems,
  pages,
  editingItem, // null => create
  defaultParentId,
  onSaved,
}) => {
  const [title, setTitle] = useState("");
  const [titleBn, setTitleBn] = useState("");
  const [parentId, setParentId] = useState(null);
  const [linkType, setLinkType] = useState("page");
  const [pageId, setPageId] = useState(null);
  const [customLink, setCustomLink] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editingItem) {
      const linkedPageId = getPageIdFromLink(editingItem.link);
      setTitle(editingItem.title || "");
      setTitleBn(editingItem.title_bn === "N/A" ? "" : editingItem.title_bn || "");
      setParentId(editingItem.parent_id || null);
      setLinkType(linkedPageId ? "page" : "independent");
      setPageId(linkedPageId);
      setCustomLink(linkedPageId ? "" : editingItem.link || "");
    } else {
      setTitle("");
      setTitleBn("");
      setParentId(defaultParentId || null);
      setLinkType("page");
      setPageId(null);
      setCustomLink("");
    }
  }, [open, editingItem, defaultParentId]);

  // An item can't be its own parent or be placed under one of its children.
  const parentOptions = useMemo(() => {
    if (!editingItem) return menuItems;
    const blocked = new Set([
      editingItem.id,
      ...collectDescendantIds(editingItem.id, allMenuItems),
    ]);
    return menuItems.filter((item) => !blocked.has(item.id));
  }, [menuItems, allMenuItems, editingItem]);

  const previewLink = buildMenuItemLink({
    title: title || "item",
    parentId,
    linkType,
    page: pages.find((p) => p.id === pageId),
    customLink,
    allItems: allMenuItems,
  });

  const handleSave = async () => {
    if (!title.trim()) {
      message.error("Please enter the item name");
      return;
    }
    if (linkType === "page" && !pageId) {
      message.error("Please choose a page, or switch to a custom link");
      return;
    }
    const link = buildMenuItemLink({
      title: title.trim(),
      parentId,
      linkType,
      page: pages.find((p) => p.id === pageId),
      customLink,
      allItems: allMenuItems,
    });
    const fields = {
      title: title.trim(),
      title_bn: titleBn.trim() || "N/A",
      parent_id: parentId || null,
      link,
    };

    setSaving(true);
    try {
      if (editingItem) {
        const response = await instance.put(`/menuitems/${editingItem.id}`, {
          ...editingItem,
          children: undefined,
          ...fields,
        });
        if (response.status !== 200) throw new Error();
        message.success("Menu item updated");
      } else {
        const newId = await createMenuItem(fields);
        if (!newId) {
          message.warning("Item created, but couldn't be added to the menu automatically");
        } else {
          const itemIds = (menu.menu_items || []).map((item) => item.id);
          await instance.put(`/menus/${menu.id}`, {
            name: menu.name,
            menu_item_ids: [...itemIds, newId],
          });
          message.success("Menu item added");
        }
      }
      onSaved();
      onClose();
    } catch (error) {
      message.error(
        `${editingItem ? "Couldn't update the item" : "Couldn't add the item"}: ${apiErrorText(error)}`,
        6
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={handleSave}
      confirmLoading={saving}
      okText={editingItem ? "Save" : "Add item"}
      okButtonProps={{ className: "mavebutton" }}
      title={editingItem ? "Edit menu item" : `Add item to "${menu?.name || ""}"`}
      width={640}
      destroyOnClose
    >
      <div className="flex flex-col gap-4 pt-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Typography.Text strong>Item name</Typography.Text>
            <Input
              className="mt-1"
              placeholder="e.g. About Us"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <Typography.Text strong>আইটেম নাম (optional)</Typography.Text>
            <Input
              className="mt-1"
              placeholder="যেমন: আমাদের সম্পর্কে"
              value={titleBn}
              onChange={(e) => setTitleBn(e.target.value)}
            />
          </div>
        </div>

        <div>
          <Typography.Text strong>Show under</Typography.Text>
          <Select
            className="w-full mt-1"
            value={parentId}
            onChange={(value) => setParentId(value ?? null)}
            showSearch
            optionFilterProp="children"
          >
            <Option value={null}>Top level (no parent)</Option>
            {parentOptions.map((item) => (
              <Option key={item.id} value={item.id}>
                {item.title}
              </Option>
            ))}
          </Select>
        </div>

        <div>
          <div className="flex justify-between items-center">
            <Typography.Text strong>Link to</Typography.Text>
            <Radio.Group value={linkType} onChange={(e) => setLinkType(e.target.value)}>
              <Radio value="page">A page</Radio>
              <Radio value="independent">Custom link</Radio>
            </Radio.Group>
          </div>
          {linkType === "page" ? (
            <Select
              className="w-full mt-1"
              placeholder="Choose a page"
              value={pageId}
              onChange={setPageId}
              showSearch
              optionFilterProp="children"
            >
              {pages.map((page) => (
                <Option key={page.id} value={page.id}>
                  {page.page_name_en}
                </Option>
              ))}
            </Select>
          ) : (
            <Input
              className="mt-1"
              placeholder="https://… or /path (leave empty to auto-generate)"
              value={customLink}
              onChange={(e) => setCustomLink(e.target.value)}
            />
          )}
          <Typography.Text type="secondary" className="block mt-1 text-xs break-all">
            Link: {previewLink}
          </Typography.Text>
        </div>
      </div>
    </Modal>
  );
};

export default MenuItemModal;
