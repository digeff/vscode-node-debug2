/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
import {
    injectable, IServiceComponent, inject, TYPES, IDebuggeePausedHandler, utils, logger, PausedEvent, BaseNotifyClientOfPause, IEventsToClientReporter,
    IActionToTakeWhenPaused, BasePauseShouldBeAutoResumed, IDebuggeeExecutionController, printClassDescription, NoActionIsNeededForThisPause
} from 'vscode-chrome-debug-core';
import { getDA } from '../v1-backwards-compatiblity/getDA';
import { ActionToTakeWhenPausedClass } from 'vscode-chrome-debug-core/lib/src/chrome/internal/features/pauseActionsPriorities';
import { IConnectedCDAConfiguration } from 'vscode-chrome-debug-core';
import { ICommonRequestArgs } from '../nodeDebugInterfaces';

@printClassDescription
export class PausedOnNodeStartShouldAutoResume extends BasePauseShouldBeAutoResumed {
    constructor(protected readonly _debuggeeExecutionControl: IDebuggeeExecutionController) {
        super();
    }
}

@printClassDescription
export class PausedOnEntry extends BaseNotifyClientOfPause {
    protected readonly reason = 'entry';

    constructor(protected readonly _eventsToClientReporter: IEventsToClientReporter) {
        super();
    }
}

@injectable()
export class PauseOnStartHandler implements IServiceComponent {
    private readonly waitUntilConfigurationDone = utils.promiseDefer();

    public constructor(
        @inject(TYPES.IDebuggeePausedHandler) private readonly _debuggeePausedHandler: IDebuggeePausedHandler,
        @inject(TYPES.ConnectedCDAConfiguration) private readonly _configuration: IConnectedCDAConfiguration,
        @inject(TYPES.IEventsToClientReporter) private readonly _eventsToClientReporter: IEventsToClientReporter,
        @inject(TYPES.IDebuggeeExecutionController) private readonly _debuggeeExecutionControl: IDebuggeeExecutionController) { }

    public install(): this {
        this._debuggeePausedHandler.registerActionProvider(paused => this.onPaused(paused));
        const actions = this._debuggeePausedHandler.actionsFromHighestToLowestPriority;
        actions.unshift(<ActionToTakeWhenPausedClass><unknown>PausedOnNodeStartShouldAutoResume);
        actions.unshift(<ActionToTakeWhenPausedClass><unknown>PausedOnEntry);
        this._debuggeePausedHandler.updatePauseActionsPriorities(actions);
        getDA().onConfigurationDoneCall(() => this.waitUntilConfigurationDone.resolve());
        return this;
    }

    public async onPaused(paused: PausedEvent): Promise<IActionToTakeWhenPaused> {
        const pausedOnEntry = await getDA().onPaused(paused);
        if (pausedOnEntry.didPause) {
            if ((<ICommonRequestArgs>this._configuration.args).stopOnEntry) {
                return new PausedOnEntry(this._eventsToClientReporter);
            } else {
                logger.log(`Blocking onPaused handler until configuration is done`);
                await this.waitUntilConfigurationDone.promise;
                // TODO: Verify whether we stopped on a breakpoint or debugger statement, and decide what to do based on that
                return new PausedOnNodeStartShouldAutoResume(this._debuggeeExecutionControl);
            }
        }

        return new NoActionIsNeededForThisPause(this);
    }
}
