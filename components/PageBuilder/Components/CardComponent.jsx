// components/PageBuilder/Components/CardComponent.jsx

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Button, Typography, message, Popconfirm } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  CopyFilled,
  DragOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import CardSelectionModal from "../Modals/CardSelectionModal";
import Image from "next/image";
import instance from "../../../axios";
import { setIsDirty, setLastSaved } from "../../../store/slices/pageSlice";

const { Text } = Typography;

// Configuration
const POLLING_INTERVAL = 30000; // 30 seconds

// Helper function to render card media
const renderCardMedia = (media) => {
  if (!media || !media.file_path) {
    return (
      <div className="relative w-full h-56">
        <Image
          src="/images/Image_Placeholder.png"
          alt="No Image"
          layout="fill"
          objectFit="cover"
          priority
        />
      </div>
    );
  }
  return (
    <div className="relative w-full h-56">
      <Image
        src={`${process.env.NEXT_PUBLIC_MEDIA_URL}/${media.file_path}`}
        alt={media.title_en || "Card Image"}
        layout="fill"
        objectFit="cover"
        priority
      />
    </div>
  );
};

// Renders English + Bangla title/description stacked together
const renderCardText = (data) => (
  <div className="p-4">
    <h3 className="text-lg font-semibold mb-1">
      {data.title_en || "Untitled Card"}
    </h3>
    {data.title_bn && (
      <h4 className="text-base font-semibold text-gray-700 mb-2">
        {data.title_bn}
      </h4>
    )}
    <div
      className="text-gray-600 prose max-w-none"
      dangerouslySetInnerHTML={{
        __html: data.description_en || "No description available",
      }}
    />
    {data.description_bn && (
      <div
        className="text-gray-500 prose max-w-none mt-2 pt-2 border-t border-gray-100"
        dangerouslySetInnerHTML={{ __html: data.description_bn }}
      />
    )}
  </div>
);

