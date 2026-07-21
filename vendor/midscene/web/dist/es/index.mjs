import { PlaywrightAgent, PlaywrightAiFixture } from "./playwright/index.mjs";
import { Agent } from "@midscene/core/agent";
import { PuppeteerAgent } from "./puppeteer/index.mjs";
import { StaticPage, StaticPageAgent } from "./static/index.mjs";
import { WebMidsceneTools } from "./agent-tools.mjs";
import { webPlaygroundPlatform } from "./platform.mjs";
import { WebCdpMidsceneTools } from "./agent-tools-cdp.mjs";
export { Agent as PageAgent, PlaywrightAgent, PlaywrightAiFixture, PuppeteerAgent, StaticPage, StaticPageAgent, WebCdpMidsceneTools, WebMidsceneTools, webPlaygroundPlatform };
