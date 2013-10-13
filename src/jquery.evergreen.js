// jQuery Evergreen
// ----------------
//
// jQuery Evergreen works with modern browsers.
// It has the same familiar API as jQuery 1.x and 2.x, but under the hood has the major difference that it
// works with live Node and NodeList objects (instead of the Array-like `$` objects).
//
// The native `Node` and `NodeList` objects are extended to fill up the chainable API, like `forEach`, `addClass`, `append`, `on`.
// Methods already on the `Node` or `NodeList` prototype are not overridden (i.e. use native method if available).
// Much of the original jQuery's "weight" is not included at all, such as `$.ajax`, `$.animate`, and `$.Deferred`.
//
// It's under 5KB after minification (<1.5KB gzipped).
//
// Browser support: latest version of Chrome, Firefox, Safari, Opera, Chrome Mobile iOS, and Mobile Safari. IE10 and IE11.
// IE9 only needs a polyfill for `classList` to make all tests pass.

(function(root, factory) {
    if(typeof define === 'function' && define.amd) {
        define(factory);
    } else {
        root.$ = factory();
    }
}(this, function() {

    // Query selector
    // --------------

    // `$` is basically a wrapper for `querySelectorAll`.

    var $ = function(selector, context) {

        if(!selector) {
            return document.querySelectorAll(null);
        }

        // If `selector` doesn't look like a string, return (maybe a DOM element?)

        if(typeof selector !== 'string') {
            return selector;
        }

        // If `selector` looks like an HTML string, create and return a DOM fragment.

        if(/^\s*<(\w+|!)[^>]*>/.test(selector)) {
            return createFragment(selector);
        }

        // The `context` to query elements (default: `document`).
        // It can be either a string or a Node (or a NodeList, the first Node will be used).

        context = context ? typeof context === 'string' ? document.querySelector(context) : context.length ? context[0] : context : document;

        // For least surprises, always return a `NodeList`.

        return context.querySelectorAll(selector);

    };

    // Chaining for the `$` wrapper (aliasing `find` for `$`)
    //
    //     $('.selectors).$('.deep').find('.deepest');

    Node.prototype.$ = Node.prototype.find = function(selector) {
        return $(selector, this);
    };

    NodeList.prototype.$ = NodeList.prototype.find = function(selector) {
        return $(selector, this[0]);
    };

    // Create DOM fragment from an HTML string

    var createFragment = function(html) {

        var fragment = document.createDocumentFragment(),
            container = document.createElement('div');

        container.innerHTML = html.trim();

        while(container.firstChild) {
            fragment.appendChild(container.firstChild);
        }

        // Return a single element if possible

        return fragment.childNodes.length === 1 ? fragment.firstChild : fragment.childNodes;
    };

    // Array methods
    // -------------

    // Augment with every, filter, forEach, some, map

    ['every', 'filter', 'forEach', 'some', 'map'].forEach(function(fn) {
        NodeList.prototype[fn] = NodeList.prototype[fn] || [][fn];
    });

    //  Aliasing `each` for `forEach`.

    NodeList.prototype['each'] = []['forEach'];

    // Convert `NodeList` to `Array`.

    NodeList.prototype.toArray = NodeList.prototype.toArray || function() {
        return Array.prototype.slice.call(this);
    };

    // Class methods
    // -------------

    // Chainable API for native `classList`.
    //
    //     $('.myElement').addClass('myClass');

    ['add', 'remove', 'toggle'].forEach(function(fn) {

        Node.prototype[fn + 'Class'] = Node.prototype[fn + 'Class'] || function(value) {
            this.classList[fn](value)
            return this;
        };

        NodeList.prototype[fn + 'Class'] = NodeList.prototype[fn + 'Class'] || function(value) {
            this.forEach(function(element) {
                element.classList[fn](value)
            });
            return this;
        };
    });

    // And hasClass.
    //
    //     $('.myElement').hasClass('myClass');

    Node.prototype.hasClass = Node.prototype.hasClass || function(value) {
        return this.classList.contains(value)
    };

    NodeList.prototype.hasClass = NodeList.prototype.hasClass || function(value) {
        return this.some(function(element) {
            return element.classList.contains(value)
        });
    };

    // DOM Manipulation
    // ----------------
    //
    //     $('.myElement').append('<span>more</span>');
    //     $('.myList').append('<span>more</span>');

    Node.prototype.append = Node.prototype.append || function(element) {
        if(typeof element === 'string') {
            this.insertAdjacentHTML('beforeend', element);
        } else {
            if(element.length) {
                var elements = element instanceof NodeList ? element.toArray() : element;
                elements.forEach(this.appendChild.bind(this));
            } else {
                this.appendChild(element);
            }
        }
        return this;
    };

    //     $('.myElement').before(element);

    Node.prototype.before = Node.prototype.before || function(element) {
        if(typeof element === 'string') {
            this.insertAdjacentHTML('beforebegin', element)
        } else {
            if(element.length) {
                var elements = element instanceof NodeList ? element.toArray() : element;
                elements.forEach(this.before.bind(this));
            } else {
                this.parentNode.insertBefore(element, this);
            }
        }
        return this;
    };

    //     $('.myList').after(elements);

    Node.prototype.after = Node.prototype.after || function(element) {
        if(typeof element === 'string') {
            this.insertAdjacentHTML('afterend', element)
        } else {
            if(element.length) {
                var elements = element instanceof NodeList ? element.toArray() : element;
                elements.reverse().forEach(this.after.bind(this));
            } else {
                this.parentNode.insertBefore(element, this.nextSibling);
            }
        }
        return this;
    };

    // Also extend `NodeList` with `append`, `before` and `after`.
    // The method clones provided elements (except for last iteration).

    ['append', 'before', 'after'].forEach(function(fn) {
        NodeList.prototype[fn] = NodeList.prototype[fn] || function(originalElement) {
            var lastIndex = this.length - 1;
            this.toArray().forEach(function(el, index) {
                var element = index === lastIndex ? originalElement : clone(originalElement);
                el[fn](element);
            });
            return this;
        };
    });

    var clone = function(element) {
        if(typeof element === 'string') {
            return '' + element;
        } else if(element instanceof Node) {
            return element.cloneNode(true);
        } else if(element instanceof NodeList) {
            return element.map(function(el) {
                return el.cloneNode(true);
            })
        }
        return element;
    };

    // Events
    // ------
    //
    // Chainable shorthand for `addEventListener`.
    // Delegates to `delegate` if that signature is used.
    //
    //     element.on('click', callback);
    //     element.trigger('click');

    Node.prototype.on = Node.prototype.on || function(eventName, fn, useCapture) {

        if(typeof fn === 'string' && typeof useCapture === 'function') {
            return this.delegate.apply(this, arguments)
        }

        this.addEventListener(eventName, fn, useCapture || false);
        return this;
    };

    // Chainable shorthand for `removeEventListener`.
    // Delegates to `undelegate` if that signature is used.
    //
    //     element.off('click', callback);

    Node.prototype.off = Node.prototype.off || function(eventName, fn, useCapture) {

        if(typeof fn === 'string' && typeof useCapture === 'function') {
            return this.undelegate.apply(this, arguments)
        }

        this.removeEventListener(eventName, fn, useCapture || false);
        return this;
    };

    //     var handler = function(event) {
    //         event.target; // child
    //         event.currentTarget; // container
    //     }
    //     container.delegate('.children', 'click', handler);
    //     $(.children)[2].trigger('click');
    //
    //     container.undelegate('.children', 'click', handler);

    Node.prototype.delegate = Node.prototype.delegate || function(selector, eventName, fn) {
        var handler = createEventHandler.apply(this, arguments);
        this.on(eventName, handler);
        return this;
    };

    Node.prototype.undelegate = Node.prototype.undelegate || function(selector, eventName, fn) {
        var id = getEventId.apply(this, arguments);
        this._handlers[id].forEach(function(handler) {
            this.off(eventName, handler);
        }.bind(this));
        this._handlers[id] = null;
        return this;
    };

    // Internal functions to create and get event handlers to remove them later on.

    var createEventHandler = function(selector, eventName, fn) {
        var proxyFn = delegateHandler.bind(this, selector, fn),
            id = getEventId.apply(this, arguments);
        this._handlers = this._handlers || {};
        this._handlers[id] = this._handlers[id] || [];
        this._handlers[id].push(proxyFn);
        return proxyFn;
    };

    var eventHandlerId = 0;

    var getEventId = function(selector, eventName, fn) {
        return selector + eventName + (fn._handlerId = fn._handlerId || ++eventHandlerId);
    };

    // Internal function to check whether delegated events match the provided `selector`; set `event.currentTarget`;
    // and actually call the provided event handler.

    var delegateHandler = function(selector, fn, event) {
        var matchesSelector = this.matchesSelector || this.mozMatchesSelector || this.webkitMatchesSelector || this.msMatchesSelector || this.oMatchesSelector;
        if(matchesSelector.call(event.target, selector)) {
            event.currentTarget = this;
            fn.call(event.target, event);
        }
    };

    // Trigger uses `CustomEvent`.
    //
    //     element.trigger('anyEventName');

    Node.prototype.trigger = Node.prototype.trigger || function(type, options) {

        options = options || {};
        if(options.bubbles === undefined) options.bubbles = true;
        if(options.cancelable === undefined) options.cancelable = true;

        var event = new CustomEvent(type, options);
        this.dispatchEvent(event);

        return this;
    };

    // Event methods for NodeList (apply method on each Node)

    ['on', 'off', 'delegate', 'undelegate', 'trigger'].forEach(function(fnName) {
        NodeList.prototype[fnName] = NodeList.prototype[fnName] || function() {
            var args = arguments;
            this.forEach(function(element) {
                element[fnName].apply(element, args);
            });
            return this;
        };
    });

    // Polyfills
    // ---------

    // Polyfill for CustomEvent, borrowed from [MDN](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent#Polyfill).
    // Needed to support IE (9, 10, 11)

    (function() {
        function CustomEvent(event, params) {
            params = params || { bubbles: false, cancelable: false, detail: undefined };
            var evt = document.createEvent('CustomEvent');
            evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
            return evt;
        }
        CustomEvent.prototype = window.CustomEvent.prototype;
        window.CustomEvent = CustomEvent;
    })();

    return $;

}));