import set from 'lodash/set';
import {
	ApplicationError,
	NodeOperationError,
	type IExecuteFunctions,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeBaseDescription,
	type INodeTypeDescription,
} from 'n8n-workflow';
import { ENABLE_LESS_STRICT_TYPE_VALIDATION } from '../../../utils/constants';

export class FilterV2 implements INodeType {
	description: INodeTypeDescription;

	constructor(baseDescription: INodeTypeBaseDescription) {
		this.description = {
			...baseDescription,
			version: 2,
			defaults: {
				name: 'Filter',
				color: '#229eff',
			},
			inputs: ['main'],
			outputs: ['main'],
			outputNames: ['Kept', 'Discarded'],
			parameterPane: 'wide',
			properties: [
				{
					displayName: 'Conditions',
					name: 'conditions',
					placeholder: 'Add Condition',
					type: 'filter',
					default: {},
					typeOptions: {
						filter: {
							caseSensitive: '={{!$parameter.options.ignoreCase}}',
							typeValidation: '={{$parameter.options.looseTypeValidation ? "loose" : "strict"}}',
						},
					},
				},
				{
					displayName: 'Options',
					name: 'options',
					type: 'collection',
					placeholder: 'Add option',
					default: {},
					options: [
						{
							displayName: 'Ignore Case',
							description: 'Whether to ignore letter case when evaluating conditions',
							name: 'ignoreCase',
							type: 'boolean',
							default: true,
						},
						{
							displayName: 'Less Strict Type Validation',
							description: 'Whether to try casting value types based on the selected operator',
							name: 'looseTypeValidation',
							type: 'boolean',
							default: true,
						},
					],
				},
			],
		};
	}

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const keptItems: INodeExecutionData[] = [];
		const discardedItems: INodeExecutionData[] = [];

		this.getInputData().forEach((item, itemIndex) => {
			try {
				const options = this.getNodeParameter('options', itemIndex) as {
					ignoreCase?: boolean;
					looseTypeValidation?: boolean;
				};
				let pass = false;
				try {
					pass = this.getNodeParameter('conditions', itemIndex, false, {
						extractValue: true,
					}) as boolean;
				} catch (error) {
					if (!options.looseTypeValidation && !error.description) {
						set(error, 'description', ENABLE_LESS_STRICT_TYPE_VALIDATION);
					}
					set(error, 'context.itemIndex', itemIndex);
					set(error, 'node', this.getNode());
					throw error;
				}

				if (item.pairedItem === undefined) {
					item.pairedItem = { item: itemIndex };
				}

				if (pass) {
					keptItems.push(item);
				} else {
					discardedItems.push(item);
				}
			} catch (error) {
				if (this.continueOnFail(error)) {
					discardedItems.push(item);
				} else {
					if (error instanceof NodeOperationError) {
						throw error;
					}

					if (error instanceof ApplicationError) {
						set(error, 'context.itemIndex', itemIndex);
						throw error;
					}

					throw new NodeOperationError(this.getNode(), error, {
						itemIndex,
					});
				}
			}
		});

		return [keptItems, discardedItems];
	}
}
