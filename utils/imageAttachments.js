const MB = 1024 * 1024;

export const MAX_IMAGE_ATTACHMENTS = 12;
export const MAX_IMAGE_BYTES = 5 * MB;
export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
];
export const ALLOWED_IMAGE_EXTENSIONS = ["jpeg", "jpg", "png", "gif"];

const getExtension = (value) => {
  const str = String(value || "").toLowerCase();
  if (!str.includes(".")) return "";
  return str.split(".").pop().split("?")[0].trim();
};

export const getImageAssetExtension = (asset) =>
  getExtension(asset?.fileName || asset?.uri);

export const isAllowedImageAsset = (asset) => {
  const mimeType = String(asset?.mimeType || "").toLowerCase();
  const ext = getImageAssetExtension(asset);
  const validMimeType = mimeType && ALLOWED_IMAGE_MIME_TYPES.includes(mimeType);
  const validExtension = ext && ALLOWED_IMAGE_EXTENSIONS.includes(ext);
  return Boolean(validMimeType || validExtension);
};

export const validateImageAsset = (asset) => {
  if (!asset?.uri) {
    return { valid: false, message: "Invalid image file selected." };
  }
  if (!isAllowedImageAsset(asset)) {
    return { valid: false, message: "Only JPG, JPEG, PNG, or GIF files are allowed." };
  }
  const fileSize = Number(asset?.fileSize || 0);
  if (fileSize > MAX_IMAGE_BYTES) {
    return { valid: false, message: "Each image must be 5MB or smaller." };
  }
  return { valid: true, message: "" };
};

export const normalizeImageUrls = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item || "").trim()).filter(Boolean);
      }
    } catch (_error) {
      // Keep fallback behavior below for comma-separated values.
    }
    return trimmed.split(",").map((item) => item.trim()).filter(Boolean);
  }

  return [];
};

export const buildImageFormDataParts = (assets = []) =>
  assets.slice(0, MAX_IMAGE_ATTACHMENTS).map((asset, index) => {
    const extension = getImageAssetExtension(asset) || "jpg";
    const mimeType = String(asset?.mimeType || "").toLowerCase();
    const type = ALLOWED_IMAGE_MIME_TYPES.includes(mimeType) ? mimeType : `image/${extension === "jpg" ? "jpeg" : extension}`;

    return {
      // Laravel-style array upload compatibility.
      field: "images[]",
      file: {
        uri: asset.uri,
        name: asset.fileName || `attachment-${Date.now()}-${index}.${extension}`,
        type,
      },
    };
  });

export const buildImageFormDataPartsForMode = (assets = [], mode = "brackets") => {
  const baseParts = buildImageFormDataParts(assets);
  if (mode === "indexed") {
    return baseParts.map((part, index) => ({ ...part, field: `images[${index}]` }));
  }
  if (mode === "single") {
    return baseParts.map((part, index) => ({ ...part, field: index === 0 ? "image" : "images[]" }));
  }
  return baseParts.map((part) => ({ ...part, field: "images[]" }));
};

export const appendImageAssetsToFormData = (formData, assets = [], mode = "brackets") => {
  const parts = buildImageFormDataPartsForMode(assets, mode);
  parts.forEach((part) => {
    formData.append(part.field, part.file);
  });
  return formData;
};
