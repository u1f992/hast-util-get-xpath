import type { Element } from "hast";

export function attributeToString(
  element: Element,
  qualifiedName: string,
): string | null {
  const { properties } = element;
  if (
    typeof properties === "undefined" || // FIXME: remove this assertion for hast@3
    !(qualifiedName in properties)
  ) {
    return null;
  }

  const propertyValue = properties[qualifiedName];
  if (
    typeof propertyValue === "undefined" ||
    propertyValue === null ||
    propertyValue === false
  ) {
    return null;
  }
  if (propertyValue === true) {
    return "";
  }
  if (Array.isArray(propertyValue)) {
    return propertyValue.map(String).join(" ");
  }
  return String(propertyValue);
}
