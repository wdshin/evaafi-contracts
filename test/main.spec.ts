import chai, { expect } from "chai";
import chaiBN from "chai-bn";
import BN from "bn.js";
chai.use(chaiBN(BN));

import { TonClient, fromNano, WalletContractV4, internal, Cell, toNano, Address, safeSign, beginCell } from "ton";
import { SmartContract } from "ton-contract-executor";
import * as main from "../contracts/main";
import { internalMessage, randomAddress } from "./helpers";
import { mnemonicNew, mnemonicToPrivateKey, sha256_sync } from "ton-crypto";
import { sign, signVerify } from "ton-crypto";

import { hex } from "../build/main.compiled.json";

import Prando from "prando";

const genRand = (str: string) => {
  const random = new Prando(str);
  const hash = Buffer.alloc(32);
  for (let i = 0; i < hash.length; i++) {
    hash[i] = random.nextInt(0, 255);
  }

  console.log(hash.length);
  console.log(hash.toString("hex"));
  return hash;
};

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

  const nullifier = genRand('nullifier');
  const note = genRand('note'); 
  const seed = Buffer.concat([note, nullifier]); 

  it("depo and wthdrwl test", async () => {
    let mnemonics = await mnemonicNew();
    let keyPair = await mnemonicToPrivateKey(mnemonics);
    const add = new Address(0, keyPair.publicKey);

    //const sig = sign(sha256_sync(seed), keyPair.secretKey);
    const sig = sha256_sync(seed);
    
    const sendIncrement = await contract.sendInternalMessage(
      internalMessage({
        value: toNano(2.69),
        from: add,
        body: beginCell().storeUint(0x292eb3bc, 32).storeBuffer(sig).endCell(),
      }) as any
    );
    console.log(sendIncrement.debugLogs);
    console.log(sendIncrement.gas_consumed);
  });
});


//import chai, { expect } from "chai";
//import chaiBN from "chai-bn";
//import BN from "bn.js";
//chai.use(chaiBN(BN));
//
//import { TonClient, fromNano, WalletContractV4, internal, Cell, toNano, Address, safeSign, beginCell } from "ton";
//import { SmartContract } from "ton-contract-executor";
//import * as main from "../contracts/main";
//import { internalMessage, randomAddress } from "./helpers";
//import { mnemonicNew, mnemonicToPrivateKey, sha256_sync } from "ton-crypto";
//import { sign, signVerify } from "ton-crypto";
//
//import { hex } from "../build/main.compiled.json";
//
//import Prando from "prando";
//
//const genRand = (str: string) => {
//  const random = new Prando(str);
//  const hash = Buffer.alloc(32);
//  for (let i = 0; i < hash.length; i++) {
//    hash[i] = random.nextInt(0, 255);
//  }
//
//  console.log(hash.length);
//  console.log(hash.toString("hex"));
//  return hash;
//};
//
//describe("test", () => {
//  let contract: SmartContract;
//
//  beforeEach(async () => {
//    contract = await SmartContract.fromCell(
//      Cell.fromBoc(hex)[0] as any, // code cell from build output
//      main.data({
//        ownerAddress: randomAddress("owner"),
//        number: 0,
//      }) as any,
//      {
//        debug: true,
//      }
//    );
//  });
//
//  const nullifier = genRand('nullifier');
//  const note = genRand('note'); 
//  const seed = Buffer.concat([note, nullifier]); 
//
//  it("depo and wthdrwl test", async () => {
//    let mnemonics = await mnemonicNew();
//    let keyPair = await mnemonicToPrivateKey(mnemonics);
//    const add = new Address(0, keyPair.publicKey);
//
//    //const sig = sign(sha256_sync(seed), keyPair.secretKey);
//    const sig = sha256_sync(seed);
//    
//    const sendIncrement = await contract.sendInternalMessage(
//      internalMessage({
//        value: toNano(2.69),
//        from: add,
//        body: beginCell().storeUint(0x292eb3bc, 32).storeBuffer(sig).endCell(),
//      }) as any
//    );
//
//    console.log(sendIncrement.debugLogs);
//    console.log(sendIncrement.gas_consumed);
//
//    const sendWith = await contract.sendInternalMessage(
//      internalMessage({
//        value: toNano(2),
//        from: add,
//        body: beginCell().storeUint(0x4a195ca8, 32).storeBuffer(keyPair.publicKey).storeBuffer(sha256_sync(seed)).endCell(),
//      }) as any
//    );
//
//    console.log(sendWith.debugLogs);
//    console.log(sendWith.gas_consumed);
//    //@ts-ignore
//    console.log("res", fromNano(sendWith.actionList[0].message.info.value.coins));
//  });
//});
