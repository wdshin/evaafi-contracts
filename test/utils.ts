import BN from "bn.js";
import { beginCell, beginDict, Address, Cell, CellMessage, InternalMessage, CommonMessageInfo, WalletContract, SendMode, Wallet } from "ton";
import { SmartContract } from "ton-contract-executor";
import Prando from "prando";

export const zeroAddress = new Address(0, Buffer.alloc(32, 0));

export const op = { // todo
  transfer_notification: 0x7362d09c,
  init_master: 1,
  init_user: 2,
  update_price: 3,
  update_config: 4,
  supply: 5,
  withdrawal: 6,
  liquidate: 7,
}

export function randomAddress(seed: string, workchain?: number) {
  const random = new Prando(seed);
  const hash = Buffer.alloc(32);
  for (let i = 0; i < hash.length; i++) {
    hash[i] = random.nextInt(0, 256);
  }
  return new Address(workchain ?? 0, hash);
}

// used with ton-contract-executor (unit tests) to sendInternalMessage easily
export function internalMessage(params: { from?: Address; to?: Address; value?: BN; bounce?: boolean; body?: Cell }) {
  const message = params.body ? new CellMessage(params.body) : undefined;
  return new InternalMessage({
    from: params.from ?? randomAddress("sender"),
    to: params.to ?? zeroAddress,
    value: params.value ?? 0,
    bounce: params.bounce ?? true,
    body: new CommonMessageInfo({ body: message }),
  });
}

// temp fix until ton-contract-executor (unit tests) remembers c7 value between calls
export function setBalance(contract: SmartContract, balance: BN) {
  contract.setC7Config({
    balance: balance.toNumber(),
  });
}

// helper for end-to-end on-chain tests (normally post deploy) to allow sending InternalMessages to contracts using a wallet
export async function sendInternalMessageWithWallet(params: { walletContract: WalletContract; secretKey: Buffer; to: Address; value: BN; bounce?: boolean; body?: Cell }) {
  const message = params.body ? new CellMessage(params.body) : undefined;
  const seqno = await params.walletContract.getSeqNo();
  const transfer = params.walletContract.createTransfer({
    secretKey: params.secretKey,
    seqno: seqno,
    sendMode: SendMode.PAY_GAS_SEPARATLY + SendMode.IGNORE_ERRORS,
    order: new InternalMessage({
      to: params.to,
      value: params.value,
      bounce: params.bounce ?? false,
      body: new CommonMessageInfo({
        body: message,
      }),
    }),
  });
  await params.walletContract.client.sendExternalMessage(params.walletContract, transfer);
  for (let attempt = 0; attempt < 10; attempt++) {
    await sleep(2000);
    const seqnoAfter = await params.walletContract.getSeqNo();
    if (seqnoAfter > seqno) return;
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const logs = (tx: any) => {
  console.log('--------------')
  console.log(tx.debugLogs);
  console.log(tx.result);
  console.log(tx.type);
  console.log(tx.exit_code);
  console.log(tx.gas_consumed);
  console.log('--------------')
}

const asset_dynamics_collection = beginDict(256);
const asset_config_collection = beginDict(256);

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
  .storeUint(500000000, 64) //todo
  .storeUint(400000000, 64)//todo
  .storeUint((new Date()).getTime() * 1000, 64)
  .storeUint(100000000, 64)
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

const user_principals = beginDict(256);

const usdtPositionPrincipal = beginCell()
  .storeInt(-200 * 100000000, 64)
  .endCell()

const tonPositionPrincipal = beginCell()
  .storeInt(180 * 10000000000, 64)
  .endCell()

user_principals.storeCell(randomAddress('ton').hash, usdtPositionPrincipal)
user_principals.storeCell(randomAddress('usdt').hash, tonPositionPrincipal)

export const user_principals_packed_dict = user_principals.endCell()
export const asset_config_collection_packed_dict = asset_config_collection.endCell()
export const asset_dynamics_collection_packed_dict = asset_dynamics_collection.endCell()

