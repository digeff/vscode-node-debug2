/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import { ISourceToClientConverter, ILoadedSource } from 'vscode-chrome-debug-core';
import { DebugProtocol } from 'vscode-debugprotocol';
import { getDA } from '../v1-backwards-compatiblity/getDA';

export class CustomSourceToClientConverter implements ISourceToClientConverter {
    public constructor(private readonly _wrapped: ISourceToClientConverter) { }

    public async toSource(loadedSource: ILoadedSource): Promise<DebugProtocol.Source> {
        const original = await this._wrapped.toSource(loadedSource);
        original.path = getDA().realPathToDisplayPath(original.path);
        return original;
    }
}