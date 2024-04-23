import { test, expect } from '@playwright/test';

test(
  'Mock: Expect Copy and Paste of Scopes to work on single workflow',
  {
    tag: '@mock',
  },
  async ({ page, browserName, context }) => {
    if (browserName === 'webkit') {
      context.grantPermissions(['clipboard-read'], { origin: 'http://localhost:4200' });
    }
    await page.goto('/');
    await page.getByText('Select an option').click();
    await page.getByRole('option', { name: 'Conditionals', exact: true }).click();
    await page.getByRole('button', { name: 'Toolbox' }).click();
    await page.waitForLoadState('networkidle');
    await page.getByTestId('rf__node-Condition-#scope').getByRole('button', { name: 'Condition' }).focus();
    await page.keyboard.press('Meta+C');
    await page.getByTestId('rf__edge-Initialize_variable-Condition').getByLabel('Insert a new step between').focus();
    await page.keyboard.press('Meta+V');
    const serialized: any = await page.evaluate(() => {
      return new Promise((resolve) => {
        setTimeout(() => {
          const state = (window as any).DesignerStore.getState();
          resolve((window as any).DesignerModule.serializeBJSWorkflow(state));
        }, 5000);
      });
    });
    expect(serialized.definition).toEqual(verificationWorkflow);
  }
);

const verificationWorkflow = {
  $schema: 'https://schema.management.azure.com/providers/Microsoft.Logic/schemas/2016-06-01/workflowdefinition.json#',
  actions: {
    Condition: {
      type: 'If',
      expression: {
        or: [
          {
            equals: ['abc@microsoft.com', "@variables('goalOwner')"],
          },
          {
            equals: ['@null', "@variables('goalOwner')"],
          },
          {
            not: {
              equals: ['@true', "@variables('goalOwner')"],
            },
          },
          {
            and: [
              {
                not: {
                  endsWith: ['@{concat(concat(concat(concat())))}', "@variables('goalOwner')"],
                },
              },
              {
                equals: [null, "@variables('goalOwner')"],
              },
            ],
          },
        ],
      },
      actions: {
        Terminate: {
          type: 'Terminate',
          inputs: {
            runStatus: 'Succeeded',
          },
        },
      },
      else: {
        actions: {
          Terminate_2: {
            type: 'Terminate',
            inputs: {
              runStatus: 'Failed',
              runError: {
                code: 'CreateAndGetGoalFailed',
                message: 'Created goal does not match expected goal',
              },
            },
          },
        },
      },
      runAfter: {
        'Condition-copy': ['SUCCEEDED'],
      },
    },
    Initialize_variable: {
      type: 'InitializeVariable',
      inputs: {
        variables: [
          {
            name: 'goalOwner',
            type: 'string',
            value: '@null',
          },
        ],
      },
      runAfter: {},
    },
    'Condition-copy': {
      type: 'If',
      expression: {
        or: [
          {
            equals: ['abc@microsoft.com', "@variables('goalOwner')"],
          },
          {
            equals: ['@null', "@variables('goalOwner')"],
          },
          {
            not: {
              equals: ['@true', "@variables('goalOwner')"],
            },
          },
          {
            and: [
              {
                not: {
                  endsWith: ['@{concat(concat(concat(concat())))}', "@variables('goalOwner')"],
                },
              },
              {
                equals: [null, "@variables('goalOwner')"],
              },
            ],
          },
        ],
      },
      actions: {
        Terminate_1: {
          type: 'Terminate',
          inputs: {
            runStatus: 'Succeeded',
          },
        },
      },
      else: {
        actions: {
          Terminate_3: {
            type: 'Terminate',
            inputs: {
              runStatus: 'Failed',
              runError: {
                code: 'CreateAndGetGoalFailed',
                message: 'Created goal does not match expected goal',
              },
            },
          },
        },
      },
      runAfter: {
        Initialize_variable: ['Succeeded'],
      },
    },
  },
  contentVersion: '1.0.0.0',
  outputs: {},
  triggers: {
    Recurrence: {
      type: 'Recurrence',
      recurrence: {
        frequency: 'Month',
        interval: 1,
      },
    },
  },
};