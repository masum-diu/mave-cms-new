// components/PageBuilder/Components/TableComponent.jsx

import React, { useState, useEffect } from "react";
import { Button, Typography, message, Popconfirm, Table } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  CopyFilled,
  DragOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import Papa from "papaparse";
import TableSelectionDrawer from "../Modals/TableSelectionModal/TableSelectionDrawer";

const { Paragraph, Text } = Typography;

const TableComponent = ({
  component,
  updateComponent,
  deleteComponent,
  preview = false,
  onDuplicateElement,
}) => {
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [tableData, setTableData] = useState(component._mave || {});
  const [columns, setColumns] = useState([]);
  const [dataSource, setDataSource] = useState([]);

  useEffect(() => {
    if (tableData) {
      const cols = tableData.headers?.map((header, index) => ({
        title: header,
        dataIndex: `col${index}`,
        key: `col${index}`,
        width: 220,
        ellipsis: { showTitle: false },
        render: (value) => (
          <Text ellipsis={{ tooltip: value }} style={{ maxWidth: 200 }}>
            {value || <span className="text-darkgray">—</span>}
          </Text>
        ),
      }));
      setColumns(cols);
      const rows = tableData.rows?.map((row, rowIndex) => ({
        key: rowIndex,
        ...row.reduce((acc, cell, colIndex) => {
          acc[`col${colIndex}`] = cell;
          return acc;
        }, {}),
      }));
      setDataSource(rows);
    }
  }, [tableData]);

  const handleSelectTable = (selectedTable) => {
    updateComponent({
      ...component,
      _mave: selectedTable,
      id: component._id,
    });
    setTableData(selectedTable);
    setIsDrawerVisible(false);
    message.success("Table updated successfully.");
  };

  const handleDelete = () => {
    deleteComponent();
  };

  const handleExportCSV = () => {
    if (!tableData?.headers?.length || !tableData?.rows?.length) {
      message.info("There is no table data to export yet.");
      return;
    }

    const csv = Papa.unparse({
      fields: tableData.headers,
      data: tableData.rows,
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "table-export.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    message.success("Table exported successfully.");
  };

  if (preview) {
    return (
      <div className="preview-table-component p-4 bg-gray-100 rounded-md">
        {tableData && tableData.headers && tableData.rows ? (
          <div className="mave-preview-table">
            <Table
              columns={columns}
              dataSource={dataSource}
              bordered
              size="middle"
              scroll={{ x: "max-content" }}
              pagination={
                dataSource?.length > 8
                  ? { pageSize: 8, size: "small" }
                  : false
              }
            />
          </div>
        ) : (
          <Paragraph className="text-gray-500">
            No table data available.
          </Paragraph>
        )}
      </div>
    );
  }

  return (
    <div className="border p-4 rounded-md bg-white">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <DragOutlined className="text-2xl border rounded-md p-1" />
          <h3 className="text-xl font-semibold">Table Component</h3>
        </div>
        <div>
          {tableData && (
            <>
              <Button
                icon={<EditOutlined />}
                onClick={() => setIsDrawerVisible(true)}
                className="mavebutton"
              >
                Edit
              </Button>
              <Button
                icon={<DownloadOutlined />}
                onClick={handleExportCSV}
                className="mavebutton"
              >
                Export
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

      {tableData && tableData.headers && tableData.rows ? (
        <div className="mave-preview-table">
          <Table
            columns={columns}
            dataSource={dataSource}
            bordered
            size="middle"
            scroll={{ x: "max-content" }}
            pagination={
              dataSource?.length > 8
                ? { pageSize: 8, size: "small" }
                : false
            }
          />
        </div>
      ) : (
        <Button
          type="dashed"
          icon={<PlusOutlined />}
          onClick={() => setIsDrawerVisible(true)}
          className="mavebutton"
        >
          Add Table
        </Button>
      )}

      <TableSelectionDrawer
        isVisible={isDrawerVisible}
        onClose={() => setIsDrawerVisible(false)}
        onSelectTable={handleSelectTable}
        initialTable={tableData}
      />
    </div>
  );
};

export default TableComponent;
