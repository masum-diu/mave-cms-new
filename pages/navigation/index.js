// pages/navigation/index.js
// One place to manage a navbar, its menu and the menu's items.

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { Button, Empty, Input, Modal, Select, Typography, message } from "antd";
import { FileImageOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import Image from "next/image";
import instance from "../../axios";
import { setPageTitle } from "../../global/constants/pageTitle";
import Loader from "../../components/Loader";
import NavbarPanel from "../../components/Navigation/NavbarPanel";
import MenuPanel from "../../components/Navigation/MenuPanel";
import MediaSelectionModal from "../../components/PageBuilder/Modals/MediaSelectionModal";
import { apiErrorText, getNavbarMenuId } from "../../components/Navigation/navigationUtils";
import { createMenu } from "../../components/Navigation/navigationApi";

const NEW_MENU = "__new__";

const logoSrc = (logo) =>
  logo?.file_path
    ? `${process.env.NEXT_PUBLIC_MEDIA_URL}/${logo.file_path}`
    : "/images/Image_placeholder.png";

const Navigation = () => {
  const router = useRouter();
  const [navbars, setNavbars] = useState([]);
  const [menus, setMenus] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  // New-navbar modal
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitleEn, setNewTitleEn] = useState("");
  const [newTitleBn, setNewTitleBn] = useState("");
  const [newLogo, setNewLogo] = useState(null);
  const [newMenuId, setNewMenuId] = useState(NEW_MENU);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    setPageTitle("Navigation");
  }, []);

  const reload = useCallback(async () => {
    const [navbarRes, menuRes, itemRes, pageRes] = await Promise.allSettled([
      instance("/navbars"),
      instance("/menus"),
      instance("/menuitems"),
      instance("/pages"),
    ]);
    if (navbarRes.status === "fulfilled") {
      setNavbars([...(navbarRes.value.data || [])].sort((a, b) => a.id - b.id));
    } else message.error("Navbars couldn't be fetched");
    if (menuRes.status === "fulfilled") setMenus(menuRes.value.data || []);
    else message.error("Menus couldn't be fetched");
    if (itemRes.status === "fulfilled") setMenuItems(itemRes.value.data || []);
    else message.error("Menu items couldn't be fetched");
    if (pageRes.status === "fulfilled") setPages(pageRes.value.data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  // Keep the selection in the URL so a refresh lands on the same navbar.
  useEffect(() => {
    if (!router.isReady || loading) return;
    const fromQuery = Number(router.query.navbar);
    if (selectedId && navbars.some((nb) => nb.id === selectedId)) return;
    const next = navbars.find((nb) => nb.id === fromQuery) || navbars[0];
    setSelectedId(next?.id ?? null);
  }, [router.isReady, router.query.navbar, navbars, loading, selectedId]);

  const selectNavbar = (id) => {
    setSelectedId(id);
    router.replace({ pathname: router.pathname, query: { navbar: id } }, undefined, {
      shallow: true,
    });
  };

  const selectedNavbar = navbars.find((nb) => nb.id === selectedId) || null;
  const selectedMenu = useMemo(() => {
    const menuId = getNavbarMenuId(selectedNavbar);
    return menus.find((m) => m.id === menuId) || null;
  }, [selectedNavbar, menus]);

  const filteredNavbars = navbars.filter((nb) =>
    (nb.title_en || "").toLowerCase().includes(search.toLowerCase())
  );

  const assignMenu = async (menuId) => {
    try {
      const response = await instance.put(`/navbars/${selectedNavbar.id}`, {
        title_en: selectedNavbar.title_en,
        title_bn: selectedNavbar.title_bn,
        logo_id: selectedNavbar.logo?.id ?? selectedNavbar.logo_id ?? null,
        menu_id: menuId,
      });
      if (response.status !== 200) throw new Error();
      message.success("Menu attached to navbar");
      await reload();
    } catch (error) {
      message.error(`Couldn't attach the menu: ${apiErrorText(error)}`, 6);
    }
  };

  const resetCreateForm = () => {
    setNewTitleEn("");
    setNewTitleBn("");
    setNewLogo(null);
    setNewMenuId(NEW_MENU);
  };

  const handleCreateNavbar = async () => {
    if (!newTitleEn.trim() || !newLogo) {
      message.error("Please add a title and choose a logo");
      return;
    }
    setCreating(true);
    let step = "menu";
    try {
      const menuId =
        newMenuId === NEW_MENU ? await createMenu(`${newTitleEn.trim()} menu`) : newMenuId;
      if (!menuId) throw new Error("the new menu's id wasn't returned");
      // Reuse this menu if the navbar step fails and the user retries.
      setNewMenuId(menuId);
      step = "navbar";
      const payload = {
        title_en: newTitleEn.trim(),
        title_bn: newTitleBn.trim(),
        logo_id: newLogo.id,
        menu_id: menuId,
      };
      const response = await instance.post("/navbars", payload);
      if (response.status !== 201 && response.status !== 200) {
        throw new Error(`HTTP ${response.status}`);
      }
      message.success("Navbar created. Now add its menu items.");
      const createdId = (response.data?.data ?? response.data)?.id;
      setCreateOpen(false);
      resetCreateForm();
      await reload();
      if (createdId) selectNavbar(createdId);
    } catch (error) {
      console.error(`Create ${step} failed`, error?.response?.data ?? error);
      message.error(
        `Couldn't create the ${step}: ${apiErrorText(error)}`,
        6
      );
      // A menu may already exist even though the navbar failed.
      if (step === "navbar") reload();
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader />
      </div>
    );
  }

  return (
    <div className="mavecontainer bg-gray-50 rounded-xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold m-0">Navigation</h1>
          <p className="text-gray-500 m-0">
            Pick a navbar, then edit its logo, menu and menu items in one place.
          </p>
        </div>
        <Button className="mavebutton" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
          New navbar
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Navbar list */}
        <aside className="lg:w-72 shrink-0">
          <Input
            prefix={<SearchOutlined />}
            placeholder="Search navbars"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
            className="mb-3"
          />
          <div className="flex flex-col gap-2">
            {filteredNavbars.length === 0 && <Empty description="No navbars" />}
            {filteredNavbars.map((nb) => {
              const menu = menus.find((m) => m.id === getNavbarMenuId(nb));
              const active = nb.id === selectedId;
              return (
                <button
                  key={nb.id}
                  type="button"
                  onClick={() => selectNavbar(nb.id)}
                  className={`flex items-center gap-3 p-3 rounded-lg border text-left transition ${
                    active
                      ? "bg-amber-50 border-amber-400"
                      : "bg-white border-gray-200 hover:border-amber-300"
                  }`}
                >
                  <Image
                    src={logoSrc(nb.logo)}
                    alt=""
                    width={36}
                    height={36}
                    className="w-9 h-9 object-contain rounded bg-gray-50"
                  />
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{nb.title_en}</div>
                    <div className={`text-xs truncate ${menu ? "text-gray-400" : "text-red-400"}`}>
                      {menu
                        ? `${menu.name} · ${menu.menu_items?.length || 0} items`
                        : "No menu assigned"}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Editor */}
        <section className="flex-1 min-w-0 flex flex-col gap-6">
          {selectedNavbar ? (
            <>
              <NavbarPanel
                navbar={selectedNavbar}
                onSaved={reload}
                onDeleted={async () => {
                  setSelectedId(null);
                  await reload();
                }}
              />
              <MenuPanel
                key={`${selectedNavbar.id}-${selectedMenu?.id ?? "none"}`}
                navbar={selectedNavbar}
                menu={selectedMenu}
                menus={menus}
                navbars={navbars}
                allMenuItems={menuItems}
                pages={pages}
                onAssignMenu={assignMenu}
                reload={reload}
              />
            </>
          ) : (
            <div className="bg-white rounded-xl border p-10">
              <Empty description="Create your first navbar to get started" />
            </div>
          )}
        </section>
      </div>

      <Modal
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={handleCreateNavbar}
        confirmLoading={creating}
        okText="Create navbar"
        okButtonProps={{ className: "mavebutton" }}
        title="New navbar"
        width={640}
      >
        <div className="flex flex-col gap-4 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Typography.Text strong>Title</Typography.Text>
              <Input
                className="mt-1"
                placeholder="e.g. Main navbar"
                value={newTitleEn}
                onChange={(e) => setNewTitleEn(e.target.value)}
              />
            </div>
            <div>
              <Typography.Text strong>Title (alternate)</Typography.Text>
              <Input
                className="mt-1"
                value={newTitleBn}
                onChange={(e) => setNewTitleBn(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            {newLogo && (
              <Image
                src={logoSrc(newLogo)}
                alt=""
                width={56}
                height={56}
                className="w-14 h-14 object-contain rounded border"
              />
            )}
            <Button icon={<FileImageOutlined />} onClick={() => setMediaOpen(true)}>
              {newLogo ? "Change logo" : "Choose logo"}
            </Button>
          </div>
          <div>
            <Typography.Text strong>Menu</Typography.Text>
            <Select
              className="w-full mt-1"
              value={newMenuId}
              onChange={setNewMenuId}
              showSearch
              optionFilterProp="children"
            >
              <Select.Option value={NEW_MENU}>+ Create a new menu (starts with a "Home" item)</Select.Option>
              {menus.map((m) => (
                <Select.Option key={m.id} value={m.id}>
                  {m.name}
                </Select.Option>
              ))}
            </Select>
          </div>
        </div>
      </Modal>

      <MediaSelectionModal
        isVisible={mediaOpen}
        onClose={() => setMediaOpen(false)}
        selectionMode="single"
        onSelectMedia={(selected) => {
          if (selected) setNewLogo(selected);
          setMediaOpen(false);
        }}
      />
    </div>
  );
};

export default Navigation;
