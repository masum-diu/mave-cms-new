// components/formbuilder/ElementsParser.jsx
import React, { useContext, useMemo } from "react";
import { FormBuilderContext } from "../../src/context/FormBuilderContext";
import { message } from "antd";
import instance from "../../axios";
import LocationFetcher from "./LocationFetcher";

const slugify = (value, fallback) =>
  (value || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || fallback;

// Derive a stable, unique react-hook-form field name for each element, since
// elements only carry a display label, not a machine key.
function getFieldNames(elements = []) {
  const used = new Map();
  return elements.map((element, idx) => {
    const base = slugify(element.label, `field_${idx}`);
    const count = used.get(base) || 0;
    used.set(base, count + 1);
    return count === 0 ? base : `${base}_${count}`;
  });
}

function DisplayField({ element, name, register, setValue, onReset }) {
  const requiredRule = element.required
    ? `${element.label || "This field"} is required`
    : false;

  switch (element.element_type) {
    case "input": {
      if (element.input_type === "radio") {
        return (
          <div className="flex flex-wrap gap-4">
            {element.options?.map((opt) => (
              <label key={opt._id} className="flex items-center gap-1">
                <input
                  type="radio"
                  value={opt.value}
                  {...register(name, { required: requiredRule })}
                />
                {opt.title}
              </label>
            ))}
          </div>
        );
      }
      if (element.input_type === "file") {
        return (
          <input type="file" {...register(name, { required: requiredRule })} />
        );
      }
      if (element.input_type === "reset") {
        return (
          <button
            type="button"
            className="border rounded px-4 py-2"
            onClick={onReset}
          >
            {element.placeholder || "Reset"}
          </button>
        );
      }
      if (["submit", "save"].includes(element.input_type)) {
        // The form already renders a single Submit button; avoid duplicates.
        return null;
      }
      return (
        <input
          className="border rounded w-full p-2"
          type={element.input_type || "text"}
          placeholder={element.placeholder}
          {...register(name, { required: requiredRule })}
        />
      );
    }

    case "textarea":
      return (
        <textarea
          className="border rounded w-full p-2"
          rows={3}
          placeholder={element.placeholder}
          {...register(name, { required: requiredRule })}
        />
      );

    case "select":
      return (
        <select
          className="border rounded w-full p-2"
          defaultValue=""
          {...register(name, { required: requiredRule })}
        >
          <option value="" disabled>
            {element.placeholder || "Select an option"}
          </option>
          {element.options?.map((opt) => (
            <option key={opt._id} value={opt.value}>
              {opt.title}
            </option>
          ))}
        </select>
      );

    case "location":
      return (
        <>
          <input type="hidden" {...register(`${name}_division`)} />
          <input type="hidden" {...register(`${name}_district`)} />
          <LocationFetcher
            divisionLabel={element.divisionLabel}
            districtLabel={element.districtLabel}
            onDivisionChange={(value) =>
              setValue(`${name}_division`, value, { shouldValidate: true })
            }
            onDistrictChange={(value) =>
              setValue(`${name}_district`, value, { shouldValidate: true })
            }
          />
        </>
      );

    case "guideline":
      return (
        <div className="p-2 bg-gray-50 border-l-4 border-yellow-400">
          <p className="text-gray-600 whitespace-pre-line">
            {element.content}
          </p>
        </div>
      );

    case "media":
      return element.mediaId ? (
        <p>
          Media selected with ID: <strong>{element.mediaId}</strong>
        </p>
      ) : null;

    default:
      return null;
  }
}

const isFieldElement = (element) =>
  !(
    element.element_type === "guideline" ||
    element.element_type === "media" ||
    (element.element_type === "input" &&
      ["submit", "save", "reset"].includes(element.input_type))
  );

export default function ElementsParser({ form, setDrawerVisible }) {
  const {
    handleSubmit,
    register,
    setValue,
    formState: { errors },
    reset,
  } = useContext(FormBuilderContext);

  const formId = form?.id;
  const fieldNames = useMemo(
    () => getFieldNames(form?.elements || []),
    [form?.elements]
  );

  const handleReset = () => reset();

  const onSubmit = async (values) => {
    const actionUrl = (form?.attributes?.action_url || "").trim();
    if (!actionUrl || /^https?:\/\/(www\.)?example\.com\/?$/i.test(actionUrl)) {
      message.error(
        "This form's Action URL isn't configured yet. Please set it in the form builder before publishing."
      );
      return;
    }

    const hasFiles = Object.values(values).some(
      (val) =>
        typeof FileList !== "undefined" && val instanceof FileList && val.length > 0
    );

    try {
      let response;
      if (hasFiles) {
        const payload = new FormData();
        payload.append("form_id", formId ?? "");
        Object.entries(values).forEach(([key, val]) => {
          if (typeof FileList !== "undefined" && val instanceof FileList) {
            // Files must be top-level fields (their own name) — the backend
            // reads $request->allFiles() keyed by field name, not nested
            // under form_data, and stores them separately in media_list.
            if (val.length === 1) {
              payload.append(key, val[0]);
            } else {
              Array.from(val).forEach((file) => payload.append(`${key}[]`, file));
            }
          } else if (val !== undefined && val !== null && val !== "") {
            payload.append(`form_data[${key}]`, val);
          }
        });
        response = await instance.post(actionUrl, payload, {
          headers: { "Content-Type": undefined },
        });
      } else {
        response = await instance.post(actionUrl, {
          form_id: formId,
          form_data: values,
        });
      }

      if (response.status === 201) {
        message.success("Form submitted successfully");
        reset();
        setDrawerVisible?.(false);
      } else {
        message.error("Error submitting form");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      message.error("An error occurred while submitting the form.");
    }
  };

  return (
    <form
      id={form?.attributes?.component_id}
      className={form?.attributes?.component_class}
      encType={form?.attributes?.enctype}
      onSubmit={handleSubmit(onSubmit)}
    >
      <h3 className="text-xl font-bold mb-2">{form?.title}</h3>
      <div
        className="mb-4 text-gray-700"
        dangerouslySetInnerHTML={{ __html: form?.description }}
      />

      {form?.elements?.map((element, idx) => {
        const name = fieldNames[idx];
        const isField = isFieldElement(element);
        return (
          <div key={element.updated_on} className="mb-4">
            {isField && element.label && (
              <label className="block text-sm font-medium mb-1">
                {element.label}
                {element.required && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </label>
            )}
            <DisplayField
              element={element}
              name={name}
              register={register}
              setValue={setValue}
              onReset={handleReset}
            />
            {isField && errors[name] && (
              <p className="text-red-500 text-sm mt-1">
                {errors[name].message}
              </p>
            )}
          </div>
        );
      })}

      {errors && Object.keys(errors).length > 0 && (
        <div className="text-red-500 text-sm my-2">
          Please fix the validation errors above.
        </div>
      )}

      {/* Single Submit button drives the whole form; builder "submit"/"save" buttons defer to this */}
      <button type="submit" className="bg-theme text-white px-4 py-2 rounded">
        Submit
      </button>
    </form>
  );
}
