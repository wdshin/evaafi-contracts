import { Address, beginCell, Builder, Cell, Dictionary, Slice, StateInit, storeStateInit, toNano } from "ton";
import { Blockchain, SandboxContract, TreasuryContract } from "@ton-community/sandbox";

import { masterCodeCell, userCodeCell } from "./SmartContractsCells.js";
import { packMasterData } from "./MasterData.js";
import { packInitMasterMessage } from "./InitMasterMessage.js";
import { emptyConfigCollection } from "./AssetConfigCollection.js";
import { emptyDynamicsCollection } from "./AssetDynamicsCollection.js";
import { tonAssetId } from "./Constants.js";
import { bufferToBigInt } from "./common.js";
import { customBuilder } from "./CustomBuilder.js";
import { op } from "./OpCodes.js";
import { JettonSendTonAttachment, packTransferNotification } from "./Jetton.js";


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
bc.now = 10000;
bc.verbosity = {
	debugLogs: false,
	blockchainLogs: false,
	print: true,
	vmLogs: "none",
};


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
	sRate: 10**12, // 1000000000000000000n, // TODO: re-think-through s/b-rate scale
	bRate: 10**12, // 1000000000000000000n,
	totalSupplyPrincipal: 0,
	totalBorrowPrincipal: 0,
	lastAccural: bc.now,
	balance: 0,
});
dynamicsCollection.set(USDCAssetId, {
	price: 1000000000,
	sRate: 10**12, // 1000000000000000000n,
	bRate: 10**12, // 1000000000000000000n,
	totalSupplyPrincipal: 0,
	totalBorrowPrincipal: 0,
	lastAccural: bc.now,
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
const master = await bc.getContract(masterAddress);



console.log(`Lending master address:`, masterAddress);



async function supplyTON(
	owner: SandboxContract<TreasuryContract>,
	nanoTonAmount: bigint
) {
	const result = await owner.send({
		to: masterAddress,
		value: nanoTonAmount,
		bounce: true,
		sendMode: 1,
	});
	return result;
}

async function supplyJetton(
	owner: SandboxContract<TreasuryContract>,
	lendingJettonWallet: SandboxContract<TreasuryContract>,
	amount: number | bigint,
) {
	const result = await lendingJettonWallet.send({
		to: masterAddress,
		value: JettonSendTonAttachment,
		bounce: true,
		body: packTransferNotification(34343, amount, owner.address),
		sendMode: 1,
	});
	return result;
}

async function withdraw(
	owner: SandboxContract<TreasuryContract>,
	assetId: bigint, amountToWithdraw: number | bigint
) {
	const result = await owner.send({
		to: masterAddress,
		value: BigInt(8 * 10**7), // ??? How much for network fees
		bounce: true,
		body: customBuilder()
			.storeOpCode(op.withdraw_master)
			.storeQueryId(59595)
			.storeAssetId(assetId)
			.storeAmount(amountToWithdraw)
			.endCell(), /// TODO: refactor
		sendMode: 1,
	});
	return result;
}

async function balanceOf(assetId: bigint) {
	const balanceResult = master.get(
		'get_asset_balance',
		[{ type: 'int', value: assetId }],
	);
	if (balanceResult.exitCode !== 0 &&
		balanceResult.exitCode !== 1) {
		throw new Error(`Can't get asset balance of "${assetId}"`);
	}

	const balance = balanceResult.stackReader.readBigNumber();
	if (balanceResult.stackReader.remaining !== 0) {
		throw new Error(`get_asset_balance return stack has more than one element for some reason (assetId: ${assetId})`);
	}

	return balance;
}




if (false) {
	const owner1Balances = [];
	owner1Balances.push(await owner1.getBalance());


	console.log(`Trying to supply some TON`);
	const supplyResult1 = await supplyTON(owner1, toNano(50));
	owner1Balances.push(await owner1.getBalance());
	// console.log(`Sup 1:`, supplyResult1);

	const supplyResult2 = await supplyTON(owner2, toNano(20));
	// console.log(`Sup 2:`, supplyResult2);

	console.log(`Trying to supply some USDC`);
	const supplyUSDCResult = await supplyJetton(owner1, masterUSDCWallet, 300 * 10**6);
	console.log(`Sup 1 USDC:`, supplyUSDCResult);

	const tonBalanceSup = master.get(
		'get_asset_balance',
		[{ type: 'int', value: tonAssetId }],
	);
	console.log(`Sup TON balance:`, tonBalanceSup.stack);
	const usdcBalanceSup = master.get(
		'get_asset_balance',
		[{ type: 'int', value: USDCAssetId }],
	);
	console.log(`Sup USDC balance:`, usdcBalanceSup.stack);

	const withdrawResult1 = await withdraw(owner1, tonAssetId, toNano(40));
	console.log(withdrawResult1);
	owner1Balances.push(await owner1.getBalance());


	const tonBalanceWith = master.get(
		'get_asset_balance',
		[{ type: 'int', value: tonAssetId }],
	);
	console.log(`With TON balance:`, tonBalanceWith.stack);

	console.log(`Owner1 balances:`, owner1Balances);
}

{
	bc.verbosity = {
		debugLogs: false,
		blockchainLogs: false,
		print: true,
		vmLogs: "none",
	};

	console.log(`Supplying 200 USDC`);
	const sup1_1result = await supplyJetton(owner1, masterUSDCWallet, 200 * 10**6);
	console.log(sup1_1result.events);

	const usdcBalance1 = await balanceOf(USDCAssetId);
	console.log(`USDC balance:`, usdcBalance1);

	console.log(`Supplying 500 USDC`)
	const sup1_2result = await supplyJetton(owner1, masterUSDCWallet, 500 * 10**6);
	console.log(sup1_2result.events);

	const usdcBalance2 = await balanceOf(USDCAssetId);
	console.log(`USDC balance:`, usdcBalance2);

	console.log(`Withdrawing 300 USDC`);
	const with1_1result = await withdraw(owner1, USDCAssetId, 300 * 10**6);
	console.log(with1_1result.events);

	const usdcBalance3 = await balanceOf(USDCAssetId);
	console.log(`USDC balance:`, usdcBalance3);
	
	console.log(`Withdrawing 450 USDC`);
	const with1_2result = await withdraw(owner1, USDCAssetId, 450 * 10**6);
	console.log(with1_2result.events);
	
	const usdcBalance4 = await balanceOf(USDCAssetId);
	console.log(`USDC balance:`, usdcBalance4);

	console.log(`Withdrawing 350 USDC`);
	const with1_3result = await withdraw(owner1, USDCAssetId, 350 * 10**6);
	console.log(with1_3result.events);

	const usdcBalance5 = await balanceOf(USDCAssetId);
	console.log(`USDC balance:`, usdcBalance5);
}

// supply(Bob, usdc, 400000000);
// advanceTime(10000);

// withdraw(Bob, ton, 20000000000);
// //should fail since undercollaterized

// advanceTime(10000);
// supply(Alice, ton, 10000000000);
// advanceTime(10000);
// withdraw(Alice, usdc, 50000000);
// advanceTime(10000);
// supply(Chad, ton, 15000000000);
// advanceTime(10000);
// supply(Chad, usdc, 200000000);
// advanceTime(10000);
// withdraw(Alice, usdc, 100000000);
// advanceTime(10000);
// withdraw(Chad, usdc, 300000000);
// advanceTime(10000);
// withdraw(Bob, usdc, 200000000);
// //should fail due to lack of liquidity on master
// advanceTime(10000);
// supply(Alice, usdc, 150000000);
// advanceTime(10000);
// supply(Chad, usdc, 100000000);
// advanceTime(10000);
// withdraw(Bob, usdc, 400000000);
// advanceTime(10000);
// withdraw(Alice, ton, 10000000000);
// //should fail since undercollaterized
// advanceTime(10000);
// withdraw(Chad, ton, 15000000000);


// async function supplyJetton(owner: SandboxContract<TreasuryContract>) {
// 	owner.
// }

// async function withdraw() {

// }

// function principalOf() {

// }

console.log('Finished');
