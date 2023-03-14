import { beginDict, Cell, Address, beginCell, toNano, TupleSlice, WalletContract } from "ton";
import { op, logs, principals_parse, reserves_parse, rates_parse, hex2a, asset_config_parse, asset_dynamics_parse, internalMessage, randomAddress, tonConfigCell, asset_config_collection_packed_dict, asset_dynamics_collection_packed_dict, user_principals_packed_dict } from "./utils";
import { sendInternalMessageWithWallet } from "../test/utils";
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
    .storeAddress(randomAddress('master'))
    .storeAddress(randomAddress('user'))
    .storeDict(beginDict(256).endDict())
    .endCell()
}

// return the op that should be sent to the contract on deployment, can be "null" to send an empty message
export function initMessage() {
  return beginCell()
    .storeUint(op.init_user, 32)
    .storeUint(0, 64)
    .storeDict(user_principals_packed_dict)
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
