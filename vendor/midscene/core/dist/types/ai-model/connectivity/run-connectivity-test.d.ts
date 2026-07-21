import type { IModelConfig } from '@midscene/shared/env';
export interface ConnectivityTestResult {
    passed: boolean;
    message?: string;
}
export interface ConnectivityTestConfig {
    defaultModelConfig: IModelConfig;
    planningModelConfig: IModelConfig;
    insightModelConfig: IModelConfig;
}
export declare function runConnectivityTest(config: ConnectivityTestConfig): Promise<ConnectivityTestResult>;
