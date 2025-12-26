export const BRAND_OPTIONS = [
  "Apple",
  "Samsung",
  "Xiaomi",
  "OPPO",
  "Lenovo",
  "Huawei",
  "Microsoft",
  "ASUS",
  "Sony",
  "Vivo",
  "Realme",
  "Nokia",
  "Khac",
];

export const SORT_OPTIONS = [
  { value: "newest", label: "Moi nhat", orderBy: "created_at", ascending: false },
  { value: "price_asc", label: "Gia tang dan", orderBy: "price", ascending: true },
  { value: "price_desc", label: "Gia giam dan", orderBy: "price", ascending: false },
  { value: "name_asc", label: "Ten A -> Z", orderBy: "name", ascending: true },
];

export const getSortConfig = (sortOptions, sortValue) => {
  if (!Array.isArray(sortOptions) || sortOptions.length === 0) {
    return { value: "newest", label: "Moi nhat", orderBy: "created_at", ascending: false };
  }
  return sortOptions.find((opt) => opt.value === sortValue) || sortOptions[0];
};
