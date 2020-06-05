// Schema generated with
//   typescript-json-schema tsconfig.json AnySuite --required
export const anySuiteSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  anyOf: [
    {
      $ref: '#/definitions/LogicalTestSuite<TURN>',
    },
    {
      $ref: '#/definitions/LogicalValidationSuite<TURN>',
    },
    {
      allOf: [
        {
          $ref: '#/definitions/GenericSuite<ScoredStep<TURN>>',
        },
        {
          $ref: '#/definitions/AggregatedMeasuresField',
        },
      ],
    },
  ],
  definitions: {
    AggregatedMeasures: {
      properties: {
        completeSteps: {
          type: 'number',
        },
        notes: {
          type: 'string',
        },
        perfectSteps: {
          type: 'number',
        },
        totalRepairs: {
          type: 'number',
        },
        totalSteps: {
          type: 'number',
        },
        totalTests: {
          type: 'number',
        },
      },
      required: [
        'completeSteps',
        'notes',
        'perfectSteps',
        'totalRepairs',
        'totalSteps',
        'totalTests',
      ],
      type: 'object',
    },
    AggregatedMeasuresField: {
      properties: {
        measures: {
          $ref: '#/definitions/AggregatedMeasures',
        },
      },
      required: ['measures'],
      type: 'object',
    },
    Expected: {
      properties: {
        cart: {
          $ref: '#/definitions/LogicalCart',
        },
      },
      required: ['cart'],
      type: 'object',
    },
    'GenericCase<ScoredStep<TURN>>': {
      properties: {
        comment: {
          type: 'string',
        },
        id: {
          type: 'number',
        },
        steps: {
          items: {
            allOf: [
              {
                $ref: '#/definitions/Step<TURN>_1',
              },
              {
                $ref: '#/definitions/Expected',
              },
              {
                $ref: '#/definitions/MeasuresField',
              },
            ],
          },
          type: 'array',
        },
        suites: {
          type: 'string',
        },
      },
      required: ['comment', 'id', 'steps', 'suites'],
      type: 'object',
    },
    'GenericCase<Step<TURN>>': {
      properties: {
        comment: {
          type: 'string',
        },
        id: {
          type: 'number',
        },
        steps: {
          items: {
            $ref: '#/definitions/Step<TURN>',
          },
          type: 'array',
        },
        suites: {
          type: 'string',
        },
      },
      required: ['comment', 'id', 'steps', 'suites'],
      type: 'object',
    },
    'GenericCase<ValidationStep<TURN>>': {
      properties: {
        comment: {
          type: 'string',
        },
        id: {
          type: 'number',
        },
        steps: {
          items: {
            allOf: [
              {
                $ref: '#/definitions/Step<TURN>_1',
              },
              {
                $ref: '#/definitions/Expected',
              },
            ],
          },
          type: 'array',
        },
        suites: {
          type: 'string',
        },
      },
      required: ['comment', 'id', 'steps', 'suites'],
      type: 'object',
    },
    'GenericSuite<ScoredStep<TURN>>': {
      properties: {
        comment: {
          type: 'string',
        },
        tests: {
          items: {
            anyOf: [
              {
                $ref: '#/definitions/GenericSuite<ScoredStep<TURN>>_1',
              },
              {
                $ref: '#/definitions/GenericCase<ScoredStep<TURN>>',
              },
            ],
          },
          type: 'array',
        },
      },
      required: ['tests'],
      type: 'object',
    },
    'GenericSuite<ScoredStep<TURN>>_1': {
      properties: {
        comment: {
          type: 'string',
        },
        tests: {
          items: {
            anyOf: [
              {
                $ref: '#/definitions/GenericSuite<ScoredStep<TURN>>_1',
              },
              {
                $ref: '#/definitions/GenericCase<ScoredStep<TURN>>',
              },
            ],
          },
          type: 'array',
        },
      },
      required: ['tests'],
      type: 'object',
    },
    'GenericSuite<Step<TURN>>': {
      properties: {
        comment: {
          type: 'string',
        },
        tests: {
          items: {
            anyOf: [
              {
                $ref: '#/definitions/GenericSuite<Step<TURN>>',
              },
              {
                $ref: '#/definitions/GenericCase<Step<TURN>>',
              },
            ],
          },
          type: 'array',
        },
      },
      required: ['tests'],
      type: 'object',
    },
    'GenericSuite<ValidationStep<TURN>>': {
      properties: {
        comment: {
          type: 'string',
        },
        tests: {
          items: {
            anyOf: [
              {
                $ref: '#/definitions/GenericSuite<ValidationStep<TURN>>',
              },
              {
                $ref: '#/definitions/GenericCase<ValidationStep<TURN>>',
              },
            ],
          },
          type: 'array',
        },
      },
      required: ['tests'],
      type: 'object',
    },
    LogicalCart: {
      properties: {
        items: {
          items: {
            $ref: '#/definitions/LogicalItem',
          },
          type: 'array',
        },
      },
      required: ['items'],
      type: 'object',
    },
    LogicalItem: {
      properties: {
        children: {
          items: {
            $ref: '#/definitions/LogicalItem',
          },
          type: 'array',
        },
        name: {
          type: 'string',
        },
        quantity: {
          type: 'number',
        },
        sku: {
          type: 'string',
        },
      },
      required: ['children', 'name', 'quantity', 'sku'],
      type: 'object',
    },
    'LogicalTestSuite<TURN>': {
      properties: {
        comment: {
          type: 'string',
        },
        tests: {
          items: {
            anyOf: [
              {
                $ref: '#/definitions/GenericSuite<Step<TURN>>',
              },
              {
                $ref: '#/definitions/GenericCase<Step<TURN>>',
              },
            ],
          },
          type: 'array',
        },
      },
      required: ['tests'],
      type: 'object',
    },
    'LogicalValidationSuite<TURN>': {
      properties: {
        comment: {
          type: 'string',
        },
        tests: {
          items: {
            anyOf: [
              {
                $ref: '#/definitions/GenericSuite<ValidationStep<TURN>>',
              },
              {
                $ref: '#/definitions/GenericCase<ValidationStep<TURN>>',
              },
            ],
          },
          type: 'array',
        },
      },
      required: ['tests'],
      type: 'object',
    },
    Measures: {
      properties: {
        complete: {
          type: 'boolean',
        },
        perfect: {
          type: 'boolean',
        },
        repairs: {
          properties: {
            cost: {
              type: 'number',
            },
            steps: {
              items: {
                type: 'string',
              },
              type: 'array',
            },
          },
          required: ['cost', 'steps'],
          type: 'object',
        },
      },
      required: ['complete', 'perfect'],
      type: 'object',
    },
    MeasuresField: {
      properties: {
        measures: {
          $ref: '#/definitions/Measures',
        },
      },
      required: ['measures'],
      type: 'object',
    },
    'Step<TURN>': {
      properties: {
        turns: {
          items: {
            $ref: '#/definitions/TURN',
          },
          type: 'array',
        },
      },
      required: ['turns'],
      type: 'object',
    },
    'Step<TURN>_1': {
      properties: {
        turns: {
          items: {
            $ref: '#/definitions/TURN',
          },
          type: 'array',
        },
      },
      required: ['turns'],
      type: 'object',
    },
    TURN: {
      properties: {
        audio: {
          type: 'string',
        },
        speaker: {
          type: 'string',
        },
        transcription: {
          type: 'string',
        },
      },
      required: ['speaker'],
      type: 'object',
    },
  },
};
