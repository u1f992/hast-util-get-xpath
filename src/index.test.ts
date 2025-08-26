import { getXPath } from "./index.js";

import type * as hast from "hast";
import assert from "node:assert";
import test from "node:test";

function createElement(tagName: string): hast.Element {
  return {
    type: "element",
    tagName,
    properties: {},
    children: [],
  };
}

function createTextNode(value: string): hast.Text {
  return {
    type: "text",
    value,
  };
}

function appendChild(
  parent: hast.Element,
  child: Readonly<hast.ElementContent>,
) {
  parent.children.push(child);
}

function createDocument(): hast.Root {
  return {
    type: "root",
    children: [
      {
        type: "element",
        tagName: "html",
        properties: {},
        children: [
          {
            type: "element",
            tagName: "body",
            properties: {},
            children: [],
          },
        ],
      },
    ],
  };
}

function getBody(doc: hast.Root): hast.Element {
  return (doc.children[0]! as hast.Element).children[0]! as hast.Element;
}

test("from README.md", () => {
  const div: hast.Element = {
    type: "element",
    tagName: "div",
    properties: {},
    children: [],
  };
  const doc: hast.Root = {
    type: "root",
    children: [
      {
        type: "element",
        tagName: "html",
        properties: {},
        children: [
          {
            type: "element",
            tagName: "body",
            properties: {},
            children: [div],
          },
        ],
      },
    ],
  };

  assert.strictEqual(getXPath(doc, div), "/html/body/div");
});

test("root element", () => {
  const doc = createDocument();
  const r = getXPath(doc, doc);
  assert.strictEqual(r, "/");
});

test("element not belong to the document", () => {
  const doc = createDocument();

  const e = createElement("div");
  const r = getXPath(doc, e);
  assert.strictEqual(r, null);
});

test("empty element", () => {
  const doc = createDocument();

  const e = createElement("div");
  appendChild(getBody(doc), e);
  const r = getXPath(doc, e);
  assert.strictEqual(r, "/html/body/div");
});

test("element with id", () => {
  const doc = createDocument();

  const e = createElement("span");
  e.properties!.id = "foo"; // FIXME: remove ! for hast@3
  appendChild(getBody(doc), e);
  const r = getXPath(doc, e);
  assert.strictEqual(r, '//*[@id="foo"]');
});

test("element with id and ignoreId options is on", () => {
  const doc = createDocument();

  const e = createElement("span");
  e.properties!.id = "foo"; // FIXME: remove ! for hast@3
  appendChild(getBody(doc), e);
  const r = getXPath(doc, e, { ignoreId: true });
  assert.strictEqual(r, "/html/body/span");
});

test("single leaf element", () => {
  const doc = createDocument();

  const e1 = createElement("div");
  const e2 = createElement("span");
  const e3 = createElement("button");
  appendChild(e1, e2);
  appendChild(e2, e3);
  appendChild(getBody(doc), e1);

  const r = getXPath(doc, e3);
  assert.strictEqual(r, "/html/body/div/span/button");
});

test("leaf elements", () => {
  const doc = createDocument();

  const e1 = createElement("div");
  const e2 = createElement("span");
  const e3 = createElement("button");
  const e4 = createElement("button");
  appendChild(e1, e2);
  appendChild(e2, e3);
  appendChild(e2, e4);
  appendChild(getBody(doc), e1);

  const r = getXPath(doc, e3);
  assert.strictEqual(r, "/html/body/div/span/button[1]");

  const r2 = getXPath(doc, e4);
  assert.strictEqual(r2, "/html/body/div/span/button[2]");
});

test("leaf elements inside parent with elements", () => {
  const doc = createDocument();

  const div = createElement("div");
  const span1 = createElement("span");
  const span1button1 = createElement("button");
  const span1button2 = createElement("button");
  const span2 = createElement("span");
  const span2button = createElement("button");
  appendChild(div, span1);
  appendChild(div, span2);
  appendChild(span1, span1button1);
  appendChild(span1, span1button2);
  appendChild(span2, span2button);
  appendChild(getBody(doc), div);

  const rA = getXPath(doc, span1button2);
  assert.strictEqual(rA, "/html/body/div/span[1]/button[2]");

  const rB = getXPath(doc, span2button);
  assert.strictEqual(rB, "/html/body/div/span[2]/button");
});

test("element with a single text node", () => {
  const doc = createDocument();

  const div = createElement("div");
  const text = createTextNode("Hello");
  appendChild(div, text);
  appendChild(getBody(doc), div);
  const r = getXPath(doc, text);
  assert.strictEqual(r, "/html/body/div/text()[1]");
});

test("element with two text nodes", () => {
  const doc = createDocument();

  const div = createElement("div");
  const text1 = createTextNode("Hello");
  const text2 = createTextNode("World");
  appendChild(div, text1);
  appendChild(div, text2);
  appendChild(getBody(doc), div);
  const r = getXPath(doc, text2);
  assert.strictEqual(r, "/html/body/div/text()[2]");
});

test("comment", () => {
  const doc = createDocument();

  const div = createElement("div");
  const comment: hast.Comment = { type: "comment", value: "__comment__" };
  appendChild(div, comment);
  appendChild(getBody(doc), div);
  const r = getXPath(doc, comment);
  assert.strictEqual(r, "/html/body/div/comment()[1]");
});

test("indexing text() and comment() counts only same-type siblings", () => {
  const doc = createDocument();
  const div = createElement("div");
  const t1 = createTextNode("A");
  const c1: hast.Comment = { type: "comment", value: "c1" };
  const t2 = createTextNode("B");
  appendChild(div, t1);
  appendChild(div, c1);
  appendChild(div, t2);
  appendChild(getBody(doc), div);

  assert.strictEqual(getXPath(doc, t1), "/html/body/div/text()[1]");
  assert.strictEqual(getXPath(doc, c1), "/html/body/div/comment()[1]");
  assert.strictEqual(getXPath(doc, t2), "/html/body/div/text()[2]");
});
