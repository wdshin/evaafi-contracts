import chai, { expect } from "chai";
import chaiBN from "chai-bn";
import BN from "bn.js";
chai.use(chaiBN(BN));

import { Cell, toNano, Address } from "ton";
import { SmartContract } from "ton-contract-executor";
import * as main from "../contracts/main";
import { internalMessage, randomAddress } from "./helpers";

import { hex } from "../build/main.compiled.json";

describe("test", () => {
  let contract: SmartContract;

  beforeEach(async () => {
    contract = await SmartContract.fromCell(
      Cell.fromBoc(hex)[0] as any, // code cell from build output
      main.data({
        ownerAddress: randomAddress("owner"),
        number: 0
      }) as any,
      {
        debug: true,
      }
    );
  });

  it("depo", async () => {
    const depoAdd = randomAddress("notowner");
    const withdrawalAdd = randomAddress("notowner");
    const sendIncrement = await contract.sendInternalMessage(
      internalMessage({
        value: toNano(2),
        from: depoAdd,
        body: main.calculate({
          hash: 'someHash',
        }),
      }) as any
    );

    console.log(sendIncrement.debugLogs);
    console.log(sendIncrement.gas_consumed);
  });
  
  it("wthdrwl", async () => {
    const depoAdd = randomAddress("notowner");
    const withdrawalAdd = randomAddress("notowner");
    const sendIncrement = await contract.sendInternalMessage(
      internalMessage({
        value: toNano(2),
        from: depoAdd,
        body: main.calculate({
          hash: 'someHash',
        }),
      }) as any
    );
    
    console.log(sendIncrement.debugLogs);
    console.log(sendIncrement.gas_consumed);
    
    const sendWith = await contract.sendInternalMessage(
      internalMessage({
        from: withdrawalAdd,
        body: main.wthdrwl({
          str: 'someStr',
        }),
      }) as any
    );

    console.log(sendWith.debugLogs);
    console.log(sendWith.gas_consumed);
  });
});
