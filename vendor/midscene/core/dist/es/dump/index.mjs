import { restoreImageReferences } from "./screenshot-restoration.mjs";
import { escapeContent, generateDumpScriptTag, generateImageScriptTag, parseDumpScript, parseDumpScriptAttributes, parseImageScripts, unescapeContent } from "./html-utils.mjs";
import { getTaskSearchArea, getTaskServiceDump } from "./task-service-dump.mjs";
import { deriveCaseStatus, deriveTaskStatus } from "./task-status.mjs";
export { deriveCaseStatus, deriveTaskStatus, escapeContent, generateDumpScriptTag, generateImageScriptTag, getTaskSearchArea, getTaskServiceDump, parseDumpScript, parseDumpScriptAttributes, parseImageScripts, restoreImageReferences, unescapeContent };
