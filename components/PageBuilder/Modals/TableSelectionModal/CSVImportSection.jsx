import React, { useRef, useState } from "react";
import { Button, Popconfirm, Typography, message } from "antd";
import Papa from "papaparse";
import { v4 as uuidv4 } from "uuid";
import { UploadOutlined, FileTextOutlined } from "@ant-design/icons";

const { Text } = Typography;

// Treat the table as "empty" only if no header has a real name and no cell
// has a value — that's when we can safely import without asking first.
const hasExistingData = (headers, rows) => {
  const hasNamedHeader = headers?.some((h) => h?.name?.trim());
  const hasFilledCell = rows?.some((row) =>
    row?.some((cell) => `${cell ?? ""}`.trim())
  );
  return Boolean(hasNamedHeader || hasFilledCell);
};

const CSVImportSection = ({ headers, rows, setHeaders, setRows }) => {
  const fileInputRef = useRef(null);
  const [lastImport, setLastImport] = useState(null);

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later

    if (!file) return;

    Papa.parse(file, {
      skipEmptyLines: true,
      complete: (result) => {
        const { data } = result;
        if (data && data.length > 0) {
          // First row = CSV column names
          const csvHeaderStrings = data[0].map((h) => h.trim());
          const csvHeaders = csvHeaderStrings.map((colName) => ({
            id: uuidv4(),
            name: colName,
          }));

          // Remaining rows = actual data
          const csvRows = data.slice(1);

          setHeaders(csvHeaders);
          setRows(csvRows);
          setLastImport({
            name: file.name,
            columns: csvHeaders.length,
            rows: csvRows.length,
          });

          message.success(
            `Imported "${file.name}" — ${csvHeaders.length} columns, ${csvRows.length} rows.`
          );
        } else {
          message.error("CSV file is empty or invalid.");
        }
      },
      error: () => {
        message.error("Failed to parse CSV file.");
      },
    });
  };

  const importButton = (
    <Button icon={<UploadOutlined />} className="mavebutton">
      Import CSV
    </Button>
  );

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      {hasExistingData(headers, rows) ? (
        <Popconfirm
          title="Replace current table data?"
          description="Importing a CSV will overwrite the existing columns and rows."
          okText="Yes, import"
          cancelText="Cancel"
          onConfirm={openFileDialog}
        >
          {importButton}
        </Popconfirm>
      ) : (
        <span onClick={openFileDialog}>{importButton}</span>
      )}

      {lastImport && (
        <Text type="secondary" className="text-xs flex items-center gap-1">
          <FileTextOutlined /> {lastImport.name} · {lastImport.columns} cols ×{" "}
          {lastImport.rows} rows
        </Text>
      )}
    </div>
  );
};

export default CSVImportSection;
