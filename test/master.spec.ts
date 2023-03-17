import { beginDict, Address, Cell, toNano, beginCell, TupleSlice } from "ton";
import { SmartContract } from "ton-contract-executor";
import { op, logs, balances_parse, reserves_parse, rates_parse, hex2a, asset_config_parse, asset_dynamics_parse, internalMessage, randomAddress, tonConfigCell, asset_config_collection_packed_dict, asset_dynamics_collection_packed_dict, user_principals_packed_dict } from "./utils";
import BN from 'bn.js';
import { hex } from "../build/master.compiled.json";
import { hex as userHex } from "../build/user.compiled.json";
import { expect } from "chai";

const oracleOnChainMetadataSpec: {
  [key in any]: 'utf8' | 'ascii' | undefined;
} = {
  name: 'utf8',
  description: 'utf8',
  image: 'ascii',
};
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
        from: Address.parseFriendly('EQD7TNVnRnSGHq-E0xDokOqOI8zHlJPHPqb_RmeUgaC8MXGi').address,
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

  it("master run get updated rates for usdt", async () => {
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
    // todo
    // const res = tx.result.map(e => BigInt(e));
    // expect(res[0]).equals('success'); // todo
    // expect(res[1]).equals('success');
    expect(tx.type).equals('success');
  });

  it("master run get asset data method", async () => {
    const tx = await contract.invokeGetMethod('getAssetsData', []);
    // logs(tx);
    const dict = asset_dynamics_parse((tx.result[0] as Cell).beginParse())
    // console.log(dict)
    expect(tx.type).equals('success');
  });

  it("master run get ui variables method", async () => {
    const tx = await contract.invokeGetMethod('getUIVariables', []);
    // logs(tx);
    const dict_asset_dynamics = asset_dynamics_parse((tx.result[0] as Cell).beginParse())
    console.log(dict_asset_dynamics)
    const conf = (tx.result[1] as Cell).beginParse();
    const metadata = (conf.readRef().readBuffer(('Main evaa pool.').length).toString())
    conf.readRef();
    const confRef = conf.readRef();
    const asset_config = asset_config_parse(confRef.readRef())
    console.log(asset_config);
    const rates = rates_parse((tx.result[2] as Cell).beginParse())
    console.log(rates);
    const reserves = reserves_parse((tx.result[3] as Cell).beginParse())
    console.log(reserves);
    expect(tx.type).equals('success');
    expect(metadata).equals('Main evaa pool.');
  });

  it("master get collateralQuote", async () => {
    //@ts-ignore
    const tx = await contract.invokeGetMethod('getCollateralQuote', [{
      type: "cell_slice",
      value: beginCell()
        .storeAddress(randomAddress('usdt'))
        .endCell()
        .toBoc({ idx: false })
        .toString("base64")
    }, {
      type: "cell_slice",
      value: beginCell()
        .storeAddress(randomAddress('ton'))
        .endCell()
        .toBoc({ idx: false })
        .toString("base64")
    }, { type: 'int', value: '200' + '000000' }]);
    logs(tx);
    // todo
    console.log(tx.result[0]?.toString())
    // const res = tx.result.map(e => BigInt(e));
    // expect([0]).equals('success'); // todo
    // expect(res[1]).equals('success');
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
        .storeInt(0, 1)
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

  it("user run get account asset balance", async () => {
    //@ts-ignore
    const tx = await user_contract.invokeGetMethod('getAccountAssetBalance', [{
      type: "cell_slice",
      value: beginCell()
        .storeAddress(randomAddress('usdt'))
        .endCell()
        .toBoc({ idx: false })
        .toString("base64")
    }, { type: 'int', value: '1000134550000000000' }, { type: 'int', value: '1000432100000000000' }]);
    logs(tx);
    console.log(tx.result[0]?.toString())
    expect(tx.type).equals('success');
  });

  it("user run get is liquidable", async () => {
    //@ts-ignore
    const tx = await user_contract.invokeGetMethod('getIsLiquidable', [{ type: 'cell', value: asset_config_collection_packed_dict.toBoc({ idx: false }).toString('base64') }, { type: 'cell', value: asset_dynamics_collection_packed_dict.toBoc({ idx: false }).toString('base64') }]);
    // logs(tx);
    console.log(tx.result[0]?.toString())
    expect(tx.type).equals('success');
  });

  it("user run get agregated balances", async () => {
    //@ts-ignore
    const tx = await user_contract.invokeGetMethod('getAggregatedBalances', [{ type: 'cell', value: asset_config_collection_packed_dict.toBoc({ idx: false }).toString('base64') }, { type: 'cell', value: asset_dynamics_collection_packed_dict.toBoc({ idx: false }).toString('base64') }]);
    logs(tx);
    console.log(tx.result[0]?.toString())
    console.log(tx.result[1]?.toString())
    expect(tx.type).equals('success');
  });

  it("user run get acc balances method", async () => {
    //@ts-ignore
    const tx = await user_contract.invokeGetMethod('getAccountBalances', [{ type: 'cell', value: asset_dynamics_collection_packed_dict.toBoc({ idx: false }).toString('base64') }]);
    // logs(tx);
    console.log(balances_parse((tx.result[0] as Cell).beginParse()))
    expect(tx.type).equals('success');
  });

  it("user run get avl to borr method", async () => {
    //@ts-ignore
    const tx = await user_contract.invokeGetMethod('getAvailableToBorrow', [{ type: 'cell', value: asset_config_collection_packed_dict.toBoc({ idx: false }).toString('base64') }, { type: 'cell', value: asset_dynamics_collection_packed_dict.toBoc({ idx: false }).toString('base64') }]);
    // logs(tx);
    console.log(tx.result[0]?.toString())
    expect(tx.type).equals('success');
  });

  it("user run get test method", async () => {
    const tx = await user_contract.invokeGetMethod('test', []);
    // logs(tx);
    expect(tx.type).equals('success');
  });
});

