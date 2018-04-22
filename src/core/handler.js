import defaults from './default.js'
import setEvents from './event.js';

const _methods = ['mainElement', 'ptrElement', 'triggerElement'];

export default function setupHandler(options, state) {
    let _handler = {};

    // merge options with defaults
    Object.keys(defaults).forEach(function (key) {
        _handler[key] = options[key] || defaults[key];
    });

    // normalize timeout value, even if it is zero
    _handler.refreshTimeout = typeof options.refreshTimeout === 'number'
        ? options.refreshTimeout
        : defaults.refreshTimeout;

    // normalize elements
    _methods.forEach(function (method) {
        if (typeof _handler[method] === 'string') {
            _handler[method] = document.querySelector(_handler[method]);
        }
    });

    // attach events lazily
    if (!state.events) {
        state.events = setEvents(state);
    }

    _handler.contains = function (target) {
        return _handler.triggerElement.contains(target);
    };

    _handler.destroy = function () {
        // stop pending any pending callbacks
        clearTimeout(state.timeout);

        // remove handler from state state
        state.handlers.splice(_handler.offset, 1);
    };

    return _handler;
}