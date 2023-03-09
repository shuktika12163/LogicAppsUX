import type { CallbackInfo } from './workflow';
import type { ContentLink, Runs, RunError } from '@microsoft/designer-ui';
import { AssertionErrorCode, AssertionException } from '@microsoft/utils-logic-apps';

export interface IRunService {
  getContent(contentLink: ContentLink): Promise<any>;
  getMoreRuns(continuationToken: string): Promise<Runs>;
  getRun(runId: string): Promise<LogicAppsV2.RunInstanceDefinition | RunError>;
  getRuns(workflowId: string): Promise<Runs>;
  runTrigger(callbackInfo: CallbackInfo): Promise<any>;
  getActionLinks(action: any, nodeId: string): Promise<any>;
}

let service: IRunService;

export const InitRunService = (RunService: IRunService): void => {
  service = RunService;
};

export const RunService = (): IRunService => {
  if (!service) {
    throw new AssertionException(AssertionErrorCode.SERVICE_NOT_INITIALIZED, 'Run Service need to be initialized before using');
  }

  return service;
};