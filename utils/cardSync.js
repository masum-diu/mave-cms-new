import instance from "../axios";
import { fetchPagesList } from "./pagesApi";
import { message } from "antd";

const CARD_SYNC_EVENT = "mave:card-updated";
const CARD_SYNC_STORAGE_KEY = "mave_card_sync";

/**
 * Call after create/update/delete of a card so every open Page Builder
 * CardComponent / SliderComponent can pull fresh data immediately.
 */
export const notifyCardChanged = (cardId, action = "updated") => {
  if (typeof window === "undefined" || !cardId) return;

  const payload = {
    cardId: String(cardId),
    action,
    at: Date.now(),
  };

  try {
    window.dispatchEvent(
      new CustomEvent(CARD_SYNC_EVENT, { detail: payload })
    );
  } catch (_) {}

  try {
    localStorage.setItem(CARD_SYNC_STORAGE_KEY, JSON.stringify(payload));
  } catch (_) {}
};

/**
 * Subscribe to card library changes. Returns an unsubscribe function.
 * `handler({ cardId, action, at })`
 */
export const subscribeCardChanges = (handler) => {
  if (typeof window === "undefined") return () => {};

  const onCustom = (event) => {
    if (event?.detail) handler(event.detail);
  };

  const onStorage = (event) => {
    if (event.key !== CARD_SYNC_STORAGE_KEY || !event.newValue) return;
    try {
      handler(JSON.parse(event.newValue));
    } catch (_) {}
  };

  window.addEventListener(CARD_SYNC_EVENT, onCustom);
  window.addEventListener("storage", onStorage);

  return () => {
    window.removeEventListener(CARD_SYNC_EVENT, onCustom);
    window.removeEventListener("storage", onStorage);
  };
};

const getComponentType = (comp) =>
  typeof comp?.type === "object" ? comp.type?.type : comp?.type;

const DEFAULT_CARD_CONFIG = {
  showDescription: true,
  showImage: true,
  layout: "horizontal",
};

/**
 * Pages store components in `section.data` (array). Older PB paths also
 * used `section.components` (object/array). Patch every known bucket and
 * keep shapes intact so the public frontend API stays valid.
 */
const getComponentBuckets = (section) => {
  const buckets = [];
  if (Array.isArray(section?.data)) {
    buckets.push({ key: "data", list: section.data, asArray: true });
  }
  if (Array.isArray(section?.components)) {
    buckets.push({
      key: "components",
      list: section.components,
      asArray: true,
    });
  } else if (
    section?.components &&
    typeof section.components === "object" &&
    !Array.isArray(section.components)
  ) {
    const entries = Object.entries(section.components);
    buckets.push({
      key: "components",
      list: entries.map(([, comp]) => comp),
      asArray: false,
      keys: entries.map(([k]) => k),
    });
  }
  return buckets;
};

const patchComponent = (comp, cardId, action, freshCard) => {
  if (!comp || typeof comp !== "object") {
    return { comp, changed: false };
  }

  const type = getComponentType(comp);
  const idMatch = (value) => String(value) === String(cardId);

  if (type === "card") {
    const id = comp.id ?? comp._mave?.id;
    if (!idMatch(id)) return { comp, changed: false };

    if (action === "deleted") {
      return { comp: { ...comp, id: null, _mave: null }, changed: true };
    }
    if (!freshCard) return { comp, changed: false };

    return {
      comp: {
        ...comp,
        id: freshCard.id,
        _mave: {
          ...freshCard,
          config: comp._mave?.config || DEFAULT_CARD_CONFIG,
        },
      },
      changed: true,
    };
  }

  if (type === "slider") {
    const mave = comp._mave;
    if (!mave) return { comp, changed: false };

    const cards = Array.isArray(mave.cards) ? mave.cards : [];
    const cardIds = Array.isArray(mave.card_ids) ? mave.card_ids : [];
    const usesCard =
      cards.some((c) => idMatch(c?.id)) || cardIds.some((id) => idMatch(id));

    if (!usesCard) return { comp, changed: false };

    if (action === "deleted") {
      return {
        comp: {
          ...comp,
          _mave: {
            ...mave,
            cards: cards.filter((c) => !idMatch(c?.id)),
            card_ids: cardIds.filter((id) => !idMatch(id)),
          },
        },
        changed: true,
      };
    }
    if (!freshCard) return { comp, changed: false };

    return {
      comp: {
        ...comp,
        _mave: {
          ...mave,
          cards: cards.map((c) =>
            idMatch(c?.id) ? { ...c, ...freshCard } : c
          ),
        },
      },
      changed: true,
    };
  }

  return { comp, changed: false };
};

/**
 * Patch a single page's body so card + card-slider components that use
 * `cardId` reflect the latest library card (or drop it on delete).
 * This is what the public frontend reads from GET /pages/:id|/slug.
 */
