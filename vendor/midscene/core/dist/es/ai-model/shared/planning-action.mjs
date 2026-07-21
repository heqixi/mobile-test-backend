function getTapLocatedPixelBbox(actions) {
    for (const action of actions)if ('Tap' === action.type) return action.param.locate.locatedPixelBbox;
}
export { getTapLocatedPixelBbox };

//# sourceMappingURL=planning-action.mjs.map