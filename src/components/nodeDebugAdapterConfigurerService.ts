/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
import { IServiceComponent, injectable, inject, TYPES, CDTP } from 'vscode-chrome-debug-core';
import { getDA } from '../v1-backwards-compatiblity/getDA';

@injectable()
export class NodeDebugAdapterConfigurerService implements IServiceComponent {
    public constructor(
        @inject(TYPES.CDTPClient) private readonly _protocolApi: CDTP.ProtocolApi) { }

    public install(): this {
        getDA().configureProtocolApi(this._protocolApi);
        return this;
    }
}
