import test from "node:test";
import assert from "node:assert/strict";
import { signState, verifyState } from "../src/state.mjs";
import { EphemeralStore } from "../src/store.mjs";

test("OAuth state round trip", () => {
  const token = signState("secret", { connectionId: "abc" });
  assert.equal(verifyState("secret", token).connectionId, "abc");
});

test("OAuth state rejects tamper", () => {
  const token = signState("secret", { connectionId: "abc" });
  assert.throws(() => verifyState("secret", token + "x"));
});

test("session ownership is enforced", () => {
  const store = new EphemeralStore();
  const id = store.createConnection();
  store.saveSession(id, { id: "s1", pickerUri: "https://photos.google.com/picker/x" });
  assert.doesNotThrow(() => store.assertSessionOwner(id, "s1"));
  assert.throws(() => store.assertSessionOwner("other", "s1"));
});
