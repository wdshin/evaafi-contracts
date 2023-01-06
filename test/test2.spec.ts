import chai, { expect } from "chai";
import chaiBN from "chai-bn";
import BN from "bn.js";
chai.use(chaiBN(BN));

import { TonClient, WalletContractV4, internal, Cell, toNano, Address, safeSign, beginCell } from "ton";
import { SmartContract } from "ton-contract-executor";
import * as main from "../contracts/main";
import { internalMessage, randomAddress } from "./helpers";
import { mnemonicNew, mnemonicToPrivateKey, sha256_sync} from "ton-crypto";
import { sign, signVerify } from "ton-crypto";

import { hex } from "../build/main.compiled.json";

describe("test", () => {
  let contract: SmartContract;

  beforeEach(async () => {
    contract = await SmartContract.fromCell(
      Cell.fromBoc(hex)[0] as any, // code cell from build output
      main.data({
        ownerAddress: randomAddress("owner"),
        number: 0,
      }) as any,
      {
        debug: true,
      }
    );
  });

  it("depo", async () => {
    const depoAdd = randomAddress("notowner");
    const withdrawalAdd = randomAddress("notowner");

    let mnemonics = await mnemonicNew();
    let keyPair = await mnemonicToPrivateKey(mnemonics);

   // const sig = safeSign(beginCell().storeBuffer(new Buffer("text")).endCell(), keyPair.secretKey);
    const sig = sign(new Buffer('text'), keyPair.secretKey); 
    console.log(sig.byteLength);
    const sendIncrement = await contract.sendInternalMessage(
      internalMessage({
        value: toNano(2),
        from: depoAdd,
        body: beginCell().storeUint(0x292eb3bc, 32).storeBuffer(sig).endCell(),
      }) as any
    );

    console.log(sendIncrement.debugLogs);
    console.log(sendIncrement.gas_consumed);
  });

  it("wthdrwl", async () => {
    const depoAdd = randomAddress("notowner");
    const withdrawalAdd = randomAddress("notowner");
    let mnemonics = await mnemonicNew();
    let keyPair = await mnemonicToPrivateKey(mnemonics);

    const add = new Address(0, keyPair.publicKey);
    const sig = sign(sha256_sync('text'), keyPair.secretKey); 
    console.log(sig.toString('hex'));

    const sendIncrement = await contract.sendInternalMessage(
      internalMessage({
        value: toNano(2),
        from: add,
        body: beginCell().storeUint(0x292eb3bc, 32).storeBuffer(sig).endCell(),
      }) as any
    );

    console.log(sendIncrement.debugLogs);
    console.log(sendIncrement.gas_consumed);
    const sendWith = await contract.sendInternalMessage(
      internalMessage({
        value: toNano(2),
        from: add,
        body: beginCell()
          .storeUint(0x4a195ca8, 32)
          .storeBuffer(keyPair.publicKey)
          .storeBuffer(sha256_sync("text"))
          .storeRef(beginCell().storeBuffer(sig).endCell())
          .endCell(),
      }) as any
    );
    console.log(sendWith.debugLogs);
    console.log(sendWith.gas_consumed);
  });
});
