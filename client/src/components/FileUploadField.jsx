import { useId } from "react";

export default function FileUploadField({
  label,
  accept,
  multiple = false,
  files,
  buttonLabel,
  placeholder,
  onChange,
  disabled = false,
}) {
  const inputId = useId();
  const selectedFiles = Array.isArray(files) ? files : files ? [files] : [];

  let statusText = placeholder;

  if (selectedFiles.length === 1) {
    statusText = selectedFiles[0].name;
  } else if (selectedFiles.length > 1) {
    statusText = `${selectedFiles.length} fajlova izabrano`;
  }

  return (
    <div className="field file-upload-field">
      <span>{label}</span>

      <label className="file-upload-shell" htmlFor={inputId}>
        <input
          id={inputId}
          className="file-upload-input"
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={onChange}
          disabled={disabled}
        />
        <span className="file-upload-button">{buttonLabel}</span>
        <span
          className={
            selectedFiles.length > 0
              ? "file-upload-status has-selection"
              : "file-upload-status"
          }
        >
          {statusText}
        </span>
      </label>
    </div>
  );
}
