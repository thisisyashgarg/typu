import { test } from "node:test"
import assert from "node:assert/strict"
import { FILE_MARKER, generateTypes } from "./utils.ts"

const gen = (value: unknown, name = "Root") => generateTypes([{ name, value }])[0]

test("nested objects and primitive arrays", () => {
  assert.equal(
    gen({ id: 1, tags: ["a"], user: { name: "x" } }),
    `export interface IRoot {\n  id: number;\n  tags: string[];\n  user: IUser;\n}\n\nexport interface IUser {\n  name: string;\n}`
  )
})

test("array items are merged: optional keys and nullable values (#3)", () => {
  const out = gen({ items: [{ a: 1, deleted_at: null }, { a: 2, b: "x", deleted_at: "2024" }] })
  assert.match(out, /items: IItemsItem\[\];/)
  assert.match(out, /a: number;/)
  assert.match(out, /b\?: string;/)
  assert.match(out, /deleted_at: string \| null;/)
})

test("lone null infers from key name (#3)", () => {
  const out = gen({ deletedAt: null, created_at: null, parent: null })
  assert.match(out, /deletedAt: string \| null;/)
  assert.match(out, /created_at: string \| null;/)
  assert.match(out, /parent: unknown \| null;/)
})

test("files become File (#2)", () => {
  assert.match(gen({ avatar: FILE_MARKER, name: "x" }), /avatar: File;/)
})

test("root arrays, primitives, mixed and nested arrays", () => {
  assert.equal(gen([{ id: 1 }]), `export type IRoot = IRootItem[];\n\nexport interface IRootItem {\n  id: number;\n}`)
  assert.equal(gen("hi"), `export type IRoot = string;`)
  assert.equal(gen([]), `export type IRoot = unknown[];`)
  assert.equal(gen([1, "a"]), `export type IRoot = (number | string)[];`)
  assert.equal(gen([[1, 2]]), `export type IRoot = number[][];`)
})

test("invalid identifiers are quoted", () => {
  assert.match(gen({ "content-type": "x", "1st": 1 }), /"content-type": string;\n  "1st": number;/)
})

test("interface names never collide, even across request and response", () => {
  const [req, res] = generateTypes([
    { name: "Request", value: { data: { a: 1 } } },
    { name: "Response", value: { data: { b: 2 }, meta: { data: { c: 3 } } } },
  ])
  assert.match(req, /interface IData \{/)
  assert.match(res, /data: IData2;/)
  assert.match(res, /interface IData3 \{/)
})

test("empty object", () => {
  assert.equal(gen({}), `export interface IRoot {}`)
})
