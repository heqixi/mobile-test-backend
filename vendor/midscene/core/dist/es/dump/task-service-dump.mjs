function isRecord(value) {
    return 'object' == typeof value && null !== value;
}
function isServiceDump(value) {
    return isRecord(value) && 'string' == typeof value.type && isRecord(value.taskInfo);
}
function getTaskServiceDump(task) {
    const log = task?.log;
    if (isRecord(log) && isServiceDump(log.dump)) return log.dump;
    return null;
}
function getTaskSearchArea(task) {
    return task?.searchArea ?? getTaskServiceDump(task)?.taskInfo?.searchArea;
}
export { getTaskSearchArea, getTaskServiceDump };

//# sourceMappingURL=task-service-dump.mjs.map