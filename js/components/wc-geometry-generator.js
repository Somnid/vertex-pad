import { renderShadedPolyList } from "../lib/svg-3d.js";
import { fireEvent } from "../lib/utilities.js";
import { parseColor } from "../lib/color.js";
import { getProjectionMatrix, getRotationXMatrix, getRotationYMatrix, getRotationZMatrix, multiplyMatrixVector, addVector, subtractVector, crossVector, normalizeVector, dotVector, multiplyVector, divideVector, getIdentityMatrix, multiplyMatrix, getTranslationMatrix, getLookAtMatrix, UP, FORWARD } from "../lib/vector.js";
import { cube } from "../data/geometry.js";

customElements.define("wc-geometry-generator",
	class extends HTMLElement {
		constructor() {
			super();
			this.bind(this);
		}
		bind(element) {
			element.attachEvents = element.attachEvents.bind(element);
			element.onKeyPress = element.onKeyPress.bind(element);
			element.render = element.render.bind(element);
			element.cacheDom = element.cacheDom.bind(element);
			element.generate = element.generate.bind(element);
			element.finish = element.finish.bind(element);
		}
		connectedCallback() {
			this.render();
			this.cacheDom();
			this.attachEvents();
			this.generate();
		}
		render() {
			this.attachShadow({ mode: "open" });
			this.shadowRoot.innerHTML = `
				<link rel="stylesheet" href="css/system.css">
				<style>
					:host { display: grid; grid-template-columns: [form] 300px [output] auto; }
					fieldset { padding: 0px; margin-bottom: 0.5rem; }
					#form { grid-column: form; }
					#output { grid-column: output; }
					#finish { display: var(--finish-display, block); }
					.button-container { display: flex; }
					svg { background: white; border: 1px solid #ccc; background-image: var(--checker); background-size:20px 20px; }
					.description { font-size: 0.8rem; }
					textarea { white-space: pre; tab-size: 4; width: 100%; }
				</style>
				<div id="form">
					<fieldset>
						<label for="faces">Faces:</label>
						<span class="description">A list of faces. Each face is a list of vertices, each vertex is a list of x, y, z</span>
						<!-- Ecample is: Front, Right, Back, Left, Top, Bottom -->
						<textarea id="faces">${JSON.stringify(cube, null, 4)}</textarea>
					</fieldset>
					<fieldset>
						<label for="fill">Fills:</label>
						<span class="description">A JSON array of colors for each face</span>
						<input id="fill" value='["red", "green", "blue", "magenta", "yellow", "cyan"]' />
					</fieldset>
					<fieldset>
						<h2>Render Settings</h2>
						<label for="perspective">Perspective</label>
						<input id="perspective" type="checkbox" checked />
						<label for="backface-culling">Backface Culling</label>
						<input id="backface-culling" type="checkbox" checked />
						<label for="lighting">Lighting</label>
						<input id="lighting" type="checkbox" checked />
					</fieldset>
					<fieldset>
						<h2>Camera</h2>
						<label for="camera-x">Camera X:</label>
						<input id="camera-x" value="0" type="number" step="0.1" />
						<label for="camera-y">Camera Y:</label>
						<input id="camera-y" value="0" type="number" step="0.1" />
						<label for="camera-z">Camera Z:</label>
						<input id="camera-z" value="0" type="number" step="0.1" />
						<label for="camera-rotation-x">Camera Rotation X:</label>
						<input id="camera-rotation-x" value="0" type="number" step="0.1" />
						<label for="camera-rotation-y">Camera Rotation Y:</label>
						<input id="camera-rotation-y" value="0" type="number" step="0.1" />
						<label for="camera-rotation-z">Camera Rotation Z:</label>
						<input id="camera-rotation-z" value="1" type="number" step="0.1" />
						<label for="keyboard-camera">Keyboard Control</label>
						<input type="checkbox" id="keyboard-camera" checked />
					</fieldset>
					<fieldset>
						<h2>Object Rotation</h2>
						<label for="rotation-x">Rotation X:</label>
						<input id="rotation-x" value="0" type="number" />
						<label for="rotation-y">Rotation Y:</label>
						<input id="rotation-y" value="0" type="number" />
						<label for="rotation-z">Rotation Z:</label>
						<input id="rotation-z" value="0" type="number" />
					</fieldset>
					<fieldset>
						<h2>Object Translation</h2>
						<label for="translation-x">Translation X:</label>
						<input id="translation-x" value="0" type="number" step="0.1" />
						<label for="translation-y">Translation Y:</label>
						<input id="translation-y" value="0" type="number" step="0.1" />
						<label for="translation-z">Translation Z:</label>
						<input id="translation-z" value="0" type="number" step="0.1" />
					</fieldset>
					<fieldset>
						<label for="stroke">Stroke:</label>
						<input id="stroke" value="black" />
					</fieldset>
					<fieldset>
						<label for="stroke-width">Stroke Width:</label>
						<input id="stroke-width" value="1" />
					</fieldset>
					<div class="button-container">
						<button id="finish">Finish</button>
					</div>
				</div>
				<div id="output"></div>
			`
		}
		cacheDom() {
			this.dom = {
				faces: this.shadowRoot.querySelector("#faces"),
				perspective: this.shadowRoot.querySelector("#perspective"),
				backfaceCulling: this.shadowRoot.querySelector("#backface-culling"),
				lighting: this.shadowRoot.querySelector("#lighting"),
				stroke: this.shadowRoot.querySelector("#stroke"),
				strokeWidth: this.shadowRoot.querySelector("#stroke-width"),
				fill: this.shadowRoot.querySelector("#fill"),
				rotationX: this.shadowRoot.querySelector("#rotation-x"),
				rotationY: this.shadowRoot.querySelector("#rotation-y"),
				rotationZ: this.shadowRoot.querySelector("#rotation-z"),
				translationX: this.shadowRoot.querySelector("#translation-x"),
				translationY: this.shadowRoot.querySelector("#translation-y"),
				translationZ: this.shadowRoot.querySelector("#translation-z"),
				cameraX: this.shadowRoot.querySelector("#camera-x"),
				cameraY: this.shadowRoot.querySelector("#camera-y"),
				cameraZ: this.shadowRoot.querySelector("#camera-z"),
				cameraRotationX: this.shadowRoot.querySelector("#camera-rotation-x"),
				cameraRotationY: this.shadowRoot.querySelector("#camera-rotation-y"),
				cameraRotationZ: this.shadowRoot.querySelector("#camera-rotation-z"),
				keyboardCamera: this.shadowRoot.querySelector("#keyboard-camera"),
				finish: this.shadowRoot.querySelector("#finish"),
				output: this.shadowRoot.querySelector("#output")
			};
		}
		attachEvents() {
			this.dom.finish.addEventListener("click", this.finish);
			this.dom.faces.addEventListener("input", this.generate);
			this.dom.perspective.addEventListener("change", this.generate);
			this.dom.backfaceCulling.addEventListener("change", this.generate);
			this.dom.lighting.addEventListener("change", this.generate);
			this.dom.stroke.addEventListener("input", this.generate);
			this.dom.strokeWidth.addEventListener("input", this.generate);
			this.dom.rotationX.addEventListener("input", this.generate);
			this.dom.rotationY.addEventListener("input", this.generate);
			this.dom.rotationZ.addEventListener("input", this.generate);
			this.dom.translationX.addEventListener("input", this.generate);
			this.dom.translationY.addEventListener("input", this.generate);
			this.dom.translationZ.addEventListener("input", this.generate);
			this.dom.cameraX.addEventListener("input", this.generate);
			this.dom.cameraY.addEventListener("input", this.generate);
			this.dom.cameraZ.addEventListener("input", this.generate);
			this.dom.cameraRotationX.addEventListener("input", this.generate);
			this.dom.cameraRotationY.addEventListener("input", this.generate);
			this.dom.cameraRotationZ.addEventListener("input", this.generate);
			this.dom.fill.addEventListener("input", this.generate);
			document.body.addEventListener("keydown", this.onKeyPress);
		}
		generate() {
			const faces = JSON.parse(this.dom.faces.value);
			const stroke = this.dom.stroke.value;
			const strokeWidth = parseFloat(this.dom.strokeWidth.value);
			let fills = JSON.parse(this.dom.fill.value).map(c => parseColor(c));
			const rotationX = degreesToRadians(parseFloat(this.dom.rotationX.value));
			const rotationY = degreesToRadians(parseFloat(this.dom.rotationY.value));
			const rotationZ = degreesToRadians(parseFloat(this.dom.rotationZ.value));
			const translationX = parseFloat(this.dom.translationX.value);
			const translationY = parseFloat(this.dom.translationY.value);
			const translationZ = parseFloat(this.dom.translationZ.value);
			const isPerspective = this.dom.perspective.checked;
			const isBackfaceCulling = this.dom.backfaceCulling.checked;
			const isLighting = this.dom.lighting.checked;

			//scene vars
			const height = 720;
			const width = 720;
			const camera = [parseFloat(this.dom.cameraX.value),parseFloat(this.dom.cameraY.value),parseFloat(this.dom.cameraZ.value)];
			const cameraRotations = [
				degreesToRadians(parseFloat(this.dom.cameraRotationX.value)), 
				degreesToRadians(parseFloat(this.dom.cameraRotationY.value)), 
				degreesToRadians(parseFloat(this.dom.cameraRotationZ.value))
			];
			const cameraStartingTarget = [0, 0, 1];
			const cameraRotationMatrix =  multiplyMatrix(multiplyMatrix(getRotationXMatrix(cameraRotations[0]), getRotationYMatrix(cameraRotations[1])), getRotationZMatrix(cameraRotations[2]));
			const cameraDirection = multiplyMatrixVector(cameraStartingTarget, cameraRotationMatrix);
			const cameraTarget = addVector(camera, cameraDirection);
			const lightDirection = normalizeVector([0,0,-1]);

			const worldMatrix = multiplyMatrix(multiplyMatrix(multiplyMatrix(multiplyMatrix(getIdentityMatrix(), getRotationXMatrix(rotationX)), getRotationYMatrix(rotationY)), getRotationZMatrix(rotationZ)), getTranslationMatrix(translationX, translationY, translationZ));
			const viewMatrix = getLookAtMatrix(camera, cameraTarget, UP);

			const transformedFaces = faces.map(poly => poly.map(v => multiplyMatrixVector(v, worldMatrix)))

			let inViewFaces = transformedFaces.map(poly => poly.map(v => addVector(v, [0, 0, 3])))
			const fillIntensity = new Map(); //temp to keep fills in order

			if(isBackfaceCulling){
				inViewFaces = inViewFaces.filter((poly, i) => { //filter faces not facing us
					const lineA = subtractVector(poly[1], poly[0]);
					const lineB = subtractVector(poly[3], poly[0]);
					const normal = normalizeVector(crossVector(lineA, lineB));
					const componentTowardsView = dotVector(normal, subtractVector(poly[0], camera));
					const shouldKeep = componentTowardsView < 0;
					if(shouldKeep){
						fillIntensity.set(i, dotVector(normal, lightDirection));
					}

					return shouldKeep;
				});
			}

			//camera projection
			inViewFaces = inViewFaces.map(poly => poly.map(v => multiplyMatrixVector(v, viewMatrix)));

			//clipping
			inViewFaces = inViewFaces.map(poly => clip(poly, [0, 0, 0.1], [0, 0, 1]))
									 .filter(poly => poly.length > 0);

			//get light on polygon and scale color, remove culled faces, convert to css color
			fills = fills
				.map((f, i) => isBackfaceCulling ? fillIntensity.has(i) ? isLighting ? multiplyVector(f, fillIntensity.get(i)) : f : null : f)
				.filter(f => f !== null)
				.map(f => `rgb(${f[0]},${f[1]},${f[2]},${isNaN(f[3]) ? 1 : f[3]})`);

			if (isPerspective) { //project
				const zNear = 0.1;
				const zFar = 1000;
				const fieldOfView = 90;
				const projectionMatrix = getProjectionMatrix(height - strokeWidth * 2, width - strokeWidth * 2, fieldOfView, zNear, zFar);

				inViewFaces = inViewFaces.map(poly => poly.map(v => {
					const w = v[0] * projectionMatrix[0][3] + v[1] * projectionMatrix[1][3] + v[2] * projectionMatrix[2][3] + projectionMatrix[3][3];
					const projectedV = multiplyMatrixVector(v, projectionMatrix);
					return divideVector(projectedV, w);
				}));
			}

			//scale to screen
			inViewFaces = inViewFaces
					.map(poly => poly
					.map(v => addVector(v, [1, 1, 0])) //screen offset 
					.map(v => [v[0] * 0.5 * width, v[1] * 0.5 * height, v[2]])); //scale to screen


			//clip screen
			inViewFaces = inViewFaces
				.map(poly => clip(poly, [0, 0, 0         ], [0 , 1 , 0]))
				.filter(poly => poly.length > 0)
				.map(poly => clip(poly, [0, height - 1, 0], [0 , -1, 0]))
				.filter(poly => poly.length > 0)
				.map(poly => clip(poly, [0, 0, 0         ], [1 , 0 , 0]))
				.filter(poly => poly.length > 0)
				.map(poly => clip(poly, [width - 1, 0, 0], [-1, 0 , 0]))
				.filter(poly => poly.length > 0);

			const svg = renderShadedPolyList(inViewFaces, stroke, strokeWidth, fills, height, width);
			this.dom.output.innerHTML = "";
			this.dom.output.appendChild(svg);
		}
		onKeyPress(e){
			if(!this.dom.keyboardCamera.checked) return;
			e.preventDefault();

			const camera = [
				parseFloat(this.dom.cameraX.value),
				parseFloat(this.dom.cameraY.value),
				parseFloat(this.dom.cameraZ.value)
			];
			const cameraRotations = [
				degreesToRadians(parseFloat(this.dom.cameraRotationX.value)),
				degreesToRadians(parseFloat(this.dom.cameraRotationY.value)),
				degreesToRadians(parseFloat(this.dom.cameraRotationZ.value))
			];

			const cameraRotationMatrix = multiplyMatrix(multiplyMatrix(getRotationXMatrix(cameraRotations[0]), getRotationYMatrix(cameraRotations[1])), getRotationZMatrix(cameraRotations[2]));
			const cameraDirection = multiplyMatrixVector(FORWARD, cameraRotationMatrix);
			const relativeForward = normalizeVector(cameraDirection);

			switch(e.which){
				case 37: //left
					this.dom.cameraRotationY.value = wrap(parseFloat(this.dom.cameraRotationY.value) + 1, 360);
					break;
				case 38: //up
					this.dom.cameraRotationX.value = wrap(parseFloat(this.dom.cameraRotationX.value) + 1, 360);
					break;
				case 39: //right
					this.dom.cameraRotationY.value = wrap(parseFloat(this.dom.cameraRotationY.value) - 1, 360);
					break;
				case 40: //down
					this.dom.cameraRotationX.value = wrap(parseFloat(this.dom.cameraRotationX.value) - 1, 360);
					break;
				case 90: //Z
					this.dom.cameraRotationZ.value = wrap(parseFloat(this.dom.cameraRotationZ.value) - 1, 360);
					break;
				case 88: //X
					this.dom.cameraRotationZ.value = wrap(parseFloat(this.dom.cameraRotationZ.value) + 1, 360);
					break;
				case 65: {//A
					const relativeUp = normalizeVector(subtractVector(UP, multiplyVector(relativeForward, dotVector(UP, relativeForward))));
					const relativeRight = crossVector(relativeUp, relativeForward);
					const result = subtractVector(camera, multiplyVector(relativeRight, 0.1));

					this.dom.cameraX.value = result[0];
					this.dom.cameraY.value = result[1];
					this.dom.cameraZ.value = result[2];
					break;
				}
				case 68: {//D
					const relativeUp = normalizeVector(subtractVector(UP, multiplyVector(relativeForward, dotVector(UP, relativeForward))));
					const relativeRight = crossVector(relativeUp, relativeForward);
					const result = addVector(camera, multiplyVector(relativeRight, 0.1));

					this.dom.cameraX.value = result[0];
					this.dom.cameraY.value = result[1];
					this.dom.cameraZ.value = result[2];
					break;
				}
				case 83: {//S
					const result = subtractVector(camera, multiplyVector(relativeForward, 0.1));

					this.dom.cameraX.value = result[0];
					this.dom.cameraY.value = result[1];
					this.dom.cameraZ.value = result[2];
					break;
				}
				case 87: {//W
					const result = addVector(camera, multiplyVector(relativeForward, 0.1));

					this.dom.cameraX.value = result[0];
					this.dom.cameraY.value = result[1];
					this.dom.cameraZ.value = result[2];
					break;
				}
				case 81: {//Q
					const relativeUp = normalizeVector(subtractVector(UP, multiplyVector(relativeForward, dotVector(UP, relativeForward))));
					const result = subtractVector(camera, multiplyVector(relativeUp, 0.1));

					this.dom.cameraX.value = result[0];
					this.dom.cameraY.value = result[1];
					this.dom.cameraZ.value = result[2];
					break;
				}
				case 69: {//E
					const relativeUp = normalizeVector(subtractVector(UP, multiplyVector(relativeForward, dotVector(UP, relativeForward))));
					const result = addVector(camera, multiplyVector(relativeUp, 0.1));

					this.dom.cameraX.value = result[0];
					this.dom.cameraY.value = result[1];
					this.dom.cameraZ.value = result[2];
					break;
				}
			}
			this.generate();
		}
		finish() {
			const svg = this.dom.output.querySelector("svg");
			fireEvent(this, "mesh-generated", svg ? svg.innerHTML : null);
		}
	}
);

