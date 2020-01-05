import { renderShadedPolyList } from "../lib/svg-3d.js";
import { fireEvent } from "../lib/utilities.js";
import { parseColor } from "../lib/color.js";
import { getProjectionMatrix, getRotationXMatrix, getRotationYMatrix, getRotationZMatrix, multiplyMatrixVector, addVector, subtractVector, crossVector, normalizeVector, dotVector, multiplyVector, divideVector, getIdentityMatrix, multiplyMatrix, getTranslationMatrix, getPointAtMatrix, getLookAtMatrix } from "../lib/vector.js";
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
						<label for="camera-direction-x">Camera Direction X:</label>
						<input id="camera-direction-x" value="0" type="number" step="0.1" />
						<label for="camera-direction-y">Camera Direction Y:</label>
						<input id="camera-direction-y" value="0" type="number" step="0.1" />
						<label for="camera-direction-z">Camera Direction Z:</label>
						<input id="camera-direction-z" value="1" type="number" step="0.1" />
						<label for="keyboard-camera">Keyboard Control</label>
						<input type="checkbox" id="keyboard-camera" />
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
				cameraDirectionX: this.shadowRoot.querySelector("#camera-direction-x"),
				cameraDirectionY: this.shadowRoot.querySelector("#camera-direction-y"),
				cameraDirectionZ: this.shadowRoot.querySelector("#camera-direction-z"),
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
			this.dom.cameraDirectionX.addEventListener("input", this.generate);
			this.dom.cameraDirectionY.addEventListener("input", this.generate);
			this.dom.cameraDirectionZ.addEventListener("input", this.generate);
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
			const cameraDirection = [parseFloat(this.dom.cameraDirectionX.value),parseFloat(this.dom.cameraDirectionY.value),parseFloat(this.dom.cameraDirectionZ.value)];
			const cameraTarget = addVector(camera, cameraDirection);
			const lightDirection = normalizeVector([0,0,-1]);
			const up = [0,1,0];

			const worldMatrix = multiplyMatrix(multiplyMatrix(multiplyMatrix(multiplyMatrix(getIdentityMatrix(), getRotationXMatrix(rotationX)), getRotationYMatrix(rotationY)), getRotationZMatrix(rotationZ)), getTranslationMatrix(translationX, translationY, translationZ));
			const viewMatrix = getLookAtMatrix(camera, cameraTarget, up);

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

			//get light on polygon and scale color, remove culled faces, convert to css color
			fills = fills
				.map((f, i) => isBackfaceCulling ? fillIntensity.has(i) ? isLighting ? multiplyVector(f, fillIntensity.get(i)) : f : null : f)
				.filter(f => f !== null)
				.map(f => `rgb(${f[0]},${f[1]},${f[2]},${isNaN(f[3]) ? 1 : f[3]})`);

			if (isPerspective) { //project
				const zNear = 0;
				const zFar = 1000;
				const fieldOfView = 90;
				const projectionMatrix = getProjectionMatrix(height - strokeWidth * 2, width - strokeWidth * 2, fieldOfView, zNear, zFar);

				inViewFaces = inViewFaces.map(poly => poly.map(v => {
					const w = v[0] * projectionMatrix[0][3] + v[1] * projectionMatrix[1][3] + v[2] * projectionMatrix[2][3] + projectionMatrix[3][3];
					const projectedV = multiplyMatrixVector(v, projectionMatrix);
					return divideVector(projectedV, w);
				}));
			}

			const svg = renderShadedPolyList(inViewFaces, stroke, strokeWidth, fills, height, width);
			this.dom.output.innerHTML = "";
			this.dom.output.appendChild(svg);
		}
		onKeyPress(e){
			if(!this.dom.keyboardCamera.checked) return;
			e.preventDefault();
			switch(e.which){
				case 37: //left
					this.dom.cameraDirectionX.value = parseFloat(this.dom.cameraDirectionX.value) - 0.1;
					break;
				case 38: //up
					this.dom.cameraDirectionY.value = parseFloat(this.dom.cameraDirectionY.value) + 0.1;
					break;
				case 39: //right
					this.dom.cameraDirectionX.value = parseFloat(this.dom.cameraDirectionX.value) + 0.1;
					break;
				case 40: //down
					this.dom.cameraDirectionY.value = parseFloat(this.dom.cameraDirectionY.value) - 0.1;
					break;
				case 65: //A
					this.dom.cameraX.value = parseFloat(this.dom.cameraX.value) - 0.1;
					break;
				case 68: //D
					this.dom.cameraX.value = parseFloat(this.dom.cameraX.value) + 0.1;
					break;
				case 83: //S
					this.dom.cameraZ.value = parseFloat(this.dom.cameraZ.value) - 0.1;
					break;
				case 87: //W
					this.dom.cameraZ.value = parseFloat(this.dom.cameraZ.value) + 0.1;
					break;
				case 81: //Q
					this.dom.cameraY.value = parseFloat(this.dom.cameraY.value) + 0.1;
					break;
				case 69: //E
					this.dom.cameraY.value = parseFloat(this.dom.cameraY.value) - 0.1;
					break;
				case 90: //Z
					this.dom.cameraDirectionZ.value = parseFloat(this.dom.cameraDirectionZ.value) - 0.1;
					break;
				case 88: //X
					this.dom.cameraDirectionZ.value = parseFloat(this.dom.cameraDirectionZ.value) + 0.1;
					break;
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
