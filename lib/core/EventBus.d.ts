import { EventBusI, Event, EventMap } from "../types";
export declare class EventBus implements EventBusI {
    private static instance;
    private listeners;
    private constructor();
    static getInstance(): EventBusI;
    on<K extends keyof EventMap>(type: K, fn: (event: Event<K>) => void, target: any): void;
    off<K extends keyof EventMap>(type: K, fn: (event: Event<K>) => void, target: any): void;
    offAll(target: any): void;
    emit<K extends keyof EventMap>(event: Event<K>): void;
}
//# sourceMappingURL=EventBus.d.ts.map