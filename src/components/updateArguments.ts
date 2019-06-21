import { ILaunchRequestArgs, IAttachRequestArgs, ScenarioType } from 'vscode-chrome-debug-core';
import { NodeDebugAdapter } from '../nodeDebugAdapter';

export function updateArguments<T extends ILaunchRequestArgs | IAttachRequestArgs>(_scenarioType: ScenarioType, argumentsFromClient: T): T {
    NodeDebugAdapter.updateCommonArgs(argumentsFromClient);
    return argumentsFromClient;
}