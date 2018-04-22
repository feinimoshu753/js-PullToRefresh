import {addDom, updateDom, resetDom} from 'dom.js';
import throttle from '../util/throttle.js';

export default function event(state) {
    let _el;
    let lastMove = 0;
    let hourRotate = 0;
    let minuteRotate = 90;
    let clockTimer;
    let throttleFun = throttle(_clockRun, 30, 60);

    function _onTouchStart(e) {
        lastMove = 0;
        hourRotate = 0;
        minuteRotate = 90;
        // here, we must pick a handler first, and then append their html/css on the DOM
        let target = state.handlers.filter(function (h) {
            return h.contains(e.target);
        })[0];

        state.enable = !!target;

        if (target && state.state === 'pending') {
            _el = addDom(target, state);

            if (target.shouldPullToRefresh()) {
                state.pullStartY = e.touches[0].screenY;
            }

            clearTimeout(state.timeout);

            updateDom(target, state);
        }
    }

    function _onTouchMove(e) {
        throttleFun(_el, e.touches[0].screenY);

        if (!state.enable) {
            return;
        }

        if (!state.pullStartY) {
            if (_el.shouldPullToRefresh()) {
                state.pullStartY = e.touches[0].screenY;
            }
        } else {
            state.pullMoveY = e.touches[0].screenY;
        }

        if (state.state === 'refreshing') {
            if (_el.shouldPullToRefresh() && state.pullStartY < state.pullMoveY) {
                e.preventDefault();
            }

            return;
        }

        if (state.state === 'pending') {
            _el.ptrElement.classList.add(((_el.classPrefix) + "pull"));
            state.state = 'pulling';
            updateDom(_el, state);
        }

        if (state.pullStartY && state.pullMoveY) {
            state.dist = state.pullMoveY - state.pullStartY;
        }

        if (state.dist > 0) {
            e.preventDefault();

            _el.ptrElement.style[_el.cssProp] = (state.distResisted) + "px";

            state.distResisted = _el.resistanceFunction(state.dist / _el.distThreshold) * Math.min(_el.distMax, state.dist);

            if (state.state === 'pulling' && state.distResisted > _el.distThreshold) {
                _el.ptrElement.classList.add(((_el.classPrefix) + "release"));
                state.state = 'releasing';
                updateDom(_el, state);
            }

            if (state.state === 'releasing' && state.distResisted < _el.distThreshold) {
                _el.ptrElement.classList.remove(((_el.classPrefix) + "release"));
                state.state = 'pulling';
                updateDom(_el, state);
            }
        }
    }

    function _onTouchEnd() {
        if (!state.enable) {
            return;
        }

        if (state.state === 'releasing' && state.distResisted > _el.distThreshold) {
            state.state = 'refreshing';

            _el.ptrElement.style[_el.cssProp] = (_el.distReload) + "px";
            _el.ptrElement.classList.add(((_el.classPrefix) + "refresh"));
            _el.onRefresh();
            _clockRollBack(_el);

        } else {
            if (state.state === 'refreshing') {
                return;
            }

            _el.ptrElement.style[_el.cssProp] = '0px';

            state.state = 'pending';
        }

        updateDom(_el, state);

        _el.ptrElement.classList.remove(((_el.classPrefix) + "release"));
        _el.ptrElement.classList.remove(((_el.classPrefix) + "pull"));

        state.pullStartY = state.pullMoveY = null;
        state.dist = state.distResisted = 0;
    }

    function _onScroll() {
        if (_el) {
            _el.mainElement.classList.toggle(((_el.classPrefix) + "top"), _el.shouldPullToRefresh());
        }
    }

    function _clockRun(handler, touchY) {
        if (lastMove === 0) {
            lastMove = touchY;
            return;
        }

        let minuteEl = handler.ptrElement.querySelector(("." + (handler.classPrefix) + "minute"));
        let hourEl = handler.ptrElement.querySelector(("." + (handler.classPrefix) + "hour"));
        if (touchY - lastMove > 0) {
            minuteRotate += 15;
            hourRotate += 15 / 12;
        } else {
            minuteRotate -= 15;
            hourRotate -= 15 / 12;
        }
        _clockRunAnimate(minuteEl, minuteRotate);
        _clockRunAnimate(hourEl, hourRotate);
        lastMove = touchY;
    }

    function _clockRollBack(handler) {
        let minuteEl = handler.ptrElement.querySelector(("." + (handler.classPrefix) + "minute"));
        let hourEl = handler.ptrElement.querySelector(("." + (handler.classPrefix) + "hour"));
        clockTimer = setInterval(function () {
            minuteRotate -= 15;
            hourRotate -= 15 / 12;
            _clockRunAnimate(minuteEl, minuteRotate);
            _clockRunAnimate(hourEl, hourRotate);
        }, 90);
    }

    function _clockRunAnimate(el, rotate) {
        if (!el) {
            return;
        }
        el.style.transform = 'rotate(' + rotate + 'deg)';
        el.style.webkitTransform = 'rotate(' + rotate + 'deg)';
    }

    let _passiveSettings = state.supportsPassive
        ? {passive: state.passive || false}
        : undefined;

    window.addEventListener('touchend', _onTouchEnd);
    window.addEventListener('touchstart', _onTouchStart);
    window.addEventListener('touchmove', _onTouchMove, _passiveSettings);
    window.addEventListener('scroll', _onScroll);

    return {
        onTouchEnd: _onTouchEnd,
        onTouchStart: _onTouchStart,
        onTouchMove: _onTouchMove,
        onScroll: _onScroll,

        initAutoRefresh: function (handler) {
            state.enable = true;

            _el = addDom(handler, state);
            if (handler.shouldPullToRefresh()) {
                state.pullStartY = 0;
            }
            clearTimeout(state.timeout);
            updateDom(_el, state);
        },
        autoRefresh: function (cb) {
            if (!state.enable) {
                return;
            }
            state.state = 'refreshing';
            _el.ptrElement.style[_el.cssProp] = (_el.distReload) + "px";
            _el.ptrElement.classList.add(((_el.classPrefix) + "refresh"));
            updateDom(_el, state);
            _clockRollBack(_el);
            cb ? cb() : _el.onRefresh();
            state.pullStartY = state.pullMoveY = null;
            state.dist = state.distResisted = 0;
        },
        stop: function () {
            resetDom(_el, state);
            if (clockTimer) {
                clearInterval(clockTimer);
                clockTimer = null;
            }
            lastMove && (lastMove = 0);
            minuteRotate && (minuteRotate = 90);
            hourRotate && (hourRotate = 0);
        },
        destroy: function destroy() {
            // Teardown event listeners
            window.removeEventListener('touchstart', _onTouchStart);
            window.removeEventListener('touchend', _onTouchEnd);
            window.removeEventListener('touchmove', _onTouchMove, _passiveSettings);
            window.removeEventListener('scroll', _onScroll);
        },
    };
}