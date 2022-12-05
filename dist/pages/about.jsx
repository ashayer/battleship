"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const link_1 = __importDefault(require("next/link"));
const react_1 = require("react");
const trpc_1 = require("utils/trpc");
function AboutPage() {
    const [num, setNumber] = (0, react_1.useState)();
    trpc_1.trpc.randomNumber.useSubscription(undefined, {
        onData(n) {
            setNumber(n);
        },
    });
    return (<div>
      Here&apos;s a random number from a sub: {num} <br />
      <link_1.default href="/">Index</link_1.default>
    </div>);
}
exports.default = AboutPage;
