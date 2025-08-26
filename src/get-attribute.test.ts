import type { ElementContent } from "hast";
import { getAttribute } from "./get-attribute.js";

import { fromHtml } from "hast-util-from-html";
import { toHtml } from "hast-util-to-html";
import assert from "node:assert";
import test from "node:test";

const DIV = {
  type: "element" as const,
  tagName: "div",
  children: [] as ElementContent[],
};

test("<no matching properties> => null", () => {
  const e = { ...DIV, properties: {} };
  assert.strictEqual(toHtml(e), "<div></div>", "Prerequisite");
  assert.strictEqual(getAttribute(e, "foo"), null);
});

test('true => ""', () => {
  const e = { ...DIV, properties: { foo: true } };
  assert.strictEqual(toHtml(e), "<div foo></div>", "Prerequisite");
  assert.strictEqual(getAttribute(e, "foo"), "");
});

test("false => null", () => {
  const e = { ...DIV, properties: { foo: false } };
  assert.strictEqual(toHtml(e), "<div></div>", "Prerequisite");
  assert.strictEqual(getAttribute(e, "foo"), null);
});

test('42 => "42"', () => {
  const e = { ...DIV, properties: { foo: 42 } };
  assert.strictEqual(toHtml(e), '<div foo="42"></div>', "Prerequisite");
  assert.strictEqual(getAttribute(e, "foo"), "42");
});

test('"bar" => "bar"', () => {
  const e = { ...DIV, properties: { foo: "bar" } };
  assert.strictEqual(toHtml(e), '<div foo="bar"></div>', "Prerequisite");
  assert.strictEqual(getAttribute(e, "foo"), "bar");
});

test('"" => ""', () => {
  const e = { ...DIV, properties: { foo: "" } };
  assert.strictEqual(toHtml(e), '<div foo=""></div>', "Prerequisite");
  assert.strictEqual(getAttribute(e, "foo"), "");
});

test("null => null", () => {
  const e = { ...DIV, properties: { foo: null } };
  assert.strictEqual(toHtml(e), "<div></div>", "Prerequisite");
  assert.strictEqual(getAttribute(e, "foo"), null);
});

test("undefined => null", () => {
  const e = { ...DIV, properties: { foo: undefined } };
  assert.strictEqual(toHtml(e), "<div></div>", "Prerequisite");
  assert.strictEqual(getAttribute(e, "foo"), null);
});

test('[42, "bar"] => "42 bar"', () => {
  const e = { ...DIV, properties: { foo: [42, "bar"] } };
  assert.strictEqual(toHtml(e), '<div foo="42 bar"></div>', "Prerequisite");
  assert.strictEqual(getAttribute(e, "foo"), "42 bar");
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function deleteProperty(obj: any, key: PropertyKey) {
  delete obj[key];
  return obj;
}

test("note: all notations are converted to string with fromHtml", () => {
  assert.deepStrictEqual(
    deleteProperty(
      fromHtml("<div foo></div>", { fragment: true }).children[0],
      "position",
    ),
    {
      type: "element",
      tagName: "div",
      properties: { foo: "" },
      children: [],
    },
  );
  assert.deepStrictEqual(
    deleteProperty(
      fromHtml("<div foo=42></div>", { fragment: true }).children[0],
      "position",
    ),
    {
      type: "element",
      tagName: "div",
      properties: { foo: "42" },
      children: [],
    },
  );
  assert.deepStrictEqual(
    deleteProperty(
      fromHtml('<div foo=""></div>', { fragment: true }).children[0],
      "position",
    ),
    {
      type: "element",
      tagName: "div",
      properties: { foo: "" },
      children: [],
    },
  );
  assert.deepStrictEqual(
    deleteProperty(
      fromHtml('<div foo="42 bar"></div>', { fragment: true }).children[0],
      "position",
    ),
    {
      type: "element",
      tagName: "div",
      properties: { foo: "42 bar" },
      children: [],
    },
  );
});
