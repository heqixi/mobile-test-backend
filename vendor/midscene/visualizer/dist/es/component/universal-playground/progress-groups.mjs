function getLastProgressItemIdsByGroup(items) {
    const lastIds = new Set();
    for(let index = 0; index < items.length; index++){
        var _items_;
        const item = items[index];
        if ((null == item ? void 0 : item.type) === 'progress' && (null == (_items_ = items[index + 1]) ? void 0 : _items_.type) !== 'progress') lastIds.add(item.id);
    }
    return lastIds;
}
export { getLastProgressItemIdsByGroup };
