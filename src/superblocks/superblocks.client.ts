// Copyright 2019 Superblocks AB
//
// This file is part of Superblocks.
//
// Superblocks is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation version 3 of the License.
//
// Superblocks is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Superblocks.  If not, see <http://www.gnu.org/licenses/>.
// import fetch from 'node-fetch';
import { ITransactionModel, IDeploymentModel, ITransactionParamsModel, IMetadataModel } from './models';
import { injectable, inject } from 'inversify';
import { TYPES } from '../ioc/types';
import { Fetch, ISuperblocksUtils, ISuperblocksClient } from '../ioc/interfaces';
import { Response } from 'node-fetch';

@injectable()
export class SuperblocksClient implements ISuperblocksClient {
    private fetch: Fetch;
    private utils: ISuperblocksUtils;

    public constructor(
        @inject(TYPES.Fetch) fetch: Fetch,
        @inject(TYPES.SuperblocksUtils) utils: ISuperblocksUtils,
    ) {
        this.fetch = fetch;
        this.utils = utils;
    }

    async createDeployment(projectId: string, token: string, environment: string, metadata?: IMetadataModel): Promise<IDeploymentModel> {
        const response = await this.fetch(`${this.utils.getApiBaseUrl()}/build-configs/${projectId}/deployments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'project-token': token
            },
            body: JSON.stringify({
                environment,
                type: 'ethereum',
                metadata
            })
        });

        if (response.ok) {
            const deployment = await response.json();
            console.log('[Superblocks Provider] deployment created:\n\n', JSON.stringify(deployment, undefined, 4));
            return deployment;
        } else {
            const error = await response.text();
            throw new Error(`[Superblocks Provider] cannot create a deployment for project ${projectId}: ${error}`);
        }
    }

    async sendEthTransaction(deploymentId: string, token: string, transaction: ITransactionParamsModel): Promise<ITransactionModel> {
        const response = <Response> await this.fetch(`${this.utils.getApiBaseUrl()}/deployments/${deploymentId}/transactions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'project-token': token
            },
            body: JSON.stringify(transaction)
        });

        if (response.ok) {
            const tx = await response.json();
            return tx;
        } else {
            throw new Error(`[Superblocks Provider] The tx could not be sent to Superblocks. Status Code: ${response.status}`);
        }
    }

    async addTransactionReceipt(deploymentId: string, token: string, txId: string, txHash: string): Promise<void> {
        const response = await this.fetch(`${this.utils.getApiBaseUrl()}/deployments/${deploymentId}/transactions/${txId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'project-token': token
                },
                body: JSON.stringify({ txHash })
        });

        if (response.ok) {
            return;
        } else {
            const error = await response.text();
            throw new Error(`[Superblocks Provider] The Tx receipt could not be sent to Superblocks': ${error}`);
        }
    }
}
