function shouldRenderCustomEmptyState(infoList, emptyState) {
    var _infoList_;
    return void 0 !== emptyState && 1 === infoList.length && (null == (_infoList_ = infoList[0]) ? void 0 : _infoList_.id) === 'welcome';
}
export { shouldRenderCustomEmptyState };
