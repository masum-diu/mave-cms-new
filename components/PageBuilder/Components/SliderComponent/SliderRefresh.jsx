import { useState, useEffect, useRef, useCallback } from "react";
import { message } from "antd";
import instance from "../../../../axios";
import { useRouter } from "next/router";
import { subscribeCardChanges } from "../../../../utils/cardSync";

const POLL_INTERVAL = 10000; // 10 seconds in page-builder
const MIN_REFRESH_GAP_MS = 1500;

export const useSliderRefresh = (
  sliderData,
  component,
  updateComponent,
  preview = false,
  isEditing = false
) => {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pollingError, setPollingError] = useState(null);
  const [lastSynced, setLastSynced] = useState(null);
  const [hasUpdate, setHasUpdate] = useState(false);
  const intervalRef = useRef(null);
  const mountedRef = useRef(true);
  const lastRefreshAtRef = useRef(0);
  const sliderDataRef = useRef(sliderData);
  const componentRef = useRef(component);
  const updateComponentRef = useRef(updateComponent);

  useEffect(() => {
    sliderDataRef.current = sliderData;
  }, [sliderData]);

  useEffect(() => {
    componentRef.current = component;
  }, [component]);

  useEffect(() => {
    updateComponentRef.current = updateComponent;
  }, [updateComponent]);

  const isInPageBuilder = router.pathname.includes("/page-builder");
  const sliderId = component?.id || sliderData?.id;

  // Include card/media content so title/image edits are detected — not just IDs
  const fingerprint = (s) => {
    if (!s) return "";
    const medias = (s.medias || [])
      .map((m) => `${m.id}:${m.file_path || ""}:${m.updated_at || ""}`)
      .join(",");
    const cards = (s.cards || [])
      .map(
        (c) =>
          `${c.id}:${c.title_en || ""}:${c.title_bn || ""}:${
            c.media_files?.file_path || c.media_files?.id || ""
          }:${c.updated_at || ""}:${c.description_en || ""}`
      )
      .join(",");
    return `${s.id}|${s.title_en || ""}|${s.updated_at || ""}|${medias}|${cards}`;
  };

  const applyFreshSlider = useCallback((fresh, currentSlider) => {
    const updatedComponent = {
      ...componentRef.current,
      _mave: {
        ...fresh,
        config: currentSlider?.config || componentRef.current?._mave?.config,
        activeIds:
          currentSlider?.activeIds || componentRef.current?._mave?.activeIds,
      },
      id: fresh.id,
    };
    updateComponentRef.current(updatedComponent);
    setLastSynced(new Date());
    setHasUpdate(true);
    setTimeout(() => {
      if (mountedRef.current) setHasUpdate(false);
    }, 3000);
  }, []);

  const fetchAndSync = useCallback(
    async (manual = false, { force = false } = {}) => {
      const id = componentRef.current?.id || sliderDataRef.current?.id;
      if (!id) return;

      const now = Date.now();
      if (
        !manual &&
        !force &&
        lastRefreshAtRef.current &&
        now - lastRefreshAtRef.current < MIN_REFRESH_GAP_MS
      ) {
        return;
      }

      if (manual) setIsRefreshing(true);
      setPollingError(null);

      try {
        const response = await instance.get("/sliders");
        if (!mountedRef.current) return;

        if (response.status === 200 && Array.isArray(response.data)) {
          const fresh = response.data.find((s) => s.id === id);
          if (!fresh) {
            if (manual) message.warning("Slider not found on server.");
            return;
          }

          const current = sliderDataRef.current;
          const currentFp = fingerprint(current);
          const freshFp = fingerprint(fresh);

          if (force || currentFp !== freshFp) {
            applyFreshSlider(fresh, current);
            lastRefreshAtRef.current = now;
            if (manual) message.success("Slider synced with latest data.");
          } else {
            setLastSynced(new Date());
            lastRefreshAtRef.current = now;
            if (manual) message.info("Slider is already up to date.");
          }
        }
      } catch (err) {
        if (mountedRef.current) {
          setPollingError("Sync failed");
          if (manual) message.error("Failed to sync slider data.");
        }
      } finally {
        if (mountedRef.current && manual) setIsRefreshing(false);
      }
    },
    [applyFreshSlider]
  );

  const fetchAndSyncRef = useRef(fetchAndSync);
  useEffect(() => {
    fetchAndSyncRef.current = fetchAndSync;
  }, [fetchAndSync]);

  // When a card inside this slider is edited/deleted in Cards library,
  // merge fresh card data immediately (don't wait for poll / slider.updated_at).
  const mergeCardIntoSlider = useCallback(
    async (cardId, action) => {
      const current = sliderDataRef.current;
      if (!current || current.type !== "card") return;

      const cards = current.cards || [];
      const usesCard = cards.some((c) => String(c.id) === String(cardId));
      if (!usesCard) return;

      if (action === "deleted") {
        const nextCards = cards.filter((c) => String(c.id) !== String(cardId));
        applyFreshSlider({ ...current, cards: nextCards }, current);
        message.warning(
          "A card in this slider was deleted from the Cards library."
        );
        return;
      }

      try {
        const response = await instance.get(`/cards/${cardId}`);
        if (!mountedRef.current || response.status !== 200) return;

        const updatedCard = response.data;
        const nextCards = cards.map((c) =>
          String(c.id) === String(cardId) ? { ...c, ...updatedCard } : c
        );

        applyFreshSlider({ ...current, cards: nextCards }, current);
        lastRefreshAtRef.current = Date.now();
      } catch (err) {
        // Fall back to full slider refetch
        fetchAndSyncRef.current(false, { force: true });
      }
    },
    [applyFreshSlider]
  );

  // Auto-poll in page-builder
  useEffect(() => {
    mountedRef.current = true;

    if (isInPageBuilder && sliderId) {
      fetchAndSyncRef.current(false);
      intervalRef.current = setInterval(
        () => fetchAndSyncRef.current(false),
        POLL_INTERVAL
      );
    }

    return () => {
      mountedRef.current = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isInPageBuilder, sliderId]);

  // Instant sync when Cards library updates a card used by this slider
  useEffect(() => {
    if (!sliderId) return undefined;

    return subscribeCardChanges(({ cardId, action }) => {
      mergeCardIntoSlider(cardId, action);
    });
  }, [sliderId, mergeCardIntoSlider]);

  // Refresh when user returns to this tab (e.g. after editing Cards/Sliders)
  useEffect(() => {
    if (!sliderId) return undefined;

    const onFocus = () => {
      if (document.visibilityState === "visible") {
        lastRefreshAtRef.current = 0;
        fetchAndSyncRef.current(false, { force: true });
      }
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [sliderId]);

  const handleManualRefresh = useCallback(() => {
    lastRefreshAtRef.current = 0;
    fetchAndSync(true, { force: true });
  }, [fetchAndSync]);

  return {
    isRefreshing,
    pollingError,
    lastSynced,
    hasUpdate,
    handleManualRefresh,
  };
};
