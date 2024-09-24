import { Subscribers, broadcast, link } from './system';

export interface Signal<T = any> {
	(): T;
	set(newValue: T): void;
	markDirty(): void;
}

export function signal<T>(): Signal<T | undefined>;
export function signal<T>(oldValue: T): Signal<T>;
export function signal<T>(oldValue?: T): Signal<T | undefined> {
	const subs = new Subscribers();
	const fn = (() => {
		link(subs);
		return oldValue;
	}) as Signal;

	fn.markDirty = () => {
		broadcast(subs);
	};
	fn.set = (newValue) => {
		if (!Object.is(oldValue, oldValue = newValue)) {
			fn.markDirty();
		}
	};

	return fn;
}
