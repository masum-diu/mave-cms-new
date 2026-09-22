import React, { useRef, useEffect, useState } from "react";
import { Form, Input, Button, Typography, Popconfirm, message } from "antd";
import { PlusOutlined, MinusOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;
const { TextArea } = Input;

const CELL_WIDTH = 220;
const NUM_COL_WIDTH = 44;
const ACTION_COL_WIDTH = 44;

const RowsSection = ({ headers, rows, setRows }) => {
  // We'll store references to each cell in a 2D array (row x col)
  // so we can programmatically move focus with arrow keys, tab, etc.
  const cellRefs = useRef([]);

  // Only the focused cell renders as a multi-line, auto-growing textarea.
  // Every other cell stays a single, truncated line so 30+ rows stay scannable.
  const [focusedCell, setFocusedCell] = useState(null);

  // Ensure cellRefs always matches the shape of the rows array
  useEffect(() => {
    cellRefs.current = rows.map((r, rowIndex) =>
      headers.map(
        (_, colIndex) =>
          cellRefs.current?.[rowIndex]?.[colIndex] || React.createRef()
      )
    );
  }, [rows, headers]);

  const addRow = () => {
    if (headers.length === 0) {
      message.info("No headers defined. Please add columns first.");
      return;
    }
    // create a new row with empty cells matching # of headers
    const newRow = Array(headers.length).fill("");
    setRows((prev) => [...prev, newRow]);

    // Focus on the first cell of the newly added row (as an example)
    setTimeout(() => {
      const newRowIndex = rows.length; // because it was just pushed
      cellRefs.current?.[newRowIndex]?.[0]?.current?.focus();
    }, 0);
  };

  const removeRow = (index) => {
    if (rows.length === 1) return;
    const updated = rows.filter((_, i) => i !== index);
    setRows(updated);
  };

  const updateCell = (value, rowIndex, colIndex) => {
    const updated = rows.map((row, index) =>
      index === rowIndex
        ? [...row.slice(0, colIndex), value, ...row.slice(colIndex + 1)]
        : [...row]
    );
    setRows(updated);
  };

  // Handle keyboard navigation within the cell.
  // Cells are multi-line text areas now, so arrow keys are left alone to move
  // the text cursor; Enter moves to the next row and Shift+Enter inserts a
  // line break, matching common spreadsheet behavior.
  const handleKeyDown = (e, rowIndex, colIndex) => {
    const { key, shiftKey } = e;

    const focusCell = (r, c) => {
      if (r >= 0 && r < rows.length && c >= 0 && c < headers.length) {
        cellRefs.current?.[r]?.[c]?.current?.focus();
      }
    };

    if (key === "Enter" && !shiftKey) {
      e.preventDefault();
      focusCell(rowIndex + 1, colIndex);
    }
  };

  const gridTemplateColumns = `${NUM_COL_WIDTH}px repeat(${headers.length}, ${CELL_WIDTH}px) ${ACTION_COL_WIDTH}px`;

  return (
    <div className="mt-10">
      <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
        <Title level={4} className="!mb-0">
          Rows
        </Title>
        <Text type="secondary" className="text-xs">
          Click a cell to expand it and see the full text while editing
        </Text>
      </div>

      <div
        className="border border-bggray rounded-md"
        style={{ maxHeight: "50vh", overflow: "auto" }}
      >
        <div style={{ width: "max-content", minWidth: "100%" }}>
          {/* Sticky column header */}
          <div
            className="grid bg-themelite font-semibold text-xs text-black border-b border-theme"
            style={{
              gridTemplateColumns,
              position: "sticky",
              top: 0,
              zIndex: 20,
            }}
          >
            <div className="px-2 py-2 bg-themelite border-r border-theme sticky left-0 z-20" />
            {headers.map((h) => (
              <div
                key={h.id}
                className="px-3 py-2 border-r border-theme truncate"
                title={h.name}
              >
                {h.name}
              </div>
            ))}
            <div className="bg-themelite sticky right-0 z-20" />
          </div>

          {/* Data rows */}
          {rows?.map((row, rowIndex) => (
            <div
              key={rowIndex}
              className="grid group border-b border-bggray last:border-b-0 hover:bg-themelite"
              style={{ gridTemplateColumns }}
            >
              <div
                className="px-2 py-2 text-xs text-darkgray bg-white group-hover:bg-themelite sticky left-0 z-10 border-r border-bggray flex items-start"
              >
                {rowIndex + 1}
              </div>

              {headers.map((colObj, colIndex) => {
                const isFocused =
                  focusedCell?.row === rowIndex && focusedCell?.col === colIndex;

                return (
                  <Form.Item key={`${rowIndex}_${colIndex}`} className="!mb-0">
                    <TextArea
                      value={row[colIndex]}
                      onChange={(e) =>
                        updateCell(e.target.value, rowIndex, colIndex)
                      }
                      onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                      onFocus={() =>
                        setFocusedCell({ row: rowIndex, col: colIndex })
                      }
                      onBlur={() =>
                        setFocusedCell((prev) =>
                          prev?.row === rowIndex && prev?.col === colIndex
                            ? null
                            : prev
                        )
                      }
                      ref={cellRefs.current?.[rowIndex]?.[colIndex]}
                      autoSize={isFocused ? { minRows: 1, maxRows: 10 } : false}
                      rows={1}
                      style={{
                        borderRadius: 0,
                        border: "none",
                        resize: "none",
                        whiteSpace: isFocused ? "pre-wrap" : "nowrap",
                        overflow: isFocused ? "auto" : "hidden",
                        textOverflow: "ellipsis",
                        position: "relative",
                        zIndex: isFocused ? 4 : 1,
                        background: isFocused ? "var(--white)" : "transparent",
                        boxShadow: isFocused
                          ? "inset 0 0 0 2px var(--theme)"
                          : "none",
                      }}
                    />
                  </Form.Item>
                );
              })}

              <div className="flex items-start justify-center pt-1 bg-white group-hover:bg-themelite sticky right-0 z-10 border-l border-bggray">
                {rows.length > 1 && (
                  <Popconfirm
                    title="Delete this row?"
                    onConfirm={() => removeRow(rowIndex)}
                    okText="Yes"
                    cancelText="No"
                    okButtonProps={{ danger: true }}
                  >
                    <Button
                      icon={<MinusOutlined />}
                      type="text"
                      danger
                      size="small"
                    />
                  </Popconfirm>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center mt-3">
        <Button onClick={addRow} icon={<PlusOutlined />} className="mavebutton">
          Add Row
        </Button>
      </div>
    </div>
  );
};

export default RowsSection;
