// components/Navigation/navigationUtils.js

export const generateSlug = (text = "") =>
  text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "");

// Slugs of every ancestor of parentId, root first.
export const buildParentSlugs = (parentId, allItems) => {
  const slugs = [];
  const seen = new Set();
  let currentId = parentId;
  while (currentId && !seen.has(currentId)) {
    seen.add(currentId);
    const parent = allItems.find((item) => item.id === Number(currentId));
    if (!parent) break;
    slugs.unshift(generateSlug(parent.title));
    currentId = parent.parent_id;
  }
  return slugs;
};

// Same link format the Menu Items page produces:
//   page link        -> /parent/child?pageId=1&pageName=home
//   independent link -> whatever was typed, or an auto path if left empty
export const buildMenuItemLink = ({
  title,
  parentId,
  linkType,
  page,
  customLink,
  allItems,
}) => {
  const path = `/${[...buildParentSlugs(parentId, allItems), generateSlug(title)].join("/")}`;
  if (linkType === "page") {
    if (!page) return path;
    return `${path}?pageId=${page.id}&pageName=${generateSlug(page.page_name_en || "")}`;
  }
  return customLink?.trim() ? customLink.trim() : path;
};

// Reads ?pageId= back out of a stored link so the edit form can preselect it.
export const getPageIdFromLink = (link = "") => {
  const match = /[?&]pageId=(\d+)/.exec(link || "");
  return match ? Number(match[1]) : null;
};

// Best human-readable reason from an axios error (Laravel style responses).
export const apiErrorText = (error) => {
  const data = error?.response?.data;
  const firstValidation = data?.errors && Object.values(data.errors).flat()[0];
  return (
    firstValidation ||
    data?.message ||
    data?.error ||
    (error?.response ? `HTTP ${error.response.status}` : error?.message) ||
    "Unknown error"
  );
};

export const getNavbarMenuId = (navbar) =>
  navbar?.menu_id ?? navbar?.menu?.id ?? null;

// Items belonging to a menu, preferring the fresher /menuitems copy.
export const getMenuItems = (menu, allItems) => {
  if (!menu) return [];
  return (menu.menu_items || []).map(
    (item) => allItems.find((full) => full.id === item.id) || item
  );
};

// Nest a flat item list by parent_id. Items whose parent is not in the
// list are treated as roots so nothing disappears.
export const buildTree = (items) => {
  const ids = new Set(items.map((item) => item.id));
  const byParent = new Map();
  items.forEach((item) => {
    const key = item.parent_id && ids.has(item.parent_id) ? item.parent_id : "root";
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key).push(item);
  });
  const attach = (key, trail) =>
    (byParent.get(key) || [])
      .sort((a, b) => a.id - b.id)
      .filter((item) => !trail.has(item.id))
      .map((item) => ({
        ...item,
        children: attach(item.id, new Set([...trail, item.id])),
      }));
  return attach("root", new Set());
};

export const collectDescendantIds = (itemId, items) => {
  const result = [];
  const walk = (id) => {
    items
      .filter((item) => item.parent_id === id)
      .forEach((child) => {
        if (!result.includes(child.id)) {
          result.push(child.id);
          walk(child.id);
        }
      });
  };
  walk(itemId);
  return result;
};
