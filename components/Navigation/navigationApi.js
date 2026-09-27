// components/Navigation/navigationApi.js

import instance from "../../axios";

// The API doesn't always echo created rows back, so fall back to the newest
// row with the same value for `field`.
const pickCreatedId = async (data, listUrl, field, value) => {
  const rows = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [data?.data ?? data];
  const id = rows.map((row) => row?.id).filter(Boolean)[0];
  if (id) return id;
  const response = await instance(listUrl);
  const matches = (response.data || []).filter((row) => row[field] === value);
  return matches.length ? Math.max(...matches.map((row) => row.id)) : null;
};

export const createMenuItem = async (fields) => {
  const response = await instance.post("/menuitems", [fields]);
  return pickCreatedId(response.data, "/menuitems", "title", fields.title);
};

// The API rejects a menu with no items, so a brand-new menu starts with a
// "Home" item the user can edit or replace.
export const createMenu = async (name, itemIds = []) => {
  let ids = itemIds;
  if (!ids.length) {
    const homeId = await createMenuItem({
      title: "Home",
      title_bn: "হোম",
      parent_id: null,
      link: "/",
    });
    if (!homeId) throw new Error("couldn't create the starter Home item");
    ids = [homeId];
  }
  const response = await instance.post("/menus", { name, menu_item_ids: ids });
  return pickCreatedId(response.data, "/menus", "name", name);
};
