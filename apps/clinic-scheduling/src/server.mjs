import http from "node:http";
import {createPool} from "./db.mjs";
import {createApi} from "./api.mjs";

const pool=createPool();
const server=http.createServer(createApi(pool));
server.listen(Number(process.env.PORT||3000),()=>console.log("clinic-scheduling listening"));
