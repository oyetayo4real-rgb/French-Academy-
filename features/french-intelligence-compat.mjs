/* Compatibility adapter for the existing public browser API. */
import { lookup, translate, conjugate, answerQuestion, checkWriting } from "./french-intelligence-core-v1.mjs";
const legacy = Object.freeze({ lookup, translate, conjugate, answerQuestion, checkWriting });
if (typeof window !== "undefined") window.FrenchIntelligenceCore = legacy;
export default legacy;
