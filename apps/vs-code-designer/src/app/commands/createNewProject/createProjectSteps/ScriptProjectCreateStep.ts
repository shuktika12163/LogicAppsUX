/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import {
  ProjectDirectoryPath,
  appKindSetting,
  azureWebJobsStorageKey,
  funcIgnoreFileName,
  gitignoreFileName,
  hostFileName,
  localSettingsFileName,
  logicAppKind,
  workerRuntimeKey,
} from '../../../../constants';
import { addDefaultBundle } from '../../../utils/bundleFeed';
import { confirmOverwriteFile, writeFormattedJson } from '../../../utils/fs';
import { getFunctionsWorkerRuntime } from '../../../utils/vsCodeConfig/settings';
import { ProjectCreateStepBase } from './ProjectCreateStepBase';
import { nonNullProp } from '@microsoft/vscode-azext-utils';
import type { IActionContext } from '@microsoft/vscode-azext-utils';
import type { IHostJsonV1, IHostJsonV2, ILocalSettingsJson, IProjectWizardContext } from '@microsoft/vscode-extension-logic-apps';
import { FuncVersion } from '@microsoft/vscode-extension-logic-apps';
import * as fse from 'fs-extra';
import * as os from 'os';
import * as path from 'path';
import type { Progress } from 'vscode';
import { getGitIgnoreContent } from '../../../utils/git';

export class ScriptProjectCreateStep extends ProjectCreateStepBase {
  protected funcignore: string[] = [
    '__blobstorage__',
    '__queuestorage__',
    '__azurite_db*__.json',
    '.git*',
    '.vscode',
    localSettingsFileName,
    'test',
    '.debug',
  ];
  protected gitignore = '';
  protected supportsManagedDependencies = false;

  public async executeCore(
    context: IProjectWizardContext,
    _progress: Progress<{ message?: string | undefined; increment?: number | undefined }>
  ): Promise<void> {
    const version: FuncVersion = nonNullProp(context, 'version');
    const hostJsonPath: string = path.join(context.projectPath, hostFileName);

    if (await confirmOverwriteFile(context, hostJsonPath)) {
      const hostJson: IHostJsonV2 | IHostJsonV1 = version === FuncVersion.v1 ? {} : await this.getHostContent(context);
      await writeFormattedJson(hostJsonPath, hostJson);
    }

    const localSettingsJsonPath: string = path.join(context.projectPath, localSettingsFileName);
    if (await confirmOverwriteFile(context, localSettingsJsonPath)) {
      const localSettingsJson: ILocalSettingsJson = {
        IsEncrypted: false,
        Values: {
          [azureWebJobsStorageKey]: '',
          [appKindSetting]: logicAppKind,
          [ProjectDirectoryPath]: path.join(context.projectPath),
        },
      };

      const functionsWorkerRuntime: string | undefined = getFunctionsWorkerRuntime(context.language);
      if (functionsWorkerRuntime) {
        // tslint:disable-next-line:no-non-null-assertion
        localSettingsJson.Values[workerRuntimeKey] = functionsWorkerRuntime;
      }

      await writeFormattedJson(localSettingsJsonPath, localSettingsJson);
    }

    // Determine the base directory for the .gitignore file.
    // If 'isWorkspaceWithFunctions' is explicitly false (neither true nor null),
    // use the parent directory of 'workspacePath'. Otherwise, use 'projectPath'.
    const baseDirectory =
      !context.isWorkspaceWithFunctions && context.isWorkspaceWithFunctions !== null
        ? path.dirname(context.workspacePath)
        : context.projectPath;
    const gitignorePath = path.join(baseDirectory, gitignoreFileName);

    if (await confirmOverwriteFile(context, gitignorePath)) {
      await fse.writeFile(gitignorePath, this.gitignore.concat(getGitIgnoreContent()));
    }

    const funcIgnorePath: string = path.join(context.projectPath, funcIgnoreFileName);
    if (await confirmOverwriteFile(context, funcIgnorePath)) {
      await fse.writeFile(funcIgnorePath, this.funcignore.sort().join(os.EOL));
    }
  }

  protected async getHostContent(context: IActionContext): Promise<IHostJsonV2> {
    const hostJson: IHostJsonV2 = {
      version: '2.0',
      logging: {
        applicationInsights: {
          samplingSettings: {
            isEnabled: true,
            excludedTypes: 'Request',
          },
        },
      },
    };

    await addDefaultBundle(context, hostJson);

    return hostJson;
  }
}
