import { Address, beginCell, Builder, Dictionary, Slice } from "ton-core";

import { customBuilder } from "./CustomBuilder.js";


export type AssetConfig = {
	oracle: Address,
	decimals: number,

	collateralFactor: number,
	liquidationThreshold: number,

	liquidationPenalty: number | bigint,
	baseBorrowRate: number | bigint,
	borrowRateSlopeLow: number | bigint,
	borrowRateSlopeHigh: number | bigint,
	supplyRateSlopeLow: number | bigint,
	supplyRateSlopeHigh: number | bigint,
	targetUtilization: number | bigint,
}

export const emptyConfigCollection = () => Dictionary.empty(Dictionary.Keys.BigUint(256), {
	serialize: (src: AssetConfig, buidler: Builder) => {
		console.log(src)
		buidler.storeAddress(src.oracle);
		buidler.storeUint(src.decimals, 8);

		const refBuild = customBuilder();
		// TODO: these all has to be encapsulated of course
		refBuild.storeUint(src.collateralFactor, 16);
		refBuild.storeUint(src.liquidationThreshold, 16);
		refBuild.storeUint(src.liquidationPenalty, 16);
		refBuild.storeUint(src.baseBorrowRate, 64);
		refBuild.storeUint(src.borrowRateSlopeLow, 64);
		refBuild.storeUint(src.borrowRateSlopeHigh, 64);
		refBuild.storeUint(src.supplyRateSlopeLow, 64);
		refBuild.storeUint(src.supplyRateSlopeHigh, 64);
		refBuild.storeUint(src.targetUtilization, 64);

		buidler.storeRef(refBuild.endCell());
	},
	parse: (sc: Slice) => {
		throw new Error('Not implemented');
	},
});
