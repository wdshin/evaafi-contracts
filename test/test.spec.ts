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
    console.log('------1')
    contract = await SmartContract.fromCell(
      Cell.fromBoc(hex)[0] as any, // code cell from build output
      beginCell()
        // .storeAddress(randomAddress("admin"))
        // .storeAddress(randomAddress("owner"))
        // .storeRef(beginCell().storeBuffer(new Buffer('')).endCell())
        // .storeRef(beginCell().endCell())
        // .storeRef(beginCell().endCell())
        .endCell(),
      {
        debug: true,
      }
    );
  });

  const nullifier = genRand('nullifier');
  const note = genRand('note');

  //  int op = in_msg_body~load_uint(32); 
  //  ;;TODO send to swap (to wTON) if its TON
  //  if (op == op::transfer_notification()) {
  //    ;; IF we recived JETTONs then parse jetton notification data
  //    int query_id = in_msg_body~load_uint(64); 
  //    int coins = in_msg_body~load_coins(); 
  //    int query_id = in_msg_body~load_uint(64); 
  //    int from_address = in_msg_body~load_msg_addr(); 
  //    int jetton_msg_body = in_msg_body~load_ref(); 
  //    int op_jetton = jetton_msg_body~load_uint(32); 
  //    int query_id_jetton = jetton_msg_body~load_uint(64); 
  //    int jetton_token_id = jetton_msg_body~load_uint(32); 
  // if (op_jetton == op:: lend()){

  it("test getters", async () => {
    let mnemonics = await mnemonicNew();
    let keyPair = await mnemonicToPrivateKey(mnemonics);
    const add = new Address(0, keyPair.publicKey);
    console.log(add.toString()
    )
    console.log('------2')
    const sendIncrement = await contract.invokeGetMethod('test', []);
    // const sendIncremenat = await contract.invokeGetMethod('updateFrontVariables', [{
    //   type: 'cell_slice',
    //   value: beginCell().storeAddress(add).endCell().toBoc({ idx: false }).toString('base64')
    // }]);
    console.log(beginCell().storeAddress(add).endCell().toBoc({ idx: false }).toString('base64')
    )
    console.log('------')
    console.log(sendIncrement.result[0]?.toString());
    console.log(sendIncrement.debugLogs);
    console.log(sendIncrement.gas_consumed);
    console.log('------')
  });
});

