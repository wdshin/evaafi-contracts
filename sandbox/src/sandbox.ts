import { Address, beginCell, Builder, Cell, StateInit, storeStateInit, toNano } from "ton";
import { Blockchain, SandboxContract, TreasuryContract } from "@ton-community/sandbox";

import { masterCodeCell, userCodeCell } from "./SmartContractsCells.js";
import { packMasterData } from "./MasterData.js";


console.log('It starts at least');


async function deploy(from: SandboxContract<TreasuryContract>, nanoTonAttached: bigint, code: Cell, data: Cell) {
	const stateInit: StateInit = { code, data };

	const stateInitBuilder = new Builder();
	storeStateInit(stateInit)(stateInitBuilder);
	const hash = stateInitBuilder.asCell().hash();
	const address = new Address(0, hash);

	const result = await from.send({
		to: address,
		value: nanoTonAttached,
		bounce: false,
		body: beginCell().endCell(),
		init: { code: masterCodeCell, data: masterInitData },
		sendMode: 1,
	});

	return result;
}


const bc = await Blockchain.create();

const admin = await bc.treasury('admin', { balance: toNano(10)});

const ja = await bc.treasury('jetton A');
const jb = await bc.treasury('jetton B');

const owner1 = await bc.treasury('owner1');
const owner2 = await bc.treasury('owner2');



const masterInitData = packMasterData(admin.address);

const deployResult = await deploy(admin, toNano(2), masterCodeCell, masterInitData);
console.log(deployResult);



// async function supplyJetton(owner: SandboxContract<TreasuryContract>) {
// 	owner.
// }

// async function withdraw() {

// }

// function principalOf() {

// }

console.log('Finished');
