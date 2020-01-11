import { addVector } from "./vector.js";

const svgns = "http://www.w3.org/2000/svg";

//we add the stroke width to keep things in bounds
export function renderPolyList(polygonList, stroke = "black", strokeWidth = 1, fill = "none", height = 720, width = 1280){
	const svg = document.createElementNS(svgns, "svg");
	svg.setAttributeNS(null, "height", height + strokeWidth * 2);
	svg.setAttributeNS(null, "width", width + strokeWidth * 2);
	const path = document.createElementNS(svgns, "path");

	const instructions = polygonList
		.map(poly => poly
			.map(v => addVector(v, [1, 1, 0])) //screen offset 
			.map(v => [v[0] * 0.5 * width, v[1] * 0.5 * height])) //scale to screen
		.map(([first, ...rest]) => `M${first[0]} ${first[1]} ${rest.map(v => `L${v[0]} ${v[1]}`).join(" ")} Z`) //toInstruction
		.join(" ");

	path.setAttributeNS(null, "d", instructions);
	path.setAttributeNS(null, "fill", fill);
	path.setAttributeNS(null, "stroke", stroke);
	path.setAttributeNS(null, "stroke-width", strokeWidth);
	svg.appendChild(path);
	return svg;
}

//we add the stroke width to keep things in bounds
export function renderShadedPolyList(polygonList, stroke = "black", strokeWidth = 1, fills = [], height = 720, width = 1280) {
	const svg = document.createElementNS(svgns, "svg");
	const docFrag = document.createDocumentFragment();
	svg.setAttributeNS(null, "height", height + strokeWidth * 2);
	svg.setAttributeNS(null, "width", width + strokeWidth * 2);

	polygonList
		.forEach(([first, ...rest], i) => {
			const path = document.createElementNS(svgns, "path");
			path.setAttributeNS(null, "d", `M${first[0]} ${first[1]} ${rest.map(v => `L${v[0]} ${v[1]}`).join(" ")} Z`);
			const currentFill = fills[i] || null;
			if(currentFill !== null){
				path.setAttributeNS(null, "fill", currentFill); 
			}
			path.setAttributeNS(null, "stroke", stroke);
			path.setAttributeNS(null, "stroke-width", strokeWidth);
			docFrag.appendChild(path);
		});

	svg.appendChild(docFrag);

	return svg;
}