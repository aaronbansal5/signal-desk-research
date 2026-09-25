import {listReports} from '../../src/server/storage.js';
export default async()=>{try{return Response.json(await listReports())}catch{return Response.json([])}};
