import type { ElementContent, Root } from "hast";
import { attributeToString } from "./attribute-to-string.js";

export interface Options {
  ignoreId: boolean;
}

const defaultOptions: Options = {
  ignoreId: false,
};

export function getXPath(
  doc: Readonly<Root>,
  el: Readonly<Root> | Readonly<ElementContent>,
  customOptions?: Partial<Options>,
): string | null {
  const options = { ...defaultOptions, ...customOptions };

  if (((_): _ is Readonly<Root> => doc === _)(el)) {
    return "/";
  }

  const path = findPath(doc, el);
  if (path.length === 0) {
    return null;
  }

  if (
    !options.ignoreId &&
    el.type === "element" &&
    "properties" in el && // FIXME: remove confirmation of existence of properties for hast@3
    "id" in el.properties!
  ) {
    const id = attributeToString(el, "id");
    if (id !== null && id !== "") {
      return `//*[@id="${id}"]`;
    }
  }

  const parts: string[] = [];
  let parent: Readonly<Root> | Readonly<ElementContent> = doc;
  for (const node of path) {
    if (node.type === "text") {
      const textIndex = getTextNodeIndex(parent, node);
      parts.push(`text()[${textIndex}]`);
    } else if (node.type === "element") {
      const elementIndex = getElementIndex(parent, node);
      const hasMultipleSameTagSiblings =
        elementIndex > 1 || hasNextSameSibling(parent, node);
      const indexSuffix = hasMultipleSameTagSiblings ? `[${elementIndex}]` : "";
      parts.push(`${node.tagName}${indexSuffix}`);
    }
    parent = node;
  }

  return parts.length ? "/" + parts.join("/") : "";
}

function findPath(
  doc: Readonly<Root>,
  target: Readonly<ElementContent>,
): Readonly<ElementContent>[] {
  const path: Readonly<ElementContent>[] = [];

  function traverse(
    node: Readonly<Root> | Readonly<ElementContent>,
    currentPath: Readonly<ElementContent>[],
  ): boolean {
    if (node === target) {
      path.push(...currentPath, node);
      return true;
    }

    if (node.type === "root" || node.type === "element") {
      for (const child of node.children) {
        if (child.type === "doctype") {
          continue;
        }
        if (
          traverse(child, [
            ...currentPath,
            ...(node.type === "root" ? [] : [node]),
          ])
        ) {
          return true;
        }
      }
    }

    return false;
  }

  traverse(doc, []);
  return path;
}

function getElementIndex(
  parent: Readonly<Root> | Readonly<ElementContent>,
  target: Readonly<ElementContent>,
): number {
  if (parent.type !== "root" && parent.type !== "element") {
    return 1;
  }

  let index = 1;
  for (const child of parent.children) {
    if (child === target) {
      return index;
    }
    if (
      child.type === "element" &&
      target.type === "element" &&
      child.tagName === target.tagName
    ) {
      index++;
    }
  }
  return 1;
}

function getTextNodeIndex(
  parent: Readonly<Root> | Readonly<ElementContent>,
  target: Readonly<ElementContent>,
): number {
  if (parent.type !== "root" && parent.type !== "element") {
    return 1;
  }

  let index = 1;
  for (const child of parent.children) {
    if (child === target) {
      return index;
    }
    if (child.type === "text") {
      index++;
    }
  }
  return 1;
}

function hasNextSameSibling(
  parent: Readonly<Root> | Readonly<ElementContent>,
  target: Readonly<ElementContent>,
): boolean {
  if (parent.type !== "root" && parent.type !== "element") {
    return false;
  }

  let foundTarget = false;
  for (const child of parent.children) {
    if (
      foundTarget &&
      child.type === "element" &&
      target.type === "element" &&
      child.tagName === target.tagName
    ) {
      return true;
    }
    if (child === target) {
      foundTarget = true;
    }
  }
  return false;
}
