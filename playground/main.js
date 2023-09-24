import { hello } from "../dist/index.js";

hello();

const controlsSwitchTxtHtml = document.querySelector("#text-html > .switch > input");
controlsSwitchTxtHtml.addEventListener("change", (e) => {
    console.log("INPUT CHANGE:", e.target.checked ? "HTML" : "TEXT");
});
