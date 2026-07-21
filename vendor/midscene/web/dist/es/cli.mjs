import { existsSync } from "node:fs";
import { join } from "node:path";
import { createReportCliCommands } from "@midscene/core";
import { reportCLIError, runToolsCLI } from "@midscene/shared/cli";
import dotenv from "dotenv";
import { WebMidsceneTools } from "./agent-tools.mjs";
import { WebCdpMidsceneTools } from "./agent-tools-cdp.mjs";
import { WebPuppeteerMidsceneTools } from "./agent-tools-puppeteer.mjs";
import { parseWebCliOptions } from "./cli-options.mjs";
const envFile = join(process.cwd(), '.env');
if (existsSync(envFile)) dotenv.config({
    path: envFile
});
Promise.resolve().then(()=>{
    const parsedOptions = parseWebCliOptions(process.argv.slice(2));
    let tools;
    tools = 'bridge' === parsedOptions.mode ? new WebMidsceneTools() : 'cdp' === parsedOptions.mode ? new WebCdpMidsceneTools(parsedOptions.cdpEndpoint) : new WebPuppeteerMidsceneTools(parsedOptions.viewport);
    return runToolsCLI(tools, 'midscene-web', {
        stripPrefix: 'web_',
        argv: parsedOptions.argv,
        version: "1.10.0",
        extraCommands: createReportCliCommands()
    });
}).catch((e)=>{
    process.exit(reportCLIError(e));
});

//# sourceMappingURL=cli.mjs.map