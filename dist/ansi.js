"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripAnsi = void 0;
const ansiPattern = [
    '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)',
    '(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))',
].join('|');
const ansiRegexp = new RegExp(ansiPattern, 'g');
function stripAnsi(arg) {
    if (typeof arg !== 'string') {
        return arg;
    }
    return arg.replace(ansiRegexp, '');
}
exports.stripAnsi = stripAnsi;
