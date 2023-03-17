import { Cell } from "ton";

import masterJSON from "../../build/master.compiled.json" assert { type: "json" };
import userJSON from "../../build/user.compiled.json" assert { type: "json" };


// Code cells from build output
export const masterCodeCell = Cell.fromBoc(Buffer.from(masterJSON.hex, 'hex'))[0];
export const userCodeCell = Cell.fromBoc(Buffer.from(userJSON.hex, 'hex'))[0];
