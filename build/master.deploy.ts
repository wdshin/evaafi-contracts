import { beginDict, Cell, Address, beginCell, toNano, TupleSlice, WalletContract } from "ton";
import { sendInternalMessageWithWallet } from "../test/utils";
import { getUSDTWallet, logs, principals_parse, reserves_parse, rates_parse, hex2a, asset_config_parse, asset_dynamics_parse, internalMessage, randomAddress, tonConfigCell, asset_config_collection_packed_dict, asset_dynamics_collection_packed_dict, user_principals_packed_dict } from "../test/utils";
import { hex as userHex } from "./user.compiled.json";
import { contractAddress } from "ton";
import { masterCodeCell, userCodeCell } from "../test/SmartContractsCells";
import { op } from "../test/OpCodes";
import { packMasterData } from "../test/MasterData";

const admin = Address.parseFriendly('EQDEckMP_6hTVhBLcsdMYmPDm6bLGYOTCkhqP7QrBg-1KaaD').address

export function initData() {
  return packMasterData(userCodeCell, admin)
}

// const convertedAddress = Address.parseFriendly('EQAEhbzes0dtFwVAu-m07-7sz6Rnz7jrZ-w3K3_BZbawskXl').address.toFriendly({ urlSafe: true, bounceable: false })

export const initMessage = async () => {
  const userContractAddress = contractAddress({
    workchain: 0,
    initialCode: masterCodeCell,
    initialData: packMasterData(userCodeCell, admin),
  });

  let usdt = (await getUSDTWallet(userContractAddress)) as Address

  return beginCell()
    .storeUint(op.init_master, 32)
    .storeUint(0, 64)
    .storeRef(asset_config_collection_packed_dict(usdt))
    .storeRef(asset_dynamics_collection_packed_dict(usdt, true))
    .endCell();
}

// optional end-to-end sanity test for the actual on-chain contract to see it is actually working on-chain
export async function postDeployTest(walletContract: WalletContract, secretKey: Buffer, contractAddress: Address) {
  console.log('done')
  // const call = await walletContract.client.callGetMethod(contractAddress, "counter");
  // const counter = new TupleSlice(call.stack).readBigNumber();
  // console.log(`   # Getter 'counter' = ${counter.toString()}`);
  //
  // const message = beginCell().endCell();
  // await sendInternalMessageWithWallet({ walletContract, secretKey, to: contractAddress, value: toNano(0.02), body: message });
  // console.log(`   # Sent 'increment' op message`);
  //
  // const call2 = await walletContract.client.callGetMethod(contractAddress, "counter");
  // const counter2 = new TupleSlice(call2.stack).readBigNumber();
  // console.log(`   # Getter 'counter' = ${counter2.toString()}`);
}
