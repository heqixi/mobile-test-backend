function deriveTaskStatus(task) {
    const isFinished = 'finished' === task.status;
    if ('failed' === task.status) return 'failed';
    if (isFinished && (task.error || task.errorMessage)) return 'failed';
    if (isFinished && 'WaitFor' === task.subType && false === task.output) return 'warning';
    if ('Assert' === task.subType && isFinished && false === task.output) return 'failed';
    if ('pending' === task.status) return 'pending';
    if ('running' === task.status) return 'running';
    if ('cancelled' === task.status) return 'cancelled';
    return 'passed';
}
function deriveCaseStatus(executions) {
    for (const execution of executions)for (const task of execution.tasks ?? [])if ('failed' === deriveTaskStatus(task)) return 'failed';
    return 'passed';
}
export { deriveCaseStatus, deriveTaskStatus };

//# sourceMappingURL=task-status.mjs.map