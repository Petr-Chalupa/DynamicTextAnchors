export class EventBus {
    static instance;
    listeners = new Map();
    constructor() { }
    static getInstance() {
        if (!EventBus.instance) {
            EventBus.instance = new EventBus();
        }
        return EventBus.instance;
    }
    on(type, fn, target) {
        if (!this.listeners.has(type)) {
            this.listeners.set(type, []);
        }
        this.listeners.get(type).push({ fn, target });
    }
    off(type, fn, target) {
        const callbacks = this.listeners.get(type);
        if (!callbacks)
            return;
        this.listeners.set(type, callbacks.filter((cb) => cb.fn !== fn || cb.target !== target));
    }
    offAll(target) {
        for (const [type, callbacks] of this.listeners.entries()) {
            this.listeners.set(type, callbacks.filter((cb) => cb.target !== target));
        }
    }
    emit(event) {
        this.listeners.get(event.type)?.forEach(({ fn }) => fn(event));
    }
}
//# sourceMappingURL=EventBus.js.map