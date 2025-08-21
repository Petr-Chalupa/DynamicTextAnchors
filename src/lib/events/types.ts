import { AnchorI, MergeDirection } from "../core/types";
import { RendererI } from "../render/types";

export interface EventMap {
    "anchor:create": { anchor: AnchorI };
    "anchor:change": { anchor: AnchorI };
    "anchor:destroy": { anchor: AnchorI };
    "anchor:focus-request": { anchor: AnchorI; focus: boolean };
    "anchor:hover-request": { anchor: AnchorI; hover: boolean };
    "anchor:merge-request": { anchor: AnchorI; direction: MergeDirection };
    "anchor:destroy-request": { anchor: AnchorI };

    "renderer:render": { renderer: RendererI };
    "renderer:destroy": { renderer: RendererI };

    "dta:destroy": {};
    "dta:serialize": { data: any };
    "dta:deserialize": { data: any };
}

export type Event<K extends keyof EventMap = keyof EventMap> = {
    type: K;
    payload: EventMap[K];
};

export type EventCallback<K extends keyof EventMap> = {
    fn: (event: Event<K>) => void;
    target: any;
};

export interface EventBusI {
    on<K extends keyof EventMap>(type: K, fn: (event: Event<K>) => void, target: any): void;
    off<K extends keyof EventMap>(type: K, fn: (event: Event<K>) => void, target: any): void;
    offAll(target: any): void;
    emit<K extends keyof EventMap>(event: Event<K>): void;
}
