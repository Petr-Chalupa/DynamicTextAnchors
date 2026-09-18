// -------------------------------
// TREE ABSTRACTION
// -------------------------------
export class DTAError extends Error {
    constructor(message, options) {
        super(message, options);
        this.name = this.constructor.name;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
//# sourceMappingURL=types.js.map