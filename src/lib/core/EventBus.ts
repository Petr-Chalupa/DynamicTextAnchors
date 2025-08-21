import { EventBusI, Event, EventMap, EventCallback } from "../types";

export class EventBus implements EventBusI {
    private static instance: EventBusI;
    private listeners: Map<keyof EventMap, EventCallback<any>[]> = new Map();

    private constructor() {}

    public static getInstance(): EventBusI {
        if (!EventBus.instance) {
            EventBus.instance = new EventBus();
        }
        return EventBus.instance;
    }

    on<K extends keyof EventMap>(type: K, fn: (event: Event<K>) => void, target: any): void {
        if (!this.listeners.has(type)) {
            this.listeners.set(type, []);
        }
        this.listeners.get(type)!.push({ fn, target });
    }

    off<K extends keyof EventMap>(type: K, fn: (event: Event<K>) => void, target: any): void {
        const callbacks = this.listeners.get(type);
        if (!callbacks) return;

        this.listeners.set(
            type,
            callbacks.filter((cb) => cb.fn !== fn || cb.target !== target)
        );
    }

    offAll(target: any): void {
        for (const [type, callbacks] of this.listeners.entries()) {
            this.listeners.set(
                type,
                callbacks.filter((cb) => cb.target !== target)
            );
        }
    }

    emit<K extends keyof EventMap>(event: Event<K>): void {
        this.listeners.get(event.type)?.forEach(({ fn }) => fn(event));
    }
}
