// components/RichTextEditor.js

import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import DOMPurify from "dompurify";
import { Spin, Alert } from "antd";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

// Quill's selection is often 1 past the text node (offset 154, length 153).
// That throws in setStart / splitText and takes down the page builder.
function clampDomOffset(node, offset) {
  const n = Number(offset) || 0;
  if (!node) return 0;
  if (node.nodeType === 3) return Math.max(0, Math.min(n, node.length || 0));
  const children = node.childNodes ? node.childNodes.length : 0;
  return Math.max(0, Math.min(n, children));
}

if (typeof window !== "undefined") {
  const textProto = window.Text && window.Text.prototype;
  if (textProto && !textProto.__maveSplitTextPatched) {
    const original = textProto.splitText;
    textProto.splitText = function splitTextClamped(offset) {
      return original.call(this, clampDomOffset(this, offset));
    };
    textProto.__maveSplitTextPatched = true;
  }

  const rangeProto = window.Range && window.Range.prototype;
  if (rangeProto && !rangeProto.__maveRangePatched) {
    const setStart = rangeProto.setStart;
    const setEnd = rangeProto.setEnd;
    rangeProto.setStart = function setStartClamped(node, offset) {
      return setStart.call(this, node, clampDomOffset(node, offset));
    };
    rangeProto.setEnd = function setEndClamped(node, offset) {
      return setEnd.call(this, node, clampDomOffset(node, offset));
    };
    rangeProto.__maveRangePatched = true;
  }
}

function toolbarModules() {
  return {
    toolbar: [
      ["bold", "italic", "underline", "strike"],
      ["blockquote", "code-block"],
      [{ header: 1 }, { header: 2 }],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ script: "sub" }, { script: "super" }],
      [{ indent: "-1" }, { indent: "+1" }],
      [{ direction: "rtl" }],
      [{ size: ["small", false, "large", "huge"] }],
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      [{ color: [] }, { background: [] }],
      [{ font: [] }],
      [{ align: [] }],
      ["link", "image", "video"],
      ["clean"],
    ],
    clipboard: { matchVisual: false },
  };
}

function cleanHtml(html) {
  return DOMPurify.sanitize(html || "")
    .replace(/\uFEFF/g, "")
    .replace(/<span[^>]*class="[^"]*ql-cursor[^"]*"[^>]*>.*?<\/span>/gi, "");
}

// Memoized so a parent setState (word count, the other field) does not
// re-render Quill. A re-render wipes Quill's text nodes and splitText throws.
const QuillEditor = React.memo(function QuillEditor({ seedHtml, onChange, modules }) {
  return (
    <ReactQuill
      defaultValue={seedHtml}
      onChange={onChange}
      modules={modules}
      theme="snow"
      className="bg-white rounded-lg"
    />
  );
});

const RichTextEditor = ({
  defaultValue,
  onChange,
  editMode,
  maxLength = 10000,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [error, setError] = useState(null);
  const onChangeRef = useRef(onChange);

  onChangeRef.current = onChange;

  const modules = useMemo(() => toolbarModules(), []);
  const seedHtml = useMemo(() => cleanHtml(defaultValue), []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    let cancelled = false;
    Promise.all([
      import("react-quill/dist/quill.snow.css"),
      import("react-quill/dist/quill.bubble.css"),
      import("react-quill/dist/quill.core.css"),
    ])
      .then(() => {
        if (!cancelled) setIsLoaded(true);
      })
      .catch((err) => {
        console.error("Failed to load Quill styles:", err);
        if (!cancelled) setError("Failed to load editor styles");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleChange = useCallback((html, _delta, source) => {
    if (source && source !== "user") return;

    const text = String(html || "").replace(/<[^>]*>/g, "");
    const words = text.trim().split(/\s+/).filter(Boolean).length;

    if (text.length > maxLength) {
      setError(`Content exceeds maximum length of ${maxLength} characters`);
      return;
    }

    setError(null);
    setWordCount(words);
    setCharCount(text.length);
    const sanitized = cleanHtml(html);
    // Let Quill finish its selection update before React re-renders the form.
    setTimeout(() => {
      onChangeRef.current?.(sanitized);
    }, 0);
  }, [maxLength]);

  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Spin size="large" />
      </div>
    );
  }

  if (!ReactQuill) {
    return (
      <Alert
        message="Error"
        description="Failed to load editor"
        type="error"
        showIcon
      />
    );
  }

  return (
    <div className="rich-text-editor">
      {editMode ? (
        <div className="space-y-2">
          <QuillEditor seedHtml={seedHtml} onChange={handleChange} modules={modules} />
          <div className="flex justify-between items-center text-sm text-gray-500">
            <span>Words: {wordCount}</span>
            <span>
              Characters: {charCount}/{maxLength}
            </span>
          </div>
          {error && (
            <Alert
              message="Error"
              description={error}
              type="error"
              showIcon
              className="mt-2"
            />
          )}
        </div>
      ) : (
        <div
          className="prose max-w-none"
          dangerouslySetInnerHTML={{
            __html: cleanHtml(defaultValue || seedHtml || ""),
          }}
        />
      )}
    </div>
  );
};

export default RichTextEditor;
