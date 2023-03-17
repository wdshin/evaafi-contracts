export function bufferToBigInt(buffer: Buffer): bigint {
	const bufferHex = buffer.toString('hex');
	// Seems stupid to have string as an intermediate step
	return BigInt('0x' + bufferHex);
}
