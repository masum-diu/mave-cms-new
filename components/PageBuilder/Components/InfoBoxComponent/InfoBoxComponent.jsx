// components/PageBuilder/Components/InfoBoxComponent/InfoBoxComponent.jsx

import React, { useState } from "react";
import { Button, Space, Form, message, Popconfirm, Collapse } from "antd";
import {
  PlusOutlined,
  MinusOutlined,
  EditOutlined,
  DeleteOutlined,
  SettingOutlined,
  CopyFilled,
} from "@ant-design/icons";
import Image from "next/image";
import MediaSelectionModal from "../../Modals/MediaSelectionModal";
import ConfigSection from "./ConfigSection";
import MainContentSection from "./MainContentSection";
import AddInfoItemForm from "./AddInfoItemForm";

const { Panel } = Collapse;

const emptyItemFields = () => ({
  title: "",
  description: "",
  secondTitle: "",
  secondDescription: "",
  altTitle: "",
  altDescription: "",
});

const normalizeInfoBox = (mave = {}) => ({
  title: mave.title || "",
  description: mave.description || "",
  secondTitle: mave.secondTitle || "",
  secondDescription: mave.secondDescription || "",
  altTitle: mave.altTitle || "",
  altDescription: mave.altDescription || "",
  media: Array.isArray(mave.media) ? mave.media : [],
  infoItems: Array.isArray(mave.infoItems)
    ? mave.infoItems.map((item) => ({
        id: item.id || Date.now() + Math.random(),
        title: item.title || "",
        description: item.description || "",
        secondTitle: item.secondTitle || "",
        secondDescription: item.secondDescription || "",
        altTitle: item.altTitle || "",
        altDescription: item.altDescription || "",
        link: item.link || "",
        media: Array.isArray(item.media) ? item.media : [],
      }))
    : [],
});

