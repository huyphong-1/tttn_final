const toTitleCase = (value = "") =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : "";

const buildVariants = (raw) => {
  if (typeof raw !== "string") return [];
  const trimmed = raw.trim();
  if (!trimmed) return [];

  const lower = trimmed.toLowerCase();
  const singularLower = lower.endsWith("s") ? lower.slice(0, -1) : lower;
  const pluralLower = lower.endsWith("s") ? lower : `${lower}s`;

  const variants = new Set([
    trimmed,
    lower,
    trimmed.toLowerCase(),
    trimmed.toUpperCase(),
    toTitleCase(lower),
    lower.toUpperCase(),
    singularLower,
    toTitleCase(singularLower),
    singularLower.toUpperCase(),
    pluralLower,
    toTitleCase(pluralLower),
    pluralLower.toUpperCase(),
  ]);

  return Array.from(variants).filter(Boolean);
};

export const expandCategoryValues = (values = []) => {
  const result = new Set();
  values.forEach((value) => {
    buildVariants(value).forEach((variant) => result.add(variant));
  });
  return Array.from(result);
};
