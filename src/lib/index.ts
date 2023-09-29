export class DTA {
    // rawText: string;
    rawXML: Document;

    constructor() {}

    public setText(text: string) {
        text = `<p>${text}</p>`;
        this.rawXML = this.validateXML(text);
    }

    public setXML(xml: string) {
        this.rawXML = this.validateXML(xml);
    }

    private validateXML(xml: string) {
        const xmlDoc: Document = new DOMParser().parseFromString(xml, "text/xml");
        const errNode = xmlDoc.querySelector("parsererror");
        if (errNode) throw new Error("Invalid XML!\n" + errNode.textContent);
        return xmlDoc;
    }
}
