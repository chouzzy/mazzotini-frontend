import '@testing-library/jest-dom';

// O Chakra UI (Ark/zag) usa APIs do navegador que o jsdom não tem
class ObserverStub { observe() {} unobserve() {} disconnect() {} }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const w = window as any;
w.ResizeObserver = w.ResizeObserver ?? ObserverStub;
w.IntersectionObserver = w.IntersectionObserver ?? ObserverStub;
w.matchMedia = w.matchMedia ?? ((query: string) => ({
    matches: false, media: query, onchange: null,
    addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent() { return false; },
}));
window.scrollTo = (() => {}) as typeof window.scrollTo;
Element.prototype.scrollIntoView = () => {};
Element.prototype.scrollTo = (() => {}) as typeof Element.prototype.scrollTo;
