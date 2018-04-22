function addDom(handler, state) {
    if (!handler.ptrElement) {
        let ptr = document.createElement('div');

        if (handler.mainElement !== document.body) {
            handler.mainElement.parentNode.insertBefore(ptr, handler.mainElement);
        } else {
            document.body.insertBefore(ptr, document.body.firstChild);
        }

        ptr.classList.add(((handler.classPrefix) + "ptr"));
        ptr.innerHTML = handler.getMarkup()
            .replace(/__PREFIX__/g, handler.classPrefix);

        handler.ptrElement = ptr;

        if (typeof handler.onInit === 'function') {
            handler.onInit(handler);
        }

        // Add the css styles to the style node, and then
        // insert it into the dom
        if (!state.styleEl) {
            state.styleEl = document.createElement('style');
            state.styleEl.setAttribute('id', 'pull-to-refresh-js-style');

            document.head.appendChild(state.styleEl);
        }

        state.styleEl.textContent = handler.getStyles()
            .replace(/__PREFIX__/g, handler.classPrefix)
            .replace(/\s+/g, ' ');
    }

    return handler;
}

function resetDom(handler, state) {
    if (handler && handler.ptrElement) {
        handler.ptrElement.classList.remove(((handler.classPrefix) + "refresh"));
        handler.ptrElement.style[handler.cssProp] = '0px';
    }

    // remove previous ptr-element from DOM
    if (handler.ptrElement && handler.ptrElement.parentNode) {
        handler.ptrElement.parentNode.removeChild(handler.ptrElement);
        handler.ptrElement = null;
    }

    // remove used stylesheet from DOM
    if (state.styleEl) {
        document.head.removeChild(state.styleEl);
    }

    // reset state
    state.styleEl = null;
    state.state = 'pending';
}

function updateDom(handler, state) {
    let textEl = handler.ptrElement.querySelector(("." + (handler.classPrefix) + "text"));
    if (state.state === 'releasing') {
        textEl.innerHTML = handler.instructionsReleaseToRefresh;
    }

    if (state.state === 'pulling' || state.state === 'pending') {
        textEl.innerHTML = handler.instructionsPullToRefresh;
    }

    if (state.state === 'refreshing') {
        textEl.innerHTML = handler.instructionsRefreshing;
    }
}

export {
    addDom,
    resetDom,
    updateDom
}