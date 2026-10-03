export const query=async(db,text,params=[]) => (await db.query(text,params)).rows;
export const queryOne=async(db,text,params=[]) => (await query(db,text,params))[0] ?? null;
export { withTx } from "./db.mjs";
