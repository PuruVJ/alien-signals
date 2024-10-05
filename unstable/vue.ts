import {
	Computed,
	currentEffectScope,
	Dependency,
	DirtyLevels,
	Effect,
	EffectScope,
	Signal,
	Subscriber,
	System,
} from '../index.js';

export function effect(fn: () => void) {
	return new ReactiveEffect(fn);
}

export function effectScope() {
	return new EffectScope();
}

export function triggerRef(ref: ShallowRef) {
	System.startBatch();
	Dependency.propagate(ref);
	System.endBatch();
}

const pausedSubsDepths: number[] = [];

export function pauseTracking() {
	pausedSubsDepths.push(System.activeSubsDepth);
	System.activeSubsDepth = 0;
}

export function resetTracking() {
	System.activeSubsDepth = pausedSubsDepths.pop()!;
}

export function shallowRef<T>(): ShallowRef<T | undefined>;
export function shallowRef<T>(oldValue: T): ShallowRef<T>;
export function shallowRef<T>(value?: T) {
	return new ShallowRef(value);
}

export function computed<T>(fn: () => T) {
	return new VueComputed(fn);
}

export function getCurrentScope() {
	return currentEffectScope;
}

export class ShallowRef<T = any> extends Signal<T> {
	get value() {
		return this.get();
	}
	set value(value: T) {
		this.set(value);
	}
}

class VueComputed<T = any> extends Computed<T> {
	get value() {
		return this.get();
	}
}

export class ReactiveEffect extends Effect {
	onDispose: (() => void)[] = [];

	get dirty() {
		if (this.versionOrDirtyLevel === DirtyLevels.MaybeDirty) {
			Subscriber.resolveMaybeDirty(this);
		}
		return this.versionOrDirtyLevel === DirtyLevels.Dirty;
	}

	set scheduler(fn: () => void) {
		this.notify = fn;
	}

	stop() {
		super.stop();
		for (const cb of this.onDispose) {
			cb();
		}
		this.onDispose.length = 0;
	}
}

export function onScopeDispose(cb: () => void) {
	if (currentEffectScope instanceof ReactiveEffect) {
		currentEffectScope.onDispose.push(cb);
	}
}