import { Cell } from "ton";

import { hex as masterHex } from "../build/master.compiled.json";
import { hex as userHex } from "../build/user.compiled.json";


// Code cells from build output
export const masterCodeCell = Cell.fromBoc(masterHex)[0];
export const userCodeCell = Cell.fromBoc(userHex)[0];
