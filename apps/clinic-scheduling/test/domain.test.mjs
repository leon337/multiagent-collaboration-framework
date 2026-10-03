import test from "node:test";
import assert from "node:assert/strict";
import {assertTransition,parseRfc3339,interval,isFullyCovered,normalizeIntervals,validateIanaTimezone} from "../src/domain.mjs";

test("requires explicit RFC3339 offset",()=>assert.throws(()=>parseRfc3339("2026-10-03T10:00:00"),/Timestamp must be RFC 3339/));
test("duration produces semi-open interval",()=>{const s=parseRfc3339("2026-10-03T10:00:00-03:00"),x=interval(s,30);assert.equal(x.endAtUtc.getTime()-x.startAtUtc.getTime(),1800000);});
test("state machine rejects completed to cancelled",()=>assert.throws(()=>assertTransition("COMPLETED","CANCELLED"),/not allowed/));
test("availability requires full coverage",()=>{const s=parseRfc3339("2026-10-03T10:00:00Z"),e=parseRfc3339("2026-10-03T11:00:00Z");assert.equal(isFullyCovered(s,e,[{startAtUtc:s,endAtUtc:e}]),true);assert.equal(isFullyCovered(s,e,[{startAtUtc:s,endAtUtc:parseRfc3339("2026-10-03T10:30:00Z")}]),false);});
test("same-layer availability intervals are normalized",()=>assert.deepEqual(normalizeIntervals([{start:"09:00",end:"10:00"},{start:"09:30",end:"11:00"}]),[{start:"09:00",end:"11:00"}]));
test("timezone accepts IANA identifiers",()=>{assert.doesNotThrow(()=>validateIanaTimezone("America/Recife"));assert.doesNotThrow(()=>validateIanaTimezone("UTC"));assert.throws(()=>validateIanaTimezone("Not/AZone"),/IANA timezone/);});
