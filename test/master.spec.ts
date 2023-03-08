import { beginDict, Cell, toNano, beginCell } from "ton";
import { SmartContract } from "ton-contract-executor";
import { internalMessage, randomAddress } from "./utils";
import BN from 'bn.js';
import { hex } from "../build/master.compiled.json";
import { hex as userHex } from "../build/user.compiled.json";

const op = { // todo
  transfer_notification: 0x7362d09c,
  init_master: 1,
  init_user: 2,
  update_price: 3,
  update_config: 4,
  supply: 5,
  withdrawal: 6,
  liquidate: 7,
}

describe("evaa master sc tests", () => {
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

    const asset_dynamics_collection = beginDict(256);
    const asset_config_collection = beginDict(256);

    const tonDataCell = beginCell()
      .storeUint(2000000000, 64)
      .storeUint(new BN("DE253E29D831800", 'hex'), 64)
      .storeUint(new BN("DE31F56D48C6000", 'hex'), 64)
      .storeUint(40000000000, 64)
      .storeUint(35000000000, 64)
      .storeUint((new Date()).getTime() * 1000, 64)
      .endCell()

    const usdtDataCell = beginCell()
      .storeUint(1000000000, 64)
      .storeUint(new BN("DE1311304585C00", 'hex'), 64)
      .storeUint(new BN("DE23FB1C665E800", 'hex'), 64)
      .storeUint(50000000000, 64)
      .storeUint(40000000000, 64)
      .storeUint((new Date()).getTime() * 1000, 64)
      .endCell()

    asset_dynamics_collection.storeCell(randomAddress('ton').hash, tonDataCell)
    asset_dynamics_collection.storeCell(randomAddress('usdt').hash, usdtDataCell)

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
        .storeUint(new BN("B1A2BC2EC500000", 'hex'), 64) // todo move to BN
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
        .storeUint(new BN("C7D713B49DA0000", 'hex'), 64)
        .endCell())
      .endCell()

    asset_config_collection.storeCell(randomAddress('ton').hash, tonConfigCell)
    asset_config_collection.storeCell(randomAddress('usdt').hash, usdtConfigCell)

    const init_master = await contract.sendInternalMessage(
      internalMessage({
        value: toNano(0),
        from: randomAddress('admin'),
        body: beginCell()
          .storeUint(op.init_master, 32)
          .storeUint(0, 64)
          .storeRef(asset_config_collection.endCell())
          .storeRef(asset_dynamics_collection.endCell())
          .endCell(),
      }) as any
    );

    console.log(init_master.debugLogs);
    console.log(init_master.gas_consumed);
  });

  it("master run get method", async () => {
    const tx = await contract.invokeGetMethod('test', []);

    console.log(tx.result[0]);
    console.log(tx.type);
    console.log(tx.exit_code);
    console.log(tx.debugLogs);
    console.log(tx.gas_consumed);
  });

  it("init user", async () => {
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

    console.log(tx.type);
    console.log(tx.debugLogs);
    console.log(tx.gas_consumed);
  });

  it("update token price", async () => {
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
    console.log(tx.type);
    console.log(tx.exit_code);
    console.log(tx.debugLogs);
    console.log(tx.gas_consumed);
  });

  it("update master config", async () => {
    const asset_config_collection = beginDict(256);

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
        .storeUint(new BN("B1A2BC2EC500000", 'hex'), 64) // todo move to BN
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
        .storeUint(new BN("C7D713B49DA0000", 'hex'), 64)
        .endCell())
      .endCell()

    asset_config_collection.storeCell(randomAddress('ton').hash, tonConfigCell)
    asset_config_collection.storeCell(randomAddress('usdt').hash, usdtConfigCell)

    const tx = await contract.sendInternalMessage(
      internalMessage({
        value: toNano(0),
        from: randomAddress('admin'),
        body: beginCell()
          .storeUint(op.update_config, 32)
          .storeUint(0, 64)
          .storeRef(asset_config_collection.endCell())
          .endCell(),
      }) as any
    );

    console.log(tx.type);
    console.log(tx.debugLogs);
    console.log(tx.gas_consumed);
  });
});



describe("evaa user sc tests", () => {
  let contract: SmartContract;

  beforeEach(async () => {
    const user_principals = beginDict(256);

    const usdtPositionPrincipal = beginCell()
      .storeUint(0, 64)
      .endCell()

    const tonPositionPrincipal = beginCell()
      .storeUint(1, 64)
      .endCell()

    user_principals.storeCell(randomAddress('ton').hash, usdtPositionPrincipal)
    user_principals.storeCell(randomAddress('usdt').hash, tonPositionPrincipal)

    contract = await SmartContract.fromCell(
      Cell.fromBoc(userHex)[0] as any, // code cell from build output
      beginCell()
        .storeAddress(randomAddress('master'))
        .storeAddress(randomAddress('user'))
        .storeRef(user_principals.endCell())
        .endCell(),
      {
        debug: true,
      }
    );

    const init_master = await contract.sendInternalMessage(
      internalMessage({
        value: toNano(0),
        from: randomAddress('master'),
        body: beginCell() //todo
          .endCell(),
      }) as any
    );

    console.log(init_master.debugLogs);
    console.log(init_master.gas_consumed);
  });

  it("user run get method", async () => {
    const tx = await contract.invokeGetMethod('test', []);

    console.log(tx.result[0]);
    console.log(tx.type);
    console.log(tx.exit_code);
    console.log(tx.debugLogs);
    console.log(tx.gas_consumed);
  });
});
