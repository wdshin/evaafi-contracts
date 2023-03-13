import { beginDict, Cell, toNano, beginCell, TupleSlice } from "ton";
import { SmartContract } from "ton-contract-executor";
import { op, logs, internalMessage, randomAddress, tonConfigCell, asset_config_collection_packed_dict, asset_dynamics_collection_packed_dict, user_principals_packed_dict } from "./utils";
import BN from 'bn.js';
import { hex } from "../build/master.compiled.json";
import { hex as userHex } from "../build/user.compiled.json";
import { expect } from "chai";

let contract: SmartContract;
describe("evaa master sc tests", () => {
  beforeEach(async () => {
    contract = await SmartContract.fromCell(
      Cell.fromBoc(hex)[0] as any, // code cell from build output
      beginCell()
        .storeRef(beginCell().storeBuffer(new Buffer('Main evaa pool.')).endCell())
        .storeRef(Cell.fromBoc(userHex)[0])
        .storeRef(beginCell()
          .storeDict(beginDict(256).endDict())
          .storeInt(-1, 8)
          .storeAddress(randomAddress('admin'))
          .storeDict(beginDict(256).endDict())
          .endCell())
        .storeDict(beginDict(256).endDict())
        .endCell(),
      {
        debug: true,
      }
    );

    const to_master = beginDict(256);
    to_master.storeCell(randomAddress('ton').hash, tonConfigCell)
    const tx = await contract.sendInternalMessage(
      internalMessage({
        value: toNano(0),
        from: randomAddress('admin'),
        body: beginCell()
          .storeUint(op.init_master, 32)
          .storeUint(0, 64)
          .storeRef(asset_config_collection_packed_dict)
          .storeRef(asset_dynamics_collection_packed_dict)
          .endCell(),
      }) as any
    );
    // logs(tx);
  });

  it("master run init user", async () => {
    const tx = await contract.sendInternalMessage(
      internalMessage({
        value: toNano(0),
        from: randomAddress('admin'),
        body: beginCell()
          .storeUint(op.init_user, 32)
          .storeUint(0, 64)
          .endCell(),
      }) as any
    );
    // logs(tx);
    expect(tx.type).equals('success');
  });

  it("master run update token price", async () => {
    const tx = await contract.sendInternalMessage(
      internalMessage({
        value: toNano(0),
        from: randomAddress('oracle'),
        body: beginCell()
          .storeUint(op.update_price, 32)
          .storeUint(0, 64)
          .storeAddress(randomAddress('ton')) // new price
          .storeUint(100, 64) // new price
          .endCell(),
      }) as any
    );
    // logs(tx);
    expect(tx.type).equals('success');
  });

  it("master run update master config", async () => {
    const tx = await contract.sendInternalMessage(
      internalMessage({
        value: toNano(0),
        from: randomAddress('admin'),
        body: beginCell()
          .storeUint(op.update_config, 32)
          .storeUint(0, 64)
          .storeRef(asset_config_collection_packed_dict)
          .endCell(),
      }) as any
    );

    // logs(tx);
    expect(tx.type).equals('success');
  });

  it("master run get updated rates", async () => {
    //@ts-ignore
    const tx = await contract.invokeGetMethod('getUpdatedRates', [{ type: 'cell', value: asset_config_collection_packed_dict.toBoc({ idx: false }).toString('base64') }, { type: 'cell', value: asset_dynamics_collection_packed_dict.toBoc({ idx: false }).toString('base64') }, {
      type: "cell_slice",
      value: beginCell()
        .storeAddress(randomAddress('usdt'))
        .endCell()
        .toBoc({ idx: false })
        .toString("base64")
    }, { type: 'int', value: '10' }]);

    // logs(tx);
    expect(tx.type).equals('success');
  });

  it("master run get asset data method", async () => {
    const tx = await contract.invokeGetMethod('getAssetsData', []);
    // logs(tx);
    expect(tx.type).equals('success');
  });

  it("master run get ui variables method", async () => {
    const tx = await contract.invokeGetMethod('getUIVariables', []);
    // logs(tx);
    expect(tx.type).equals('success');
  });
});

describe("evaa user sc tests", () => {
  let user_contract: SmartContract;
  beforeEach(async () => {
    user_contract = await SmartContract.fromCell(
      Cell.fromBoc(userHex)[0] as any, // code cell from build output
      beginCell()
        .storeAddress(randomAddress('master'))
        .storeAddress(randomAddress('user'))
        .storeDict(beginDict(256).endDict())
        .endCell(),
      {
        debug: true,
      }
    );

    const tx = await user_contract.sendInternalMessage(
      internalMessage({
        value: toNano(0),
        from: randomAddress('master'),
        body: beginCell()
          .storeUint(op.init_user, 32)
          .storeUint(0, 64)
          .storeDict(user_principals_packed_dict)
          .endCell(),
      }) as any
    );

    // logs(tx);
  });

  it("user run get account asset balance get method", async () => {
    //@ts-ignore
    const tx = await user_contract.invokeGetMethod('getAccountAssetBalance', [{
      type: "cell_slice",
      value: beginCell()
        .storeAddress(randomAddress('ton'))
        .endCell()
        .toBoc({ idx: false })
        .toString("base64")
    }, { type: 'int', value: '1' }, { type: 'int', value: '2' }]);
    // logs(tx);
    expect(tx.type).equals('success');
  });

  it("user run get acc balances method", async () => {
    //@ts-ignore
    const tx = await user_contract.invokeGetMethod('getAccountBalances', [{ type: 'cell', value: asset_dynamics_collection_packed_dict.toBoc({ idx: false }).toString('base64') }]);
    // logs(tx);
    expect(tx.type).equals('success');
  });

  it("user run get avl to borr method", async () => {
    //@ts-ignore
    const tx = await user_contract.invokeGetMethod('getAvailableToBorrow', [{ type: 'cell', value: asset_config_collection_packed_dict.toBoc({ idx: false }).toString('base64') }, { type: 'cell', value: asset_dynamics_collection_packed_dict.toBoc({ idx: false }).toString('base64') }]);
    // logs(tx);
    expect(tx.type).equals('success');
  });

  it("user run get test method", async () => {
    const tx = await user_contract.invokeGetMethod('test', []);
    // logs(tx);
    expect(tx.type).equals('success');
  });
});