function degreesToRadians(deg){
	return deg * Math.PI / 180;
}

function wrap(number, end, begin = 0){
	if(number > end){
		return number % end;
	}
	if(number < begin){
		return end + (number % end);
	}
	return number;
}

function clip(poly, planePoint, planeNormal){
	planeNormal =normalizeVector(planeNormal);
	const emitVerticies = []; 

	let firstDot = dotVector(planeNormal, subtractVector(poly[0], planePoint));
	let previousDot = 0; //zero insures the first pont behaves normally

	for(let i = 0; i < poly.length; i++){
		const currentDot = dotVector(planeNormal, subtractVector(poly[i], planePoint));
		if(currentDot * previousDot < 0){ //one of the points lies outside
			const t = previousDot / (previousDot - currentDot);
			const intersect = addVector(poly[i - 1], multiplyVector(subtractVector(poly[i], poly[i - 1]), t));
			emitVerticies.push(intersect);
		}
		if(currentDot >= 0){
			emitVerticies.push(poly[i])
		}
		previousDot = currentDot;
	}
	if(previousDot * firstDot < 0){
		const t = previousDot / (previousDot - firstDot);
		const intersect = addVector(poly[poly.length - 1], multiplyVector(subtractVector(poly[0], poly[poly.length - 1]), t));
		emitVerticies.push(intersect);
	}
	return emitVerticies;
}
