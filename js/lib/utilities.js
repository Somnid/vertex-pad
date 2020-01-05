export function fireEvent(element, eventName, payload = null) {
	const event = new CustomEvent(eventName, payload);
	return element.dispatchEvent(event);
}