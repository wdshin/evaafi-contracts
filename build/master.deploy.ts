import { beginDict, Cell, Address, beginCell, toNano, TupleSlice, WalletContract } from "ton";
import { sendInternalMessageWithWallet } from "../test/utils";
import { op, logs, principals_parse, reserves_parse, rates_parse, hex2a, asset_config_parse, asset_dynamics_parse, internalMessage, randomAddress, tonConfigCell, asset_config_collection_packed_dict, asset_dynamics_collection_packed_dict, user_principals_packed_dict } from "../test/utils";
import { hex as userHex } from "./user.compiled.json";
import BN from "bn.js";
import { TonClient, contractAddress } from "ton";
import { masterCodeCell, userCodeCell } from "../test/SmartContractsCells";

import { packMasterData } from "../test/MasterData";

const getUSDTWallet = async (address: Address) => {
  const jettonWalletAddressMain = 'EQDLqyBI-LPJZy-s2zEZFQMyF9AU-0DxDDSXc2fA-YXCJIIq' // todo calculate jeton wallet 

  const client = new TonClient({
    endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
    apiKey: "49d23d98ab44004b72a7be071d615ea069bde3fbdb395a958d4dfcb4e5475f54",
  });
  const cell = new Cell();
  cell.bits.writeAddress(address);

  const cellBoc = (cell.toBoc({ idx: false })).toString('base64');

  const { stack } = await client.callGetMethod(
    Address.parse(jettonWalletAddressMain),
    'get_wallet_address',
    [['tvm.Slice', cellBoc]]
  )
  return beginCell().storeBuffer(new Buffer(stack[0][1].object.data.b64, 'base64')).endCell().beginParse().readAddress()
}

let usdt = randomAddress('')
// return the init Cell of the contract storage (according to load_data() contract method)
export function initData() {
  return beginCell()
    .storeRef(beginCell().storeBuffer(new Buffer('1Evaa main testnet pool.')).endCell())
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
export const initMessage = async () => {

  const userContractAddress = contractAddress({
    workchain: 0,
    initialCode: masterCodeCell,
    initialData: packMasterData(userCodeCell, randomAddress('admin')),
  });

  usdt = (await getUSDTWallet(userContractAddress)) as Address
  const to_master = beginDict(256);
  to_master.storeCell(randomAddress('ton').hash, tonConfigCell)
  console.log(usdt.toString())

  return beginCell()
    .storeUint(1, 32)
    .storeUint(0, 64)
    .storeRef(asset_config_collection_packed_dict(usdt))
    .storeRef(asset_dynamics_collection_packed_dict(usdt))
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