const patchPageForCard = (page, cardId, action, freshCard) => {
  if (!page?.body?.data || typeof page.body.data !== "object") {
    return { page, changed: false };
  }

  let changed = false;
  const sourceData = page.body.data;
  const isDataArray = Array.isArray(sourceData);
  const sectionEntries = isDataArray
    ? sourceData.map((section, index) => [String(index), section])
    : Object.entries(sourceData);

  const nextEntries = sectionEntries.map(([sectionKey, section]) => {
    if (!section || typeof section !== "object") {
      return [sectionKey, section];
    }

    const buckets = getComponentBuckets(section);
    if (buckets.length === 0) return [sectionKey, section];

    let nextSection = section;

    for (const bucket of buckets) {
      let bucketChanged = false;
      const nextList = bucket.list.map((comp) => {
        const { comp: nextComp, changed: compChanged } = patchComponent(
          comp,
          cardId,
          action,
          freshCard
        );
        if (compChanged) bucketChanged = true;
        return nextComp;
      });

      if (!bucketChanged) continue;

      changed = true;
      if (bucket.asArray) {
        nextSection = { ...nextSection, [bucket.key]: nextList };
      } else {
        const asObject = {};
        bucket.keys.forEach((key, index) => {
          asObject[key] = nextList[index];
        });
        nextSection = { ...nextSection, [bucket.key]: asObject };
      }
    }

    return [sectionKey, nextSection];
  });

  if (!changed) return { page, changed: false };

  const nextData = isDataArray
    ? nextEntries.map(([, section]) => section)
    : Object.fromEntries(nextEntries);

  return {
    page: {
      ...page,
      body: {
        ...page.body,
        data: nextData,
      },
    },
    changed: true,
  };
};

/**
 * Persist card library changes into every page that embeds that card
 * (standalone Card components + card-type Sliders). Does not require
 * Page Builder to be open — updates the same JSON the frontend API serves.
 */
export const syncCardAcrossPages = async (
  cardId,
  action = "updated",
  freshCard = null
) => {
  if (!cardId) return { updated: 0 };

  let card = freshCard;
  if (action !== "deleted" && !card) {
    const response = await instance.get(`/cards/${cardId}`);
    card = response?.data?.data || response?.data;
    if (!card || typeof card !== "object") return { updated: 0 };
  }

  const pages = await fetchPagesList();
  if (!Array.isArray(pages) || pages.length === 0) return { updated: 0 };

  const idToken = String(cardId);
  // Cheap prefilter: skip pages whose body clearly doesn't mention this card.
  const candidates = pages.filter((page) => {
    if (!page?.body?.data) return true; // may need a full fetch
    try {
      const raw = JSON.stringify(page.body);
      return (
        raw.includes(`"id":${idToken}`) ||
        raw.includes(`"id": ${idToken}`) ||
        raw.includes(`,${idToken},`) ||
        raw.includes(`[${idToken},`) ||
        raw.includes(`,${idToken}]`) ||
        raw.includes(`[${idToken}]`)
      );
    } catch {
      return true;
    }
  });

  const results = await Promise.all(
    candidates.map(async (summary) => {
      const pageRef = summary?.id ?? summary?.slug;
      if (!pageRef) return false;

      // Prefer list payload when it already has body (avoids N× GET /pages/:id).
      let full = summary?.body?.data ? summary : null;
      if (!full) {
        try {
          const response = await instance.get(`/pages/${pageRef}`);
          full = response?.data;
        } catch {
          return false;
        }
      }
      if (!full?.body?.data) return false;

      const { page: patched, changed } = patchPageForCard(
        full,
        cardId,
        action,
        card
      );
      if (!changed || !patched?.id) return false;

      await instance.put(`/pages/${patched.id}`, patched);
      return true;
    })
  );

  return { updated: results.filter(Boolean).length };
};

/**
 * Notify open Page Builder tabs AND persist into closed pages' JSON
 * (so frontend integrations like /services see fresh card data).
 *
 * Sync is kicked off immediately; callers can await for a count or
 * fire-and-forget for a snappy save UI.
 */
export const propagateCardChange = async (
  cardId,
  action = "updated",
  freshCard = null
) => {
  notifyCardChanged(cardId, action);
  try {
    return await syncCardAcrossPages(cardId, action, freshCard);
  } catch (err) {
    console.error("Failed to sync card across pages:", err);
    return { updated: 0, error: err };
  }
};

/** Non-blocking page sync — shows a short toast when pages are updated. */
export const propagateCardChangeInBackground = (
  cardId,
  action = "updated",
  freshCard = null
) => {
  notifyCardChanged(cardId, action);
  Promise.resolve()
    .then(() => syncCardAcrossPages(cardId, action, freshCard))
    .then(({ updated } = {}) => {
      if (updated > 0) {
        message.success(
          `Synced to ${updated} page${updated === 1 ? "" : "s"}.`,
          2
        );
      }
    })
    .catch((err) => {
      console.error("Failed to sync card across pages:", err);
    });
};

export { CARD_SYNC_EVENT, CARD_SYNC_STORAGE_KEY };
