import defaults from './default.js';
import state from './state.js';
import setHandler from './handler.js';

class PullToRefresh {

    constructor(options) {
        this.options = Object.assign({}, defaults, options);
        this.state = JSON.parse(JSON.stringify(state));
        this._init(this.options);
    }

    _init(options) {
        if (!options) {
            options = {};
        }
        let handler = setHandler(options, this.state);

        // store offset for later unsubscription
        handler.offset = this.state.handlers.push(handler) - 1;
        if (options.autoRefresh) {
            this._initAutoRefresh(handler);
        }

        return handler;
    }

    _initAutoRefresh(handler) {
        this.state.events && this.state.events.initAutoRefresh(handler);
    }

    autoRefresh(cb) {
        this.state.events && this.state.events.autoRefresh(cb);
    }

    stop() {
        this.state.events && this.state.events.stop();
    }

    destroyAll() {
        if (this.state.events) {
            this.state.events.destroy();
            this.state.events = null;
        }

        this.state.handlers.forEach(function (handler) {
            if (handler.ptrElement && handler.ptrElement.parentNode) {
                handler.ptrElement.parentNode.removeChild(handler.ptrElement);
                handler.ptrElement = null;
            }
            handler.destroy();
        });
    }
}

export default PullToRefresh;

