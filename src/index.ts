import type * as hast from "hast";
import { getAttribute } from "hast-util-get-attribute";

export type Options = {
  ignoreId: boolean;
};

const defaultOptions: Options = {
  ignoreId: false,
};

export type XPathSelectableContent = hast.Element | hast.Comment | hast.Text;
export function isXPathSelectable(
  content: hast.Content,
): content is XPathSelectableContent {
  return (
    content.type === "element" ||
    content.type === "text" ||
    content.type === "comment"
  );
}

export function getXPath(
  doc: Readonly<hast.Root>,
  el: Readonly<hast.Root> | Readonly<XPathSelectableContent>,
  customOptions?: Partial<Options>,
): string | null {
  const options = { ...defaultOptions, ...customOptions };

  if (((_): _ is Readonly<hast.Root> => doc === _)(el)) {
    return "/";
  }

  const path = findParents(doc, el);
  if (path.length === 0) {
    return null;
  }

  if (
    !options.ignoreId &&
    el.type === "element" &&
    "properties" in el && // FIXME: remove confirmation of existence of properties for hast@3
    "id" in el.properties!
  ) {
    const id = getAttribute(el, "id");
    if (id !== null && id !== "") {
      return `//*[@id="${id}"]`;
    }
  }

  const parts: string[] = [];
  let parent: Readonly<hast.Parent> | Readonly<XPathSelectableContent> = doc;
  for (const node of path) {
    if (!("children" in node)) {
      const index = getIndexOf(parent, node, (a, b) => a.type === b.type);
      if (index === null) {
        return null;
      }
      parts.push(`${node.type}()[${index}]`);
      break;
    } else {
      const index = getIndexOf(
        parent,
        node,
        (a, b) => "tagName" in a && a.tagName === b.tagName,
      );
      if (index === null) {
        return null;
      }
      const hasMultipleSameTagSiblings =
        index > 1 || hasNextSameTagSibling(parent, node);
      const indexSuffix = hasMultipleSameTagSiblings ? `[${index}]` : "";
      parts.push(`${node.tagName}${indexSuffix}`);
    }
    parent = node;
  }

  return parts.length ? "/" + parts.join("/") : null;
}

function findParents(
  doc: Readonly<hast.Root>,
  el: Readonly<XPathSelectableContent>,
) {
  return (function traverse(
    node: Readonly<hast.Root> | Readonly<XPathSelectableContent>,
    parents: readonly Readonly<hast.Element>[],
  ): [...Readonly<hast.Element>[], Readonly<XPathSelectableContent>] | [] {
    if (node === el) {
      return [...parents, node];
    }
    if ("children" in node) {
      for (const child of node.children) {
        if (!isXPathSelectable(child)) {
          continue;
        }
        const ret = traverse(child, [
          ...parents,
          ...(node.type === "root" ? [] : [node]),
        ]);
        if (ret.length !== 0) {
          return ret;
        }
      }
    }
    return [];
  })(doc, []);
}

function getIndexOf<T extends Readonly<hast.Content>>(
  parent: Readonly<hast.Parent>,
  target: T,
  predicate: (node: Readonly<hast.Content>, target: T) => boolean,
): number | null {
  let index = 1;
  for (const child of parent.children) {
    if (child === target) {
      return index;
    }
    if (predicate(child, target)) {
      index++;
    }
  }
  return null;
}

function hasNextSameTagSibling(
  parent: Readonly<hast.Parent>,
  target: Readonly<hast.Element>,
): boolean | null {
  let foundTarget = false;
  for (const child of parent.children) {
    if (foundTarget && "tagName" in child && child.tagName === target.tagName) {
      return true;
    }
    if (child === target) {
      foundTarget = true;
    }
  }
  return foundTarget ? false : null;
}
