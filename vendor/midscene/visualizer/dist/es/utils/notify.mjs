import { notification } from "antd";
const DEFAULT_TITLE = 'Something went wrong';
function normalizeMessage(error) {
    if ('string' == typeof error) return error;
    if (error instanceof Error) return error.message || error.toString();
    if (error && 'object' == typeof error && 'message' in error) {
        const value = error.message;
        if ('string' == typeof value) return value;
    }
    try {
        return JSON.stringify(error);
    } catch (e) {
        return String(error);
    }
}
function notifyError(error, options = {}) {
    var _options_title, _options_description, _options_duration;
    notification.error({
        message: null != (_options_title = options.title) ? _options_title : DEFAULT_TITLE,
        description: null != (_options_description = options.description) ? _options_description : normalizeMessage(error),
        placement: 'bottomRight',
        duration: null != (_options_duration = options.duration) ? _options_duration : 5
    });
}
export { notifyError };
