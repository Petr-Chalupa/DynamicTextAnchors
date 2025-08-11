import { DTAEvents } from "../types";

export class EventEmitter<Events extends DTAEvents> {
    private listeners: { [K in keyof Events]?: Array<(payload: Events[K]) => void> } = {};

    on<K extends keyof Events>(event: K, listener: (payload: Events[K]) => void) {
        (this.listeners[event] ??= []).push(listener);
    }

    off<K extends keyof Events>(event: K, listener: (payload: Events[K]) => void) {
        const arr = this.listeners[event];
        if (!arr) return;
        this.listeners[event] = arr.filter((l) => l !== listener);
    }

    emit<K extends keyof Events>(event: K, payload: Events[K]) {
        const arr = this.listeners[event];
        if (!arr) return;
        for (const listener of arr) listener(payload);
    }
}
