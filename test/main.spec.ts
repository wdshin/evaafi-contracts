import chai, { expect } from "chai";
import chaiBN from "chai-bn";
import BN from "bn.js";
chai.use(chaiBN(BN));

import { beginDict, TonClient, fromNano, WalletContractV4, internal, Cell, toNano, Address, safeSign, beginCell } from "ton";
import { SmartContract } from "ton-contract-executor";
import * as main from "../contracts/main";
import { internalMessage, randomAddress } from "./helpers";
import { mnemonicNew, mnemonicToPrivateKey, sha256_sync } from "ton-crypto";
import { sign, signVerify } from "ton-crypto";

import { hex } from "../build/main.compiled.json";
import { hex as userHex } from "../build/user.compiled.json";

import Prando from "prando";

const op = { //todo
  initMaster: 0x0,
  initUser: 0x0,
  updatePrice: 0x0,
  updateConfig: 0x0,
}

describe("test", () => {
  let contract: SmartContract;

  beforeEach(async () => {
    contract = await SmartContract.fromCell(
      Cell.fromBoc(hex)[0] as any, // code cell from build output
      beginCell()
        .storeRef(beginCell().storeBuffer(new Buffer('Main evaa pool.')).endCell())
        .storeAddress(randomAddress("admin"))
        .storeRef(Cell.fromBoc(userHex)[0])
        .storeRef(beginCell()
          .storeRef(beginCell().endCell())
          .storeUint(-1, 8)
          .storeAddress(randomAddress('admin'))
          .endCell())
        .storeRef(beginCell().endCell())
        .endCell(),
      {
        debug: true,
      }
    );

    const assetData = beginDict(255);
    const assetConfig = beginDict(255);

    const tonDataCell = beginCell()
      .storeUint(2000000000, 64)
      .storeUint(1000454300 * 1000000000, 64)
      .storeUint(1000678000 * 1000000000, 64)
      .storeUint(40000000000, 64)
      .storeUint(35000000000, 64)
      .storeUint((new Date()).getTime() * 1000, 64)
      .endCell()

    const usdtDataCell = beginCell()
      .storeUint(1000000000, 64)
      .storeUint(1000134550 * 1000000000, 64)
      .storeUint(1000432100 * 1000000000, 64)
      .storeUint(50000000000, 64)
      .storeUint(40000000000, 64)
      .storeUint((new Date()).getTime() * 1000, 64)
      .endCell()

    assetData.storeCell(randomAddress('ton').toBuffer(), tonDataCell)
    assetData.storeCell(randomAddress('usdt').toBuffer(), usdtDataCell)

    const tonConfigCell = beginCell()
      .storeAddress(randomAddress('oracle'))
      .storeUint(8, 8)
      .storeRef(beginCell()
        .storeUint(8300, 16)
        .storeUint(9000, 16)
        .storeUint(500, 16)
        .storeUint(15854895991, 64)
        .storeUint(25000000000, 64)
        .storeUint(187500000000, 64)
        .storeUint(10000000000, 64)
        .storeUint(100000000000, 64)
        .storeUint(800000000000 * 1000000, 64)
        .endCell())
      .endCell()

    const usdtConfigCell = beginCell()
      .storeAddress(randomAddress('oracle'))
      .storeUint(6, 8)
      .storeRef(beginCell()
        .storeUint(8000, 16)
        .storeUint(8500, 16)
        .storeUint(700, 16)
        .storeUint(20611364789, 64)
        .storeUint(32500000000, 64)
        .storeUint(243750000000, 64)
        .storeUint(13000000000, 64)
        .storeUint(130000000000, 64)
        .storeUint(900000000000 * 1000000, 64)
        .endCell())
      .endCell()

    assetConfig.storeCell(randomAddress('ton').toBuffer(), tonConfigCell)
    assetConfig.storeCell(randomAddress('usdt').toBuffer(), usdtConfigCell)

    const init = await contract.sendInternalMessage(
      internalMessage({
        value: toNano(0.69),
        from: randomAddress('admin'),
        body: beginCell()
          .storeUint(op.initMaster, 32)
          .storeUint(0, 64)
          .storeRef(assetConfig.endCell())
          .storeRef(assetData.endCell())
          .endCell(),
      }) as any
    );

    console.log(init.debugLogs);
    console.log(init.gas_consumed);
  });

  it("init user", async () => {
    let mnemonics = await mnemonicNew();
    let keyPair = await mnemonicToPrivateKey(mnemonics);
    const add = new Address(0, keyPair.publicKey);

    const tx = await contract.sendInternalMessage(
      internalMessage({
        value: toNano(0.69),
        from: add,
        body: beginCell()
          .storeUint(op.initUser, 32)
          .storeUint(0, 64)
          .endCell(),
      }) as any
    );

    console.log(tx.debugLogs);
    console.log(tx.gas_consumed);
  });

  it("update token price", async () => {
    const tx = await contract.sendInternalMessage(
      internalMessage({
        value: toNano(0),
        from: randomAddress('admin'),
        body: beginCell()
          .storeUint(op.updatePrice, 32)
          .storeUint(0, 64)
          .storeUint(100, 64) // new price
          .endCell(),
      }) as any
    );
    console.log(tx.debugLogs);
    console.log(tx.gas_consumed);
  });

  it("update master config", async () => {
    const assetConfig = beginDict(255);

    const tonConfigCell = beginCell()
      .storeAddress(randomAddress('oracle'))
      .storeUint(8, 8)
      .storeRef(beginCell()
        .storeUint(8300, 16)
        .storeUint(9000, 16)
        .storeUint(500, 16)
        .storeUint(15854895991, 64)
        .storeUint(25000000000, 64)
        .storeUint(187500000000, 64)
        .storeUint(10000000000, 64)
        .storeUint(100000000000, 64)
        .storeUint(800000000000 * 1000000, 64)
        .endCell())
      .endCell()

    const usdtConfigCell = beginCell()
      .storeAddress(randomAddress('oracle'))
      .storeUint(6, 8)
      .storeRef(beginCell()
        .storeUint(8000, 16)
        .storeUint(8500, 16)
        .storeUint(700, 16)
        .storeUint(20611364789, 64)
        .storeUint(32500000000, 64)
        .storeUint(243750000000, 64)
        .storeUint(13000000000, 64)
        .storeUint(130000000000, 64)
        .storeUint(900000000000 * 1000000, 64)
        .endCell())
      .endCell()


    assetConfig.storeCell(randomAddress('ton').toBuffer(), tonConfigCell)
    assetConfig.storeCell(randomAddress('usdt').toBuffer(), usdtConfigCell)

    const tx = await contract.sendInternalMessage(
      internalMessage({
        value: toNano(0),
        from: randomAddress('admin'),
        body: beginCell()
          .storeUint(op.updateConfig, 32)
          .storeUint(0, 64)
          .storeRef(assetConfig.endCell())
          .endCell(),
      }) as any
    );

    console.log(tx.debugLogs);
    console.log(tx.gas_consumed);
  });
});

