import { Address, beginCell, Builder, Cell, Dictionary, Slice, StateInit, storeStateInit, toNano } from "ton";
import { Blockchain, SandboxContract, TreasuryContract } from "@ton-community/sandbox";

import { masterCodeCell, userCodeCell } from "./SmartContractsCells.js";
import { packMasterData } from "./MasterData.js";
import { packInitMasterMessage } from "./InitMasterMessage.js";
import { emptyConfigCollection } from "./AssetConfigCollection.js";
import { emptyDynamicsCollection } from "./AssetDynamicsCollection.js";
import { tonAssetId } from "./Constants.js";
import { bufferToBigInt } from "./common.js";


console.log('It starts at least');


async function deploy(
	from: SandboxContract<TreasuryContract>,
	nanoTonAttached: bigint,
	code: Cell, data: Cell,
	body: Cell,
) {
	const stateInit: StateInit = { code, data };

	const stateInitBuilder = new Builder();
	storeStateInit(stateInit)(stateInitBuilder);
	const hash = stateInitBuilder.asCell().hash();
	const address = new Address(0, hash);

	const result = await from.send({
		to: address,
		value: nanoTonAttached,
		bounce: false,
		body,
		init: { code: masterCodeCell, data: masterInitData },
		sendMode: 1,
	});

	return result;
}


const bc = await Blockchain.create();

const admin = await bc.treasury('admin', { balance: toNano(10)});

const TONOracle = await bc.treasury('TON oracle');
const USDCOracle = await bc.treasury('USDC oracle');

const masterUSDCWallet = await bc.treasury('Master USDC wallet');
const USDCAssetId = bufferToBigInt(masterUSDCWallet.address.hash);

const ja = await bc.treasury('jetton A');
const jb = await bc.treasury('jetton B');

const owner1 = await bc.treasury('owner1', { balance: toNano(1000) });
const owner2 = await bc.treasury('owner2', { balance: toNano(2000) });



const masterInitData = packMasterData(admin.address);

const configCollection = emptyConfigCollection();
configCollection.set(tonAssetId, {
	oracle: TONOracle.address,
	decimals: 8,

	collateralFactor: 8000,
	liquidationThreshold: 8200,

	liquidationPenalty: 300,
	baseBorrowRate: 0,
	borrowRateSlopeLow: 0,
	borrowRateSlopeHigh: 0,
	supplyRateSlopeLow: 0,
	supplyRateSlopeHigh: 0,
	targetUtilization: 800000000000000000n,
});
configCollection.set(USDCAssetId, {
	oracle: USDCOracle.address,
	decimals: 6,

	collateralFactor: 8000,
	liquidationThreshold: 8200,

	liquidationPenalty: 300,
	baseBorrowRate: 100000000000,
	borrowRateSlopeLow: 40000000000,
	borrowRateSlopeHigh: 80000000000,
	supplyRateSlopeLow: 20000000000,
	supplyRateSlopeHigh: 40000000000,
	targetUtilization: 800000000000000000n,
});


const dynamicsCollection = emptyDynamicsCollection();
dynamicsCollection.set(tonAssetId, {
	price: 2000000000,
	sRate: 1000000000000000000,
	bRate: 1000000000000000000,
	totalSupplyPrincipal: 0,
	totalBorrowPrincipal: 0,
	lastAccural: 0,
	balance: 0,
});
dynamicsCollection.set(USDCAssetId, {
	price: 1000000000,
	sRate: 1000000000000000000,
	bRate: 1000000000000000000,
	totalSupplyPrincipal: 0,
	totalBorrowPrincipal: 0,
	lastAccural: 0,
	balance: 0,
});



const deployResult = await deploy(
	admin, toNano(2),
	masterCodeCell, masterInitData,
	packInitMasterMessage(configCollection, dynamicsCollection),
);
console.log(deployResult);
const deployedEvents = deployResult.events.filter(e => e.type === 'account_created');
if (deployedEvents.length !== 1) {
	throw new Error(`Expected exactly 1 account_created event, got ${deployedEvents.length}`);
}
const deployedEvent = deployedEvents[0];
if (deployedEvent.type !== 'account_created') {
	throw 'Impossible';
}
const masterAddress = deployedEvent.account;

console.log(`Lending master address:`, masterAddress);



async function supplyTON(owner: SandboxContract<TreasuryContract>, nanoTonAmount: number | bigint) {
	const result = await owner.send({
		to: masterAddress,
		value: toNano(5),
		bounce: true,
		sendMode: 1,
	});
	return result;
}


console.log(`Trying to supply some TON`);
const supplyResult1 = await supplyTON(owner1, toNano(50));
console.log(`Sup 1:`, supplyResult1);
const supplyResult2 = await supplyTON(owner2, toNano(200));
console.log(`Sup 2:`, supplyResult2);

// async function supplyJetton(owner: SandboxContract<TreasuryContract>) {
// 	owner.
// }

// async function withdraw() {

// }

// function principalOf() {

// }

console.log('Finished');
