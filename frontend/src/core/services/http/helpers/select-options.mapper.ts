export function mapSelectOptions<
  T extends Record<string, any>,
  V extends keyof T,
  L extends keyof T,
>(items: T[], valueKey: V, labelKey: L) {
  return items.map((item) => ({
    value: item[valueKey] as string | number,
    label: String(item[labelKey]),
  }));
}
