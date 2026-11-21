import { defaultImage, resolveMediaUrl } from "../util";

// Uploaded photo if the admin set one, otherwise a matching default. Never broken/empty.
export default function FoodImg({ item, className = "", alt }) {
  const fallback = defaultImage(item);
  return (
    <img
      className={className}
      src={resolveMediaUrl(item?.image) || fallback}
      alt={alt || item?.name || "Food"}
      loading="lazy"
      onError={(e) => {
        if (!e.currentTarget.src.endsWith(fallback)) e.currentTarget.src = fallback;
      }}
    />
  );
}
