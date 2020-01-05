export function parseColor(str) {
	const ctx = document.createElement("canvas").getContext("2d");
	ctx.fillStyle = str;
	return hexStringToColor(ctx.fillStyle);
}

export function hexStringToColor(hexString) {
	const hex = hexString.substr(1);
	return [
		parseInt(hex.substring(0, 2), 16),
		parseInt(hex.substring(2, 4), 16),
		parseInt(hex.substring(4, 6), 16),
		parseInt(hex.substring(6, 8), 16)
	];
}