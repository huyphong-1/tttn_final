const normalizeCategory = (value) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

const buildVariants = (raw) => {
  const lower = normalizeCategory(raw);
  if (!lower) return [];

  const singularLower = lower.endsWith("s") ? lower.slice(0, -1) : lower;
  const pluralLower = lower.endsWith("s") ? lower : `${lower}s`;

  return Array.from(new Set([lower, singularLower, pluralLower])).filter(Boolean);
};

export const expandCategoryValues = (values = []) => {
  const result = new Set();
  values.forEach((value) => {
    buildVariants(value).forEach((variant) => result.add(variant));
  });
  return Array.from(result);
};
