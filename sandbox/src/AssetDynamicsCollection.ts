import { Address, beginCell, Builder, Dictionary, Slice } from "ton-core";

import { customBuilder } from "./CustomBuilder.js";


export type AssetDynamics = {
	price: number | bigint,
	sRate: number | bigint,
	bRate: number | bigint,
	totalSupplyPrincipal: number | bigint,
	totalBorrowPrincipal: number | bigint,
	lastAccural: number | bigint,
	balance: number | bigint,
};

export const emptyDynamicsCollection = () => Dictionary.empty(Dictionary.Keys.BigUint(256), {
	serialize: (src: AssetDynamics, builder: Builder) => {
		builder.storeBuilder(
			customBuilder()
			.storePrice(src.price)
			.storeSBrate(src.sRate)
			.storeSBrate(src.bRate)
			.storePrincipal(src.totalSupplyPrincipal)
			.storePrincipal(src.totalBorrowPrincipal)
			.storeTimestamp(src.lastAccural)
			.storeBalance(src.balance)
		);
	},
	parse: (sc: Slice) => {
		throw new Error('Not implemented');
	},
});
