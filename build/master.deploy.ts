import { beginDict, Cell, Address, beginCell, toNano, TupleSlice, WalletContract } from "ton";
import { randomAddress, sendInternalMessageWithWallet } from "../test/utils";
import { hex as userHex } from "./user.compiled.json";
import BN from "bn.js";

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

// return the init Cell of the contract storage (according to load_data() contract method)
export function initData() {
  return beginCell()
    .storeRef(beginCell().storeBuffer(new Buffer('Main evaa pool.')).endCell())
    .storeRef(Cell.fromBoc(userHex)[0])
    .storeRef(beginCell()
      .storeDict(beginDict(256).endDict())
      .storeInt(-1, 8)
      .storeAddress(randomAddress('admin'))
      .storeDict(beginDict(256).endDict())
      .endCell())
    .storeDict(beginDict(256).endDict())
    .endCell()
}

// return the op that should be sent to the contract on deployment, can be "null" to send an empty message
export function initMessage() {

  const asset_data = beginDict(256);
  const asset_config = beginDict(256);

  const tonDataCell = beginCell()
    .storeUint(2000000000, 64)
    .storeUint(new BN("DE253E29D831800", 'hex'), 64)
    .storeUint(new BN("DE31F56D48C6000", 'hex'), 64)
    .storeUint(40000000000, 64)
    .storeUint(35000000000, 64)
    .storeUint((new Date()).getTime() * 1000, 64)
    .storeUint(10000000000, 64)
    .endCell()

  const usdtDataCell = beginCell()
    .storeUint(1000000000, 64)
    .storeUint(new BN("DE1311304585C00", 'hex'), 64)
    .storeUint(new BN("DE23FB1C665E800", 'hex'), 64)
    .storeUint(500000000, 64)
    .storeUint(400000000, 64)
    .storeUint((new Date()).getTime() * 1000, 64)
    .storeUint(100000000, 64)
    .endCell()

  asset_data.storeCell(randomAddress('ton').hash, tonDataCell)
  asset_data.storeCell(randomAddress('usdt').hash, usdtDataCell)

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

  asset_config.storeCell(randomAddress('ton').hash, tonConfigCell)
  asset_config.storeCell(randomAddress('usdt').hash, usdtConfigCell)

  const to_master = beginDict(256);
  to_master.storeCell(randomAddress('ton').hash, tonConfigCell)
  return beginCell()
    .storeUint(op.init_master, 32)
    .storeUint(0, 64)
    .storeRef(asset_config.endCell())
    .storeRef(asset_data.endCell())
    .endCell();
}

// optional end-to-end sanity test for the actual on-chain contract to see it is actually working on-chain
export async function postDeployTest(walletContract: WalletContract, secretKey: Buffer, contractAddress: Address) {
  const call = await walletContract.client.callGetMethod(contractAddress, "counter");
  const counter = new TupleSlice(call.stack).readBigNumber();
  console.log(`   # Getter 'counter' = ${counter.toString()}`);

  const message = beginCell().endCell();
  await sendInternalMessageWithWallet({ walletContract, secretKey, to: contractAddress, value: toNano(0.02), body: message });
  console.log(`   # Sent 'increment' op message`);

  const call2 = await walletContract.client.callGetMethod(contractAddress, "counter");
  const counter2 = new TupleSlice(call2.stack).readBigNumber();
  console.log(`   # Getter 'counter' = ${counter2.toString()}`);
}