const InfoBoxComponent = ({
  component,
  updateComponent,
  deleteComponent,
  preview = false,
  onDuplicateElement,
}) => {
  const [infoBox, setInfoBox] = useState(() =>
    normalizeInfoBox(component._mave)
  );
  const [isEditMode, setIsEditMode] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [formKey, setFormKey] = useState(0);
  const [layout, setLayout] = useState(component._mave?.layout || "horizontal");
  const [font, setFont] = useState(component._mave?.font || "Arial");
  const [color, setColor] = useState(component._mave?.color || "#000000");
  const [background, setBackground] = useState(
    component._mave?.background || "#ffffff"
  );
  const [isMediaModalVisible, setIsMediaModalVisible] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState([]);
  const [mediaSelectionMode, setMediaSelectionMode] = useState("multiple");
  const [mediaTarget, setMediaTarget] = useState("main");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  const infoItems = Array.isArray(infoBox.infoItems) ? infoBox.infoItems : [];
  const mediaList = Array.isArray(infoBox.media) ? infoBox.media : [];

  const persist = (nextInfoBox, nextLayout = layout) => {
    updateComponent({
      ...component,
      _mave: {
        ...nextInfoBox,
        infoItems: Array.isArray(nextInfoBox.infoItems)
          ? nextInfoBox.infoItems
          : [],
        media: Array.isArray(nextInfoBox.media) ? nextInfoBox.media : [],
        layout: nextLayout,
        font,
        color,
        background,
      },
    });
  };

  const openMediaModal = (mode, target = "main") => {
    setMediaSelectionMode(mode);
    setMediaTarget(target);
    if (target === "item") {
      setSelectedMedia([]);
    }
    setIsMediaModalVisible(true);
  };

  const handleMediaSelected = (media) => {
    const mediaArray = Array.isArray(media) ? media : media ? [media] : [];
    setIsMediaModalVisible(false);

    if (mediaTarget === "main") {
      setInfoBox((prev) => ({ ...prev, media: mediaArray }));
      message.success("Main media updated.");
      return;
    }

    setSelectedMedia(mediaArray);
    message.success("Item media selected.");
  };

  const getInitialMediaForModal = () => {
    if (mediaTarget === "main") return mediaList;
    return Array.isArray(selectedMedia) ? selectedMedia : [];
  };

  const buildItemFromValues = (values, id) => ({
    id,
    title: values.title || "",
    description: values.description || "",
    secondTitle: values.secondTitle || "",
    secondDescription: values.secondDescription || "",
    altTitle: values.altTitle || "",
    altDescription: values.altDescription || "",
    link: values.link || "",
    media: Array.isArray(selectedMedia) ? selectedMedia : [],
  });

  const handleAddSubmit = (values) => {
    const newInfoItem = buildItemFromValues(values, Date.now());
    const next = {
      ...infoBox,
      infoItems: [...infoItems, newInfoItem],
    };
    setInfoBox(next);
    persist(next);
    form.resetFields();
    form.setFieldsValue(emptyItemFields());
    setSelectedMedia([]);
    setFormKey((k) => k + 1);
    setShowAddForm(true);
    message.success(`Info item #${next.infoItems.length} added. Add another below.`);
  };

  const handleEditInfoItem = (item) => {
    setEditingItemId(item.id);
    setShowAddForm(false);
    editForm.setFieldsValue({
      title: item.title,
      description: item.description,
      secondTitle: item.secondTitle,
      secondDescription: item.secondDescription,
      altTitle: item.altTitle,
      altDescription: item.altDescription,
      link: item.link,
    });
    setSelectedMedia(Array.isArray(item.media) ? item.media : []);
    setFormKey((k) => k + 1);
  };

  const handleEditSubmit = (values) => {
    const updatedItem = buildItemFromValues(values, editingItemId);
    const next = {
      ...infoBox,
      infoItems: infoItems.map((item) =>
        item.id === editingItemId ? updatedItem : item
      ),
    };
    setInfoBox(next);
    persist(next);
    setEditingItemId(null);
    setSelectedMedia([]);
    message.success("Info item updated.");
  };

  const handleCancelItemEdit = () => {
    setEditingItemId(null);
    setSelectedMedia([]);
    editForm.resetFields();
  };

  const handleDeleteInfoItem = (id) => {
    const next = {
      ...infoBox,
      infoItems: infoItems.filter((item) => item.id !== id),
    };
    setInfoBox(next);
    persist(next);
    if (editingItemId === id) handleCancelItemEdit();
    message.success("Info item deleted.");
  };

  const handleDeleteComponent = () => {
    if (deleteComponent) {
      deleteComponent(component._id || component.id);
    }
  };

  const handleSave = () => {
    persist(infoBox);
    setIsEditMode(false);
    setShowAddForm(false);
    setEditingItemId(null);
    message.success("Info box saved.");
  };

  const handleCancelEditMode = () => {
    setInfoBox(normalizeInfoBox(component._mave));
    setLayout(component._mave?.layout || "horizontal");
    setFont(component._mave?.font || "Arial");
    setColor(component._mave?.color || "#000000");
    setBackground(component._mave?.background || "#ffffff");
    setShowAddForm(false);
    setEditingItemId(null);
    setSelectedMedia([]);
    setIsEditMode(false);
  };

  const openAddForm = () => {
    setEditingItemId(null);
    setSelectedMedia([]);
    form.resetFields();
    form.setFieldsValue(emptyItemFields());
    setFormKey((k) => k + 1);
    setShowAddForm(true);
  };

  const containerStyle = {
    fontFamily: font,
    color,
    backgroundColor: background,
    padding: "20px",
    borderRadius: "8px",
  };

  const renderHtml = (html) =>
    html ? <div dangerouslySetInnerHTML={{ __html: html }} /> : null;

  const renderItemPreview = (item, index) => (
    <div key={item.id} className="bg-white p-4 rounded-md shadow-sm border mb-3">
      <div className="flex justify-between items-start gap-3 mb-2">
        <span className="text-xs font-semibold text-gray-400">
          Info Item #{index + 1}
        </span>
        {!preview && isEditMode && (
          <Space>
            <Button
              size="small"
              className="mavebutton"
              icon={<EditOutlined />}
              onClick={() => handleEditInfoItem(item)}
            />
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteInfoItem(item.id)}
            />
          </Space>
        )}
      </div>
      <div className="grid grid-cols-12 gap-4 items-start">
        <div className="col-span-3">
          {Array.isArray(item.media) && item.media[0] && (
            <Image
              src={`${process.env.NEXT_PUBLIC_MEDIA_URL}/${item.media[0].file_path}`}
              alt={item.media[0].title || "Media"}
              width={100}
              height={100}
              objectFit="cover"
              className="rounded-md"
            />
          )}
        </div>
        <div className="col-span-9 space-y-1">
          {item.title && <h3 className="text-lg font-semibold m-0">{item.title}</h3>}
          {renderHtml(item.description)}
          {item.secondTitle && (
            <h4 className="text-base font-semibold m-0">{item.secondTitle}</h4>
          )}
          {renderHtml(item.secondDescription)}
          {item.altTitle && (
            <h4 className="text-sm font-semibold m-0">{item.altTitle}</h4>
          )}
          {renderHtml(item.altDescription)}
        </div>
      </div>
    </div>
  );

  return (
    <div className="border p-4 rounded-md bg-gray-50">
      {!preview && (
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-xl font-semibold">Info Box Component</h3>
            <p className="text-sm text-gray-500 m-0">
              {infoItems.length} info item{infoItems.length === 1 ? "" : "s"}
            </p>
          </div>
          <Space>
            {isEditMode ? (
              <>
                <Button className="mavebutton" type="primary" onClick={handleSave}>
                  Save Changes
                </Button>
                <Button className="mavecancelbutton" onClick={handleCancelEditMode}>
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button className="mavebutton" onClick={() => setIsEditMode(true)}>
                  Edit
                </Button>
                <Button
                  icon={<CopyFilled />}
                  onClick={onDuplicateElement}
                  className="mavebutton"
                />
              </>
            )}
            <Popconfirm
              title="Delete Component"
              description="Are you sure you want to delete this component?"
              onConfirm={handleDeleteComponent}
              okText="Yes"
              cancelText="No"
              okButtonProps={{ danger: true }}
            >
              <Button danger>Delete</Button>
            </Popconfirm>
          </Space>
        </div>
      )}

      {!preview && isEditMode && (
        <Space direction="vertical" style={{ width: "100%" }} size="large">
          <div className="flex justify-end">
            <Button
              icon={<SettingOutlined />}
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? "Hide Advanced" : "Show Advanced"}
            </Button>
          </div>

          {showAdvanced && (
            <ConfigSection
              layout={layout}
              font={font}
              color={color}
              background={background}
              onLayoutChange={setLayout}
              onFontChange={setFont}
              onColorChange={(e) => setColor(e.target.value)}
              onBackgroundChange={(e) => setBackground(e.target.value)}
            />
          )}

          {/* Main box header — once */}
          <div className="bg-white p-4 rounded-md border border-gray-200">
            <h4 className="text-base font-semibold mb-3 text-gray-700">
              Main Content
            </h4>
            <MainContentSection
              infoBox={infoBox}
              onInfoBoxChange={setInfoBox}
              onMediaSelect={() => openMediaModal("multiple", "main")}
              media={mediaList}
            />
          </div>

          {/* Multiple info items */}
          <div className="border border-gray-200 rounded-md bg-white p-4">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
              <div>
                <h4 className="text-lg font-semibold m-0">Info Item</h4>
                <p className="text-xs text-gray-500 m-0">
                  Same fields as main — add as many items as you need
                </p>
              </div>
              <Button
                className="mavebutton"
                icon={showAddForm ? <MinusOutlined /> : <PlusOutlined />}
                onClick={() => (showAddForm ? setShowAddForm(false) : openAddForm())}
              >
                {showAddForm ? "Close" : "Add Item"}
              </Button>
            </div>

            {/* Saved items list */}
            {infoItems.length > 0 && (
              <div className="mb-4">
                {editingItemId ? null : (
                  <Collapse accordion>
                    {infoItems.map((item, index) => (
                      <Panel
                        header={`#${index + 1} — ${item.title || "Untitled"}`}
                        key={item.id}
                        extra={
                          <Space
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              size="small"
                              icon={<EditOutlined />}
                              onClick={() => handleEditInfoItem(item)}
                            />
                            <Button
                              size="small"
                              danger
                              icon={<DeleteOutlined />}
                              onClick={() => handleDeleteInfoItem(item.id)}
                            />
                          </Space>
                        }
                      >
                        {renderItemPreview(item, index)}
                      </Panel>
                    ))}
                  </Collapse>
                )}
              </div>
            )}

            {/* Edit existing item */}
            {editingItemId && (
              <div className="mb-4">
                <h5 className="font-medium mb-2">Edit Info Item</h5>
                <AddInfoItemForm
                  key={`edit-${editingItemId}-${formKey}`}
                  form={editForm}
                  onFinish={handleEditSubmit}
                  onMediaSelect={() => openMediaModal("multiple", "editItem")}
                  selectedMedia={selectedMedia}
                  submitLabel="Update Item"
                  editorKey={`edit-${editingItemId}-${formKey}`}
                />
                <Button className="mt-2" onClick={handleCancelItemEdit}>
                  Cancel edit
                </Button>
              </div>
            )}

            {/* Add new item form */}
            {showAddForm && !editingItemId && (
              <div>
                <h5 className="font-medium mb-2">
                  New Info Item #{infoItems.length + 1}
                </h5>
                <AddInfoItemForm
                  key={`add-${formKey}`}
                  form={form}
                  onFinish={handleAddSubmit}
                  onMediaSelect={() => openMediaModal("multiple", "item")}
                  selectedMedia={selectedMedia}
                  submitLabel="Submit"
                  editorKey={`add-${formKey}`}
                />
              </div>
            )}

            {infoItems.length === 0 && !showAddForm && (
              <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
                <p className="text-gray-500 mb-3">No info items yet</p>
                <Button className="mavebutton" icon={<PlusOutlined />} onClick={openAddForm}>
                  Add Item
                </Button>
              </div>
            )}

            {infoItems.length > 0 && !showAddForm && !editingItemId && (
              <div className="mt-3 text-center">
                <Button className="mavebutton" icon={<PlusOutlined />} onClick={openAddForm}>
                  Add another item
                </Button>
              </div>
            )}
          </div>
        </Space>
      )}

      {(preview || !isEditMode) && (
        <div style={containerStyle}>
          {infoBox.title && (
            <h2 className="text-2xl font-bold mb-2">{infoBox.title}</h2>
          )}
          {renderHtml(infoBox.description)}
          {infoBox.secondTitle && (
            <h3 className="text-xl font-semibold mb-2 mt-4">{infoBox.secondTitle}</h3>
          )}
          {renderHtml(infoBox.secondDescription)}
          {infoBox.altTitle && (
            <h3 className="text-lg font-semibold mb-2 mt-4">{infoBox.altTitle}</h3>
          )}
          {renderHtml(infoBox.altDescription)}

          {mediaList.length > 0 && (
            <div className="flex flex-wrap gap-2 my-4">
              {mediaList.map((mediaItem, index) => (
                <Image
                  key={index}
                  src={`${process.env.NEXT_PUBLIC_MEDIA_URL}/${mediaItem.file_path}`}
                  alt={mediaItem.title || "Media"}
                  width={280}
                  height={280}
                  objectFit="cover"
                  className="rounded-md"
                />
              ))}
            </div>
          )}

          <div className="mt-4">
            {infoItems.map((item, index) => renderItemPreview(item, index))}
            {infoItems.length === 0 && (
              <p className="text-gray-400 text-sm">No info items added yet.</p>
            )}
          </div>
        </div>
      )}

      {!preview && isEditMode && (
        <MediaSelectionModal
          key={`infobox-media-${mediaTarget}-${editingItemId || formKey}`}
          isVisible={isMediaModalVisible}
          onClose={() => setIsMediaModalVisible(false)}
          onSelectMedia={handleMediaSelected}
          selectionMode={mediaSelectionMode}
          initialSelectedMedia={getInitialMediaForModal()}
        />
      )}
    </div>
  );
};

export default InfoBoxComponent;
