// TableSelectionModal/PreviewTable.jsx

import React, { useMemo, useState } from "react";
import { Table, Input, Button, Space, Typography, Tag, Empty } from "antd";
import { SearchOutlined, EyeOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

const PreviewTable = ({ headers, visibleColumns, rows, filterColumns }) => {
  // For the text filter in antd
  const [searchText, setSearchText] = useState("");
  const [searchedColIndex, setSearchedColIndex] = useState(null);

  const handleSearch = (selectedKeys, confirm, colIndex) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColIndex(colIndex);
  };

  const handleReset = (clearFilters) => {
    clearFilters();
    setSearchText("");
    setSearchedColIndex(null);
  };

  const visibleCount = visibleColumns?.filter(Boolean).length || 0;
  const hiddenCount = (headers?.length || 0) - visibleCount;

  // Build columns for <Table>
  const columns = useMemo(() => {
    return headers
      .map((colObj, colIndex) => {
        // Hide if not visible
        if (!visibleColumns[colIndex]) return null;

        // Base column config
        const colDef = {
          title: colObj.name,
          dataIndex: String(colIndex), // We'll map row arrays to an object
          key: colObj.id, // stable key
          width: 220,
          ellipsis: { showTitle: false },
          render: (value) => (
            <Text ellipsis={{ tooltip: value }} style={{ maxWidth: 200 }}>
              {value || <span className="text-darkgray">—</span>}
            </Text>
          ),
        };

        // If this header is in filterColumns, we add the text filter dropdown
        if (filterColumns.includes(colObj.name)) {
          colDef.filterDropdown = ({
            setSelectedKeys,
            selectedKeys,
            confirm,
            clearFilters,
          }) => (
            <div style={{ padding: 8 }}>
              <Input
                placeholder={`Search ${colObj.name}`}
                value={selectedKeys[0]}
                onChange={(e) =>
                  setSelectedKeys(e.target.value ? [e.target.value] : [])
                }
                onPressEnter={() =>
                  handleSearch(selectedKeys, confirm, colIndex)
                }
                style={{ marginBottom: 8, display: "block" }}
              />
              <Space>
                <Button
                  icon={<SearchOutlined />}
                  size="small"
                  style={{ width: 90 }}
                  className="mavebutton"
                  onClick={() => handleSearch(selectedKeys, confirm, colIndex)}
                >
                  Search
                </Button>
                <Button
                  onClick={() => {
                    handleReset(clearFilters);
                    confirm({ closeDropdown: true });
                  }}
                  size="small"
                  style={{ width: 90 }}
                >
                  Reset
                </Button>
              </Space>
            </div>
          );

          colDef.filterIcon = (filtered) => (
            <SearchOutlined
              style={{ color: filtered ? "var(--theme)" : undefined }}
            />
          );

          colDef.onFilter = (value, record) => {
            const cellVal = (record[String(colIndex)] || "").toLowerCase();
            return cellVal.includes(value.toLowerCase());
          };

          if (searchedColIndex === colIndex && searchText) {
            colDef.filteredValue = [searchText];
          } else {
            colDef.filteredValue = null;
          }
        }

        return colDef;
      })
      .filter(Boolean); // remove hidden columns
  }, [headers, visibleColumns, filterColumns, searchedColIndex, searchText]);

  // Convert row arrays to object for antd
  const dataSource = useMemo(() => {
    return rows.map((row, rowIndex) => {
      const rowObj = { key: `row-${rowIndex}` };
      row.forEach((cellVal, colIndex) => {
        rowObj[String(colIndex)] = cellVal;
      });
      return rowObj;
    });
  }, [rows]);

  return (
    <div className="mave-preview-table">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
        <div>
          <Title level={4} className="!mb-0">
            <EyeOutlined className="mr-2" />
            Live Preview
          </Title>
          <Text type="secondary" className="text-xs">
            This is how the table will look on the page
          </Text>
        </div>
        <div className="flex items-center gap-2">
          <Tag className="mave-stat-chip">{visibleCount} Visible</Tag>
          {hiddenCount > 0 && (
            <Tag className="mave-stat-chip">{hiddenCount} Hidden</Tag>
          )}
          <Tag className="mave-stat-chip">{rows?.length || 0} Rows</Tag>
        </div>
      </div>

      {columns.length === 0 ? (
        <Empty description="All columns are hidden. Make at least one column visible to preview the table." />
      ) : (
        <Table
          columns={columns}
          dataSource={dataSource}
          bordered
          size="middle"
          scroll={{ x: "max-content" }}
          pagination={
            dataSource.length > 8
              ? { pageSize: 8, size: "small" }
              : false
          }
        />
      )}
    </div>
  );
};

export default PreviewTable;