const CardComponent = ({
  component,
  updateComponent,
  deleteComponent,
  preview = false,
  onDuplicateElement,
}) => {
  const dispatch = useDispatch();
  const pageData = useSelector((state) => state.page.pageData);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [cardData, setCardData] = useState(component._mave);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [autoPolling, setAutoPolling] = useState(false);
  const [cardMissing, setCardMissing] = useState(false);
  const lastUpdateRef = useRef(null);
  const pendingAutoSaveRef = useRef(false);

  // Synchronize cardData with component._mave when it changes
  useEffect(() => {
    setCardData(component._mave);
    setCardMissing(false);
  }, [component._mave]);

  // Card auto-sync shouldn't need a manual Save click (or the 30s autosave
  // wait) to actually reach the database — persist immediately once the
  // synced change has flowed through Redux into `pageData`. Note: since the
  // API only supports whole-page PUTs, this also persists any other
  // unsaved edits present on the page at that moment; only fires inside a
  // real Page Builder session where Redux `pageData` is populated (the
  // standalone /page-preview route keeps its own local copy and is
  // unaffected).
  useEffect(() => {
    if (!pendingAutoSaveRef.current || !pageData?.id) return;
    pendingAutoSaveRef.current = false;

    (async () => {
      try {
        const response = await instance.put(`/pages/${pageData.id}`, pageData);
        if (response.status === 200) {
          dispatch(setIsDirty(false));
          dispatch(setLastSaved(new Date().toISOString()));
        }
      } catch (err) {
        console.error("Failed to auto-save synced card data:", err);
      }
    })();
  }, [pageData, dispatch]);

  // Auto-sync works everywhere (page-builder edit view AND live preview).
  // Note: `isEditing` here is the whole page's Edit/View mode toggle, not a
  // "some field is mid-keystroke" flag — it's true basically the entire
  // time someone is using the Page Builder, so it must NOT gate this. The
  // only thing that should pause sync is this component's own selection
  // drawer being open, or the source card having been deleted.
  useEffect(() => {
    setAutoPolling(!isModalVisible && !cardMissing);
  }, [isModalVisible, cardMissing]);

  // Function to refresh card data from the server
  const refreshCardData = useCallback(
    async (silent = false) => {
      // Don't clobber an in-progress card selection for this component
      if (isModalVisible) {
        return;
      }

      if (!cardData?.id) {
        if (!silent) {
          message.warning("No card ID available to refresh");
        }
        return;
      }

      // Check if we've already updated recently to prevent rapid updates
      const now = Date.now();
      if (lastUpdateRef.current && now - lastUpdateRef.current < 10000) {
        console.log("🔄 Skipping card update - too recent");
        return;
      }

      setIsRefreshing(true);
      try {
        const response = await instance.get(`/cards/${cardData.id}`);
        if (response.status === 200) {
          const updatedCard = response.data;
          setCardMissing(false);

          // Compare against the actual card fields only — component._mave
          // also carries a locally-added `config` the raw card never has,
          // which would otherwise always look like a change.
          const { config: _config, ...existingCardFields } =
            component._mave || {};
          const hasChanges =
            JSON.stringify(updatedCard) !== JSON.stringify(existingCardFields);

          if (hasChanges) {
            const updatedComponent = {
              ...component,
              _mave: {
                ...updatedCard,
                config: cardData.config || {
                  showDescription: true,
                  showImage: true,
                  layout: "horizontal",
                },
              },
              id: updatedCard.id,
            };

            updateComponent(updatedComponent);
            pendingAutoSaveRef.current = true;
            setCardData(updatedCard);
            setLastUpdated(new Date());
            lastUpdateRef.current = now;

            if (!silent) {
              message.success("Card data updated successfully");
            }
          } else if (!silent) {
            message.info("Card data is up to date");
          }
        }
      } catch (error) {
        console.error("Error refreshing card data:", error);
        if (error?.response?.status === 404) {
          // The source card was deleted — nothing left to sync from.
          setCardMissing((wasAlreadyMissing) => {
            if (!wasAlreadyMissing) {
              message.warning(
                "This card no longer exists in the Cards library. Please select a different card."
              );
            }
            return true;
          });
        } else if (!silent) {
          message.error("Failed to refresh card data");
        }
      } finally {
        setIsRefreshing(false);
      }
    },
    [cardData?.id, cardData?.config, component, updateComponent, isModalVisible]
  );

  // refreshCardData is recreated whenever `component`/`updateComponent`
  // change identity (which happens on nearly every render in this Redux
  // tree). Keeping it out of the interval effect's deps (to avoid
  // restarting the timer constantly) meant the interval kept calling a
  // stale closure with an outdated `component` reference — so the fetch
  // would succeed but the dispatched update could silently miss. A ref
  // always pointing at the latest function fixes that.
  const refreshCardDataRef = useRef(refreshCardData);
  useEffect(() => {
    refreshCardDataRef.current = refreshCardData;
  }, [refreshCardData]);

  // Keep this card in sync with the source Card wherever it's rendered —
  // polls in the background and silently applies changes.
  useEffect(() => {
    if (!autoPolling || !cardData?.id) return;

    refreshCardDataRef.current(true);
    const intervalId = setInterval(() => {
      refreshCardDataRef.current(true);
    }, POLLING_INTERVAL);

    return () => clearInterval(intervalId);
  }, [autoPolling, cardData?.id]);

  // Handle selection from CardSelectionModal — the drawer's own "Save"
  // button (after picking a card and configuring it) IS the confirm step,
  // so applying the update immediately here, no separate outer confirm.
  const handleSelectCard = useCallback(
    (selectedCard) => {
      const updatedComponent = {
        ...component,
        _mave: {
          ...selectedCard,
          config: selectedCard.config || {
            showDescription: true,
            showImage: true,
            layout: "horizontal",
          },
        },
        id: selectedCard.id,
      };

      updateComponent(updatedComponent);
      setCardData(selectedCard);
      setIsModalVisible(false);
      message.success("Card updated successfully.");
    },
    [component, updateComponent]
  );

  // Handle Delete Component
  const handleDelete = useCallback(() => {
    deleteComponent();
  }, [deleteComponent]);

  // If in preview mode, render the card content only
  if (preview) {
    return (
      <div className="preview-card-component p-4 bg-gray-100 rounded-md">
        {cardData && (
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <Button
                icon={<ReloadOutlined spin={isRefreshing} />}
                onClick={() => refreshCardData(false)}
                loading={isRefreshing}
                size="small"
                className="mavebutton"
                title="Refresh card data"
              />
              {autoPolling && (
                <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                  Auto-refresh active
                </span>
              )}
            </div>
          </div>
        )}
        {cardMissing && (
          <div className="mb-2 text-sm text-orange-700 bg-orange-50 border border-orange-200 rounded px-3 py-2">
            This card no longer exists in the Cards library.
          </div>
        )}
        {cardData ? (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {renderCardMedia(cardData.media_files)}
            {renderCardText(cardData)}
          </div>
        ) : (
          <Text className="text-gray-500">No card data available.</Text>
        )}
      </div>
    );
  }

  return (
    <div className="border p-4 rounded-md bg-white">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <DragOutlined className="text-2xl border rounded-md p-1" />
          <h3 className="text-xl font-semibold">Card Component</h3>
          {cardData && (
            <Button
              icon={<ReloadOutlined spin={isRefreshing} />}
              onClick={() => refreshCardData(false)}
              loading={isRefreshing}
              size="small"
              className="mavebutton"
              title="Refresh card data"
            />
          )}
          {autoPolling && (
            <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
              Auto-refresh active
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {cardData && (
            <>
              <Button
                icon={<EditOutlined />}
                onClick={() => setIsModalVisible(true)}
                className="mavebutton"
              >
                Update
              </Button>
              <Button
                icon={<CopyFilled />}
                onClick={onDuplicateElement}
                className="mavebutton"
              />
              <Popconfirm
                title="Are you sure you want to delete this component?"
                onConfirm={handleDelete}
                okText="Yes"
                cancelText="No"
                okButtonProps={{ danger: true }}
              >
                <Button
                  icon={<DeleteOutlined />}
                  className="mavecancelbutton"
                />
              </Popconfirm>
            </>
          )}
        </div>
      </div>

      {cardMissing && (
        <div className="mb-4 flex items-center justify-between gap-3 text-sm text-orange-700 bg-orange-50 border border-orange-200 rounded px-3 py-2">
          <span>
            This card no longer exists in the Cards library — the data below
            is stale.
          </span>
          <Button
            size="small"
            className="mavebutton"
            onClick={() => setIsModalVisible(true)}
          >
            Select a different card
          </Button>
        </div>
      )}

      {cardData ? (
        <div className="w-full relative">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {renderCardMedia(cardData.media_files)}
            {renderCardText(cardData)}
          </div>
        </div>
      ) : (
        <Button
          icon={<EditOutlined />}
          onClick={() => setIsModalVisible(true)}
          className="mavebutton w-fit"
        >
          Select Card
        </Button>
      )}

      <CardSelectionModal
        isVisible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onSelectCard={handleSelectCard}
      />
    </div>
  );
};

export default CardComponent;
