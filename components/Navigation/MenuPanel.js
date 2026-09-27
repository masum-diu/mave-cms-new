// components/Navigation/MenuPanel.js

import React, { useMemo, useState } from "react";
import {
  Alert,
  Button,
  Empty,
  Input,
  Popconfirm,
  Select,
  Tag,
  Tooltip,
  message,
} from "antd";
import {
  CheckOutlined,
  DeleteOutlined,
  DisconnectOutlined,
  EditOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import instance from "../../axios";
import MenuItemModal from "./MenuItemModal";
import {
  apiErrorText,
  buildTree,
  collectDescendantIds,
  getMenuItems,
} from "./navigationUtils";
import { createMenu } from "./navigationApi";

const { Option } = Select;

const MenuTreeNode = ({ node, depth, onAddChild, onEdit, onRemove, onDelete }) => (
  <>
    <div
      className="group flex items-center gap-3 py-2 pr-2 border-b border-gray-100 hover:bg-amber-50 rounded"
      style={{ paddingLeft: 12 + depth * 28 }}
    >
      {depth > 0 && <span className="text-gray-300">└</span>}
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">
          {node.title}
          {node.title_bn && node.title_bn !== "N/A" && (
            <span className="ml-2 text-gray-400 font-normal">{node.title_bn}</span>
          )}
        </div>
        <Tooltip title={node.link}>
          <div className="text-xs text-gray-400 truncate">{node.link}</div>
        </Tooltip>
      </div>
      <div className="flex gap-1 shrink-0">
        <Tooltip title="Add sub-item">
          <Button size="small" icon={<PlusOutlined />} onClick={() => onAddChild(node)} />
        </Tooltip>
        <Tooltip title="Edit">
          <Button size="small" icon={<EditOutlined />} onClick={() => onEdit(node)} />
        </Tooltip>
        <Popconfirm
          title="Remove from this menu?"
          description="The item (and its sub-items) stay available to other menus."
          onConfirm={() => onRemove(node)}
        >
          <Tooltip title="Remove from menu">
            <Button size="small" icon={<DisconnectOutlined />} />
          </Tooltip>
        </Popconfirm>
        <Popconfirm
          title="Delete this item everywhere?"
          description="This permanently deletes the menu item."
          okButtonProps={{ danger: true }}
          onConfirm={() => onDelete(node)}
        >
          <Tooltip title="Delete permanently">
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Tooltip>
        </Popconfirm>
      </div>
    </div>
    {node.children.map((child) => (
      <MenuTreeNode
        key={child.id}
        node={child}
        depth={depth + 1}
        onAddChild={onAddChild}
        onEdit={onEdit}
        onRemove={onRemove}
        onDelete={onDelete}
      />
    ))}
  </>
);

const MenuPanel = ({
  navbar,
  menu,
  menus,
  navbars,
  allMenuItems,
  pages,
  onAssignMenu,
  reload,
}) => {
  const [itemModal, setItemModal] = useState({ open: false, item: null, parentId: null });
  const [newMenuName, setNewMenuName] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [menuName, setMenuName] = useState("");
  const [attachIds, setAttachIds] = useState([]);

  const items = useMemo(() => getMenuItems(menu, allMenuItems), [menu, allMenuItems]);
  const tree = useMemo(() => buildTree(items), [items]);
  const itemIds = items.map((item) => item.id);
  const otherNavbars = navbars.filter(
    (nb) => nb.id !== navbar.id && (nb.menu_id ?? nb.menu?.id) === menu?.id
  );
  const attachable = allMenuItems.filter((item) => !itemIds.includes(item.id));

  const saveMenu = async (name, ids, successText) => {
    try {
      const response = await instance.put(`/menus/${menu.id}`, {
        name,
        menu_item_ids: ids,
      });
      if (response.status !== 200) throw new Error();
      message.success(successText);
      reload();
      return true;
    } catch (error) {
      message.error(`Couldn't update the menu: ${apiErrorText(error)}`, 6);
      return false;
    }
  };

  const handleCreateMenu = async () => {
    const name = newMenuName.trim() || `${navbar.title_en} menu`;
    try {
      const newId = await createMenu(name);
      setNewMenuName("");
      if (newId) {
        await onAssignMenu(newId);
      } else {
        message.warning("Menu created. Select it from the list to attach it.");
        reload();
      }
    } catch (error) {
      message.error(`Couldn't create the menu: ${apiErrorText(error)}`, 6);
    }
  };

  const handleRemove = (node) => {
    const drop = new Set([node.id, ...collectDescendantIds(node.id, items)]);
    if (itemIds.every((id) => drop.has(id))) {
      message.warning("A menu needs at least one item. Add another item before removing this one.");
      return;
    }
    saveMenu(menu.name, itemIds.filter((id) => !drop.has(id)), "Removed from menu");
  };

  const handleDelete = async (node) => {
    try {
      const response = await instance.delete(`/menuitems/${node.id}`);
      if (response.status !== 200 && response.status !== 204) throw new Error();
      message.success("Menu item deleted");
      reload();
    } catch {
      message.error("Error deleting menu item");
    }
  };

  const handleAttach = async () => {
    // Bring sub-items along so the attached branch shows up complete.
    const withChildren = attachIds.flatMap((id) => [id, ...collectDescendantIds(id, allMenuItems)]);
    const ok = await saveMenu(
      menu.name,
      [...new Set([...itemIds, ...withChildren])],
      "Items added to menu"
    );
    if (ok) setAttachIds([]);
  };

  const menuPicker = (
    <Select
      className="w-full md:w-64"
      placeholder="Choose an existing menu"
      value={menu?.id}
      onChange={onAssignMenu}
      showSearch
      optionFilterProp="children"
    >
      {menus.map((m) => (
        <Option key={m.id} value={m.id}>
          {m.name}
        </Option>
      ))}
    </Select>
  );

  if (!menu) {
    return (
      <div className="bg-white rounded-xl border p-6">
        <h3 className="text-lg font-semibold mb-1">Menu</h3>
        <p className="text-gray-500 mb-4">
          This navbar has no menu yet. Pick an existing one or create a new one.
        </p>
        <div className="flex flex-col md:flex-row gap-3">
          {menuPicker}
          <span className="self-center text-gray-400">or</span>
          <Input
            className="md:w-64"
            placeholder={`${navbar.title_en} menu`}
            value={newMenuName}
            onChange={(e) => setNewMenuName(e.target.value)}
            onPressEnter={handleCreateMenu}
          />
          <Button className="mavebutton" icon={<PlusOutlined />} onClick={handleCreateMenu}>
            Create menu
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <img src="/icons/mave/menus.svg" alt="" className="w-5" />
          {renaming ? (
            <>
              <Input
                value={menuName}
                onChange={(e) => setMenuName(e.target.value)}
                onPressEnter={async () =>
                  (await saveMenu(menuName.trim() || menu.name, itemIds, "Menu renamed")) &&
                  setRenaming(false)
                }
                autoFocus
              />
              <Button
                icon={<CheckOutlined />}
                onClick={async () =>
                  (await saveMenu(menuName.trim() || menu.name, itemIds, "Menu renamed")) &&
                  setRenaming(false)
                }
              />
            </>
          ) : (
            <>
              <h3 className="text-lg font-semibold truncate m-0">{menu.name}</h3>
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => {
                  setMenuName(menu.name);
                  setRenaming(true);
                }}
              />
              <Tag>{items.length} items</Tag>
            </>
          )}
        </div>
        <div className="flex gap-2 items-center">
          <span className="text-gray-400 text-sm whitespace-nowrap">Switch menu</span>
          {menuPicker}
        </div>
      </div>

      {otherNavbars.length > 0 && (
        <Alert
          className="mb-4"
          type="info"
          showIcon
          message={`This menu is also used by: ${otherNavbars
            .map((nb) => nb.title_en)
            .join(", ")}. Changes here affect those navbars too.`}
        />
      )}

      {tree.length === 0 ? (
        <Empty description="No items in this menu yet" />
      ) : (
        <div className="mb-4">
          {tree.map((node) => (
            <MenuTreeNode
              key={node.id}
              node={node}
              depth={0}
              onAddChild={(parent) => setItemModal({ open: true, item: null, parentId: parent.id })}
              onEdit={(item) => setItemModal({ open: true, item, parentId: null })}
              onRemove={handleRemove}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-3 mt-4">
        <Button
          className="mavebutton"
          icon={<PlusOutlined />}
          onClick={() => setItemModal({ open: true, item: null, parentId: null })}
        >
          Add new item
        </Button>
        <div className="flex flex-1 gap-2">
          <Select
            mode="multiple"
            className="flex-1"
            placeholder="…or add existing items"
            value={attachIds}
            onChange={setAttachIds}
            optionFilterProp="children"
            allowClear
          >
            {attachable.map((item) => (
              <Option key={item.id} value={item.id}>
                {item.title}
              </Option>
            ))}
          </Select>
          <Button disabled={!attachIds.length} onClick={handleAttach}>
            Add
          </Button>
        </div>
      </div>

      <MenuItemModal
        open={itemModal.open}
        onClose={() => setItemModal({ open: false, item: null, parentId: null })}
        menu={menu}
        menuItems={items}
        allMenuItems={allMenuItems}
        pages={pages}
        editingItem={itemModal.item}
        defaultParentId={itemModal.parentId}
        onSaved={reload}
      />
    </div>
  );
};

export default MenuPanel;
