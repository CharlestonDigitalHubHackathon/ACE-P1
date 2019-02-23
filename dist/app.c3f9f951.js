// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles

// eslint-disable-next-line no-global-assign
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  for (var i = 0; i < entry.length; i++) {
    newRequire(entry[i]);
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  return newRequire;
})({"../node_modules/hyperapp/src/index.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.h = h;
exports.app = app;

function h(name, attributes) {
  var rest = [];
  var children = [];
  var length = arguments.length;

  while (length-- > 2) rest.push(arguments[length]);

  while (rest.length) {
    var node = rest.pop();

    if (node && node.pop) {
      for (length = node.length; length--;) {
        rest.push(node[length]);
      }
    } else if (node != null && node !== true && node !== false) {
      children.push(node);
    }
  }

  return typeof name === "function" ? name(attributes || {}, children) : {
    nodeName: name,
    attributes: attributes || {},
    children: children,
    key: attributes && attributes.key
  };
}

function app(state, actions, view, container) {
  var map = [].map;
  var rootElement = container && container.children[0] || null;
  var oldNode = rootElement && recycleElement(rootElement);
  var lifecycle = [];
  var skipRender;
  var isRecycling = true;
  var globalState = clone(state);
  var wiredActions = wireStateToActions([], globalState, clone(actions));
  scheduleRender();
  return wiredActions;

  function recycleElement(element) {
    return {
      nodeName: element.nodeName.toLowerCase(),
      attributes: {},
      children: map.call(element.childNodes, function (element) {
        return element.nodeType === 3 // Node.TEXT_NODE
        ? element.nodeValue : recycleElement(element);
      })
    };
  }

  function resolveNode(node) {
    return typeof node === "function" ? resolveNode(node(globalState, wiredActions)) : node != null ? node : "";
  }

  function render() {
    skipRender = !skipRender;
    var node = resolveNode(view);

    if (container && !skipRender) {
      rootElement = patch(container, rootElement, oldNode, oldNode = node);
    }

    isRecycling = false;

    while (lifecycle.length) lifecycle.pop()();
  }

  function scheduleRender() {
    if (!skipRender) {
      skipRender = true;
      setTimeout(render);
    }
  }

  function clone(target, source) {
    var out = {};

    for (var i in target) out[i] = target[i];

    for (var i in source) out[i] = source[i];

    return out;
  }

  function setPartialState(path, value, source) {
    var target = {};

    if (path.length) {
      target[path[0]] = path.length > 1 ? setPartialState(path.slice(1), value, source[path[0]]) : value;
      return clone(source, target);
    }

    return value;
  }

  function getPartialState(path, source) {
    var i = 0;

    while (i < path.length) {
      source = source[path[i++]];
    }

    return source;
  }

  function wireStateToActions(path, state, actions) {
    for (var key in actions) {
      typeof actions[key] === "function" ? function (key, action) {
        actions[key] = function (data) {
          var result = action(data);

          if (typeof result === "function") {
            result = result(getPartialState(path, globalState), actions);
          }

          if (result && result !== (state = getPartialState(path, globalState)) && !result.then // !isPromise
          ) {
              scheduleRender(globalState = setPartialState(path, clone(state, result), globalState));
            }

          return result;
        };
      }(key, actions[key]) : wireStateToActions(path.concat(key), state[key] = clone(state[key]), actions[key] = clone(actions[key]));
    }

    return actions;
  }

  function getKey(node) {
    return node ? node.key : null;
  }

  function eventListener(event) {
    return event.currentTarget.events[event.type](event);
  }

  function updateAttribute(element, name, value, oldValue, isSvg) {
    if (name === "key") {} else if (name === "style") {
      if (typeof value === "string") {
        element.style.cssText = value;
      } else {
        if (typeof oldValue === "string") oldValue = element.style.cssText = "";

        for (var i in clone(oldValue, value)) {
          var style = value == null || value[i] == null ? "" : value[i];

          if (i[0] === "-") {
            element.style.setProperty(i, style);
          } else {
            element.style[i] = style;
          }
        }
      }
    } else {
      if (name[0] === "o" && name[1] === "n") {
        name = name.slice(2);

        if (element.events) {
          if (!oldValue) oldValue = element.events[name];
        } else {
          element.events = {};
        }

        element.events[name] = value;

        if (value) {
          if (!oldValue) {
            element.addEventListener(name, eventListener);
          }
        } else {
          element.removeEventListener(name, eventListener);
        }
      } else if (name in element && name !== "list" && name !== "type" && name !== "draggable" && name !== "spellcheck" && name !== "translate" && !isSvg) {
        element[name] = value == null ? "" : value;
      } else if (value != null && value !== false) {
        element.setAttribute(name, value);
      }

      if (value == null || value === false) {
        element.removeAttribute(name);
      }
    }
  }

  function createElement(node, isSvg) {
    var element = typeof node === "string" || typeof node === "number" ? document.createTextNode(node) : (isSvg = isSvg || node.nodeName === "svg") ? document.createElementNS("http://www.w3.org/2000/svg", node.nodeName) : document.createElement(node.nodeName);
    var attributes = node.attributes;

    if (attributes) {
      if (attributes.oncreate) {
        lifecycle.push(function () {
          attributes.oncreate(element);
        });
      }

      for (var i = 0; i < node.children.length; i++) {
        element.appendChild(createElement(node.children[i] = resolveNode(node.children[i]), isSvg));
      }

      for (var name in attributes) {
        updateAttribute(element, name, attributes[name], null, isSvg);
      }
    }

    return element;
  }

  function updateElement(element, oldAttributes, attributes, isSvg) {
    for (var name in clone(oldAttributes, attributes)) {
      if (attributes[name] !== (name === "value" || name === "checked" ? element[name] : oldAttributes[name])) {
        updateAttribute(element, name, attributes[name], oldAttributes[name], isSvg);
      }
    }

    var cb = isRecycling ? attributes.oncreate : attributes.onupdate;

    if (cb) {
      lifecycle.push(function () {
        cb(element, oldAttributes);
      });
    }
  }

  function removeChildren(element, node) {
    var attributes = node.attributes;

    if (attributes) {
      for (var i = 0; i < node.children.length; i++) {
        removeChildren(element.childNodes[i], node.children[i]);
      }

      if (attributes.ondestroy) {
        attributes.ondestroy(element);
      }
    }

    return element;
  }

  function removeElement(parent, element, node) {
    function done() {
      parent.removeChild(removeChildren(element, node));
    }

    var cb = node.attributes && node.attributes.onremove;

    if (cb) {
      cb(element, done);
    } else {
      done();
    }
  }

  function patch(parent, element, oldNode, node, isSvg) {
    if (node === oldNode) {} else if (oldNode == null || oldNode.nodeName !== node.nodeName) {
      var newElement = createElement(node, isSvg);
      parent.insertBefore(newElement, element);

      if (oldNode != null) {
        removeElement(parent, element, oldNode);
      }

      element = newElement;
    } else if (oldNode.nodeName == null) {
      element.nodeValue = node;
    } else {
      updateElement(element, oldNode.attributes, node.attributes, isSvg = isSvg || node.nodeName === "svg");
      var oldKeyed = {};
      var newKeyed = {};
      var oldElements = [];
      var oldChildren = oldNode.children;
      var children = node.children;

      for (var i = 0; i < oldChildren.length; i++) {
        oldElements[i] = element.childNodes[i];
        var oldKey = getKey(oldChildren[i]);

        if (oldKey != null) {
          oldKeyed[oldKey] = [oldElements[i], oldChildren[i]];
        }
      }

      var i = 0;
      var k = 0;

      while (k < children.length) {
        var oldKey = getKey(oldChildren[i]);
        var newKey = getKey(children[k] = resolveNode(children[k]));

        if (newKeyed[oldKey]) {
          i++;
          continue;
        }

        if (newKey != null && newKey === getKey(oldChildren[i + 1])) {
          if (oldKey == null) {
            removeElement(element, oldElements[i], oldChildren[i]);
          }

          i++;
          continue;
        }

        if (newKey == null || isRecycling) {
          if (oldKey == null) {
            patch(element, oldElements[i], oldChildren[i], children[k], isSvg);
            k++;
          }

          i++;
        } else {
          var keyedNode = oldKeyed[newKey] || [];

          if (oldKey === newKey) {
            patch(element, keyedNode[0], keyedNode[1], children[k], isSvg);
            i++;
          } else if (keyedNode[0]) {
            patch(element, element.insertBefore(keyedNode[0], oldElements[i]), keyedNode[1], children[k], isSvg);
          } else {
            patch(element, oldElements[i], null, children[k], isSvg);
          }

          newKeyed[newKey] = children[k];
          k++;
        }
      }

      while (i < oldChildren.length) {
        if (getKey(oldChildren[i]) == null) {
          removeElement(element, oldElements[i], oldChildren[i]);
        }

        i++;
      }

      for (var i in oldKeyed) {
        if (!newKeyed[i]) {
          removeElement(element, oldKeyed[i][0], oldKeyed[i][1]);
        }
      }
    }

    return element;
  }
}
},{}],"js/data/plant.json":[function(require,module,exports) {
module.exports = [{
  "Region": null,
  "income_group": null,
  "country_long": "Antarctica",
  "name": "McMurdo Station Generator",
  "gppd_idnr": "WRI1023843",
  "capacity_mw": 6.6,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 1981,
  "year_of_capacity_data": null
}, {
  "Region": null,
  "income_group": null,
  "country_long": "Antarctica",
  "name": "Ross Island",
  "gppd_idnr": "WRI1022458",
  "capacity_mw": 1,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": null,
  "income_group": null,
  "country_long": "French Guiana",
  "name": "D�grad des Cannes",
  "gppd_idnr": "WRI1023509",
  "capacity_mw": 40,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": null,
  "income_group": null,
  "country_long": "French Guiana",
  "name": "D�grad des Cannes",
  "gppd_idnr": "WRI1023510",
  "capacity_mw": 72,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": null,
  "income_group": null,
  "country_long": "French Guiana",
  "name": "Kourou",
  "gppd_idnr": "WRI1023511",
  "capacity_mw": 2,
  "fuel1": "Biomass",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": null,
  "income_group": null,
  "country_long": "French Guiana",
  "name": "Kourou",
  "gppd_idnr": "WRI1023512",
  "capacity_mw": 20,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": null,
  "income_group": null,
  "country_long": "French Guiana",
  "name": "Petit Saut",
  "gppd_idnr": "WRI1022129",
  "capacity_mw": 113.6,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 1994,
  "year_of_capacity_data": null
}, {
  "Region": null,
  "income_group": null,
  "country_long": "Kosovo",
  "name": "Kosovo A Coal Power Plant Kosovo",
  "gppd_idnr": "GEODB0042698",
  "capacity_mw": 800,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2017
}, {
  "Region": null,
  "income_group": null,
  "country_long": "Kosovo",
  "name": "Kosovo B Coal Power Plant Kosovo",
  "gppd_idnr": "GEODB0042699",
  "capacity_mw": 678,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2017
}, {
  "Region": null,
  "income_group": null,
  "country_long": "Taiwan",
  "name": "Changbin",
  "gppd_idnr": "WRI1000390",
  "capacity_mw": 96,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 2007,
  "year_of_capacity_data": null
}, {
  "Region": null,
  "income_group": null,
  "country_long": "Taiwan",
  "name": "Chiahui",
  "gppd_idnr": "WRI1000372",
  "capacity_mw": 670,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 2004,
  "year_of_capacity_data": null
}, {
  "Region": null,
  "income_group": null,
  "country_long": "Taiwan",
  "name": "Chinshan",
  "gppd_idnr": "WRI1000378",
  "capacity_mw": 1272,
  "fuel1": "Nuclear",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": null,
  "income_group": null,
  "country_long": "Taiwan",
  "name": "Chuying",
  "gppd_idnr": "WRI1000435",
  "capacity_mw": 2,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 1941,
  "year_of_capacity_data": null
}, {
  "Region": null,
  "income_group": null,
  "country_long": "Taiwan",
  "name": "Daguan Erchang",
  "gppd_idnr": "WRI1000441",
  "capacity_mw": 1000,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 1985,
  "year_of_capacity_data": null
}, {
  "Region": null,
  "income_group": null,
  "country_long": "Taiwan",
  "name": "Dah-Tarn",
  "gppd_idnr": "WRI1000370",
  "capacity_mw": 4380,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": null,
  "income_group": null,
  "country_long": "Taiwan",
  "name": "Datan",
  "gppd_idnr": "WRI1000391",
  "capacity_mw": 14,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 2005,
  "year_of_capacity_data": null
}, {
  "Region": null,
  "income_group": null,
  "country_long": "Taiwan",
  "name": "Datan wind",
  "gppd_idnr": "WRI1000447",
  "capacity_mw": 15.1,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": null,
  "income_group": null,
  "country_long": "Taiwan",
  "name": "Houli",
  "gppd_idnr": "WRI1000423",
  "capacity_mw": 1,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 2010,
  "year_of_capacity_data": null
}, {
  "Region": null,
  "income_group": null,
  "country_long": "Taiwan",
  "name": "Hsiehho",
  "gppd_idnr": "WRI1000368",
  "capacity_mw": 2000,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": null,
  "income_group": null,
  "country_long": "Taiwan",
  "name": "Hsinta (coal)",
  "gppd_idnr": "WRI1000367",
  "capacity_mw": 2200,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": null,
  "income_group": null,
  "country_long": "Taiwan",
  "name": "Hsinta (gas)",
  "gppd_idnr": "WRI1000366",
  "capacity_mw": 2410,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": null,
  "income_group": null,
  "country_long": "Taiwan",
  "name": "Kuosheng",
  "gppd_idnr": "WRI1000379",
  "capacity_mw": 2040,
  "fuel1": "Nuclear",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": null,
  "income_group": null,
  "country_long": "Taiwan",
  "name": "Linkou",
  "gppd_idnr": "WRI1000373",
  "capacity_mw": 300,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 1998,
  "year_of_capacity_data": null
}, {
  "Region": null,
  "income_group": null,
  "country_long": "Taiwan",
  "name": "Linkou Wind",
  "gppd_idnr": "WRI1000444",
  "capacity_mw": 6,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 2011,
  "year_of_capacity_data": null
}, {
  "Region": null,
  "income_group": null,
  "country_long": "Taiwan",
  "name": "Maanshan",
  "gppd_idnr": "WRI1000380",
  "capacity_mw": 1902,
  "fuel1": "Nuclear",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": null,
  "income_group": null,
  "country_long": "Taiwan",
  "name": "Mailao",
  "gppd_idnr": "WRI1000362",
  "capacity_mw": 4200,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": null,
  "income_group": null,
  "country_long": "Taiwan",
  "name": "Miaoli",
  "gppd_idnr": "WRI1000396",
  "capacity_mw": 50,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 2006,
  "year_of_capacity_data": null
}, {
  "Region": null,
  "income_group": null,
  "country_long": "Taiwan",
  "name": "Ming-Hu",
  "gppd_idnr": "WRI1000382",
  "capacity_mw": 1000,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": null,
  "income_group": null,
  "country_long": "Taiwan",
  "name": "Ming-Tan",
  "gppd_idnr": "WRI1000384",
  "capacity_mw": 1602,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": null,
  "income_group": null,
  "country_long": "Taiwan",
  "name": "Mingtan",
  "gppd_idnr": "WRI1000442",
  "capacity_mw": 1602,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": null,
  "income_group": null,
  "country_long": "Taiwan",
  "name": "Nanpu (NG)",
  "gppd_idnr": "WRI1000377",
  "capacity_mw": 800,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": null,
  "income_group": null,
  "country_long": "Taiwan",
  "name": "Penghu",
  "gppd_idnr": "WRI1000397",
  "capacity_mw": 10,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": null,
  "income_group": null,
  "country_long": "Taiwan",
  "name": "Shimen Wind",
  "gppd_idnr": "WRI1000445",
  "capacity_mw": 3.96,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 2004,
  "year_of_capacity_data": null
}, {
  "Region": null,
  "income_group": null,
  "country_long": "Taiwan",
  "name": "Shuili",
  "gppd_idnr": "WRI1000412",
  "capacity_mw": 13,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 1992,
  "year_of_capacity_data": null
}, {
  "Region": null,
  "income_group": null,
  "country_long": "Taiwan",
  "name": "Shuilian",
  "gppd_idnr": "WRI1000431",
  "capacity_mw": 9.5,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 1985,
  "year_of_capacity_data": null
}, {
  "Region": null,
  "income_group": null,
  "country_long": "Taiwan",
  "name": "Star Buck",
  "gppd_idnr": "WRI1000371",
  "capacity_mw": 490,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 2009,
  "year_of_capacity_data": null
}, {
  "Region": null,
  "income_group": null,
  "country_long": "Taiwan",
  "name": "Tachiachi",
  "gppd_idnr": "WRI1000389",
  "capacity_mw": 180,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": null,
  "income_group": null,
  "country_long": "Taiwan",
  "name": "Taichung",
  "gppd_idnr": "WRI1000365",
  "capacity_mw": 288,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": null,
  "income_group": null,
  "country_long": "Taiwan",
  "name": "Taizhong Taichung",
  "gppd_idnr": "WRI1000364",
  "capacity_mw": 5500,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": null,
  "income_group": null,
  "country_long": "Taiwan",
  "name": "Talin",
  "gppd_idnr": "WRI1000363",
  "capacity_mw": 550,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 1995,
  "year_of_capacity_data": null
}, {
  "Region": null,
  "income_group": null,
  "country_long": "Taiwan",
  "name": "Tunghsiao",
  "gppd_idnr": "WRI1000374",
  "capacity_mw": 1785,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 1983,
  "year_of_capacity_data": null
}, {
  "Region": null,
  "income_group": null,
  "country_long": "Taiwan",
  "name": "Yuanshan",
  "gppd_idnr": "WRI1000414",
  "capacity_mw": 18,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 1941,
  "year_of_capacity_data": null
}, {
  "Region": null,
  "income_group": null,
  "country_long": "Western Sahara",
  "name": "Dakhla IC Power Plant Western Sahara",
  "gppd_idnr": "GEODB0042583",
  "capacity_mw": 23.4,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2017
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: nonOECD",
  "country_long": "Brunei Darussalam",
  "name": "Berakas CCGT Power Plant Brunei",
  "gppd_idnr": "GEODB0045545",
  "capacity_mw": 102,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2017
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: nonOECD",
  "country_long": "Brunei Darussalam",
  "name": "Bukit Panggal CCGT Power Station Brunei",
  "gppd_idnr": "GEODB0045547",
  "capacity_mw": 110,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2017
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: nonOECD",
  "country_long": "Brunei Darussalam",
  "name": "Gadong 2 Power Plant Brunei Darussalam",
  "gppd_idnr": "GEODB0045543",
  "capacity_mw": 128,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2017
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: nonOECD",
  "country_long": "Brunei Darussalam",
  "name": "Lumut Cogen Power Station Brunei",
  "gppd_idnr": "GEODB0045546",
  "capacity_mw": 246,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2017
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: nonOECD",
  "country_long": "Singapore",
  "name": "Jurong Island - PLP CCGT Power Plant Singapore",
  "gppd_idnr": "GEODB0045352",
  "capacity_mw": 800,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2017
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: nonOECD",
  "country_long": "Singapore",
  "name": "Keppel Merlimau Cogen Power Plant Singapore",
  "gppd_idnr": "GEODB0042425",
  "capacity_mw": 1300,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2017
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: nonOECD",
  "country_long": "Singapore",
  "name": "Keppel Seghers Tuas WTE Plant Singapore",
  "gppd_idnr": "GEODB0003828",
  "capacity_mw": 22,
  "fuel1": "Waste",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2017
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: nonOECD",
  "country_long": "Singapore",
  "name": "Pasir Panjang Gas Turbine Power Station Singapore",
  "gppd_idnr": "GEODB0004720",
  "capacity_mw": 210,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2017
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: nonOECD",
  "country_long": "Singapore",
  "name": "PowerSeraya OCGT Power Plant Singapore",
  "gppd_idnr": "GEODB0004889",
  "capacity_mw": 210,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2017
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: nonOECD",
  "country_long": "Singapore",
  "name": "PowerSeraya Pulau Seraya CCGT Cogen Power Plant Singapore",
  "gppd_idnr": "GEODB0004960",
  "capacity_mw": 1540,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2017
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: nonOECD",
  "country_long": "Singapore",
  "name": "PowerSeraya Pulau Seraya Oil Power Station Singapore",
  "gppd_idnr": "GEODB0004961",
  "capacity_mw": 2250,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2017
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: nonOECD",
  "country_long": "Singapore",
  "name": "SembCorp Pulau Sakra CCGT Cogen Power Station Singapore",
  "gppd_idnr": "GEODB0004959",
  "capacity_mw": 1215,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2017
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: nonOECD",
  "country_long": "Singapore",
  "name": "Senoko I-VII CCGT Power Plants Singapore",
  "gppd_idnr": "GEODB0005331",
  "capacity_mw": 2807,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2017
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: nonOECD",
  "country_long": "Singapore",
  "name": "Senoko Thermal Power Station Singapore",
  "gppd_idnr": "GEODB0003827",
  "capacity_mw": 500,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2017
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: nonOECD",
  "country_long": "Singapore",
  "name": "Senoko WTE Incineration Plant Singapore",
  "gppd_idnr": "GEODB0005333",
  "capacity_mw": 56,
  "fuel1": "Waste",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2017
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: nonOECD",
  "country_long": "Singapore",
  "name": "Tuas CCGT Power Station Singapore",
  "gppd_idnr": "GEODB0005795",
  "capacity_mw": 1470,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2017
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: nonOECD",
  "country_long": "Singapore",
  "name": "Tuas Oil Power Station Singapore",
  "gppd_idnr": "GEODB0005796",
  "capacity_mw": 1200,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2017
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: nonOECD",
  "country_long": "Singapore",
  "name": "Tuas South WTE Incineration Plant Singapore",
  "gppd_idnr": "GEODB0005797",
  "capacity_mw": 80,
  "fuel1": "Waste",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2017
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Adelaide Showgrounds",
  "gppd_idnr": "AUS0000432",
  "capacity_mw": 1,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Albany Wind Farm",
  "gppd_idnr": "AUS0000065",
  "capacity_mw": 21.6,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Amcor Gawler",
  "gppd_idnr": "AUS0000231",
  "capacity_mw": 4,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Angaston",
  "gppd_idnr": "AUS0000232",
  "capacity_mw": 50,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Anglesea",
  "gppd_idnr": "AUS0000114",
  "capacity_mw": 150,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Appin (Mine)",
  "gppd_idnr": "AUS0000264",
  "capacity_mw": 59.7,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Argyle Diamond Mine",
  "gppd_idnr": "AUS0000220",
  "capacity_mw": 32,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Awaba",
  "gppd_idnr": "AUS0000049",
  "capacity_mw": 1.1,
  "fuel1": "Waste",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Bairnsdale",
  "gppd_idnr": "AUS0000081",
  "capacity_mw": 94,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Ballarat Base Hospital",
  "gppd_idnr": "AUS0000113",
  "capacity_mw": 2,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Bamarang",
  "gppd_idnr": "AUS0000397",
  "capacity_mw": 320,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Bango Wind Farm",
  "gppd_idnr": "AUS0000398",
  "capacity_mw": 200,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Banimboola",
  "gppd_idnr": "AUS0000014",
  "capacity_mw": 12.5,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Bankstown Sports Club",
  "gppd_idnr": "AUS0000399",
  "capacity_mw": 2.1,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Bannaby",
  "gppd_idnr": "AUS0000396",
  "capacity_mw": 600,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Barcaldine (Len Wishaw)",
  "gppd_idnr": "AUS0000008",
  "capacity_mw": 55,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Barron Gorge",
  "gppd_idnr": "AUS0000151",
  "capacity_mw": 66,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Bastyan",
  "gppd_idnr": "AUS0000137",
  "capacity_mw": 79.9,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Bayswater",
  "gppd_idnr": "AUS0000265",
  "capacity_mw": 2640,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Belconnen",
  "gppd_idnr": "AUS0000400",
  "capacity_mw": 1,
  "fuel1": "Waste",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Bell Bay (Bell Bay Three)",
  "gppd_idnr": "AUS0000139",
  "capacity_mw": 120,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Ben Lomond",
  "gppd_idnr": "AUS0000395",
  "capacity_mw": 200,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Bendeela (Shoalhaven Scheme)",
  "gppd_idnr": "AUS0000266",
  "capacity_mw": 80,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Berrimah",
  "gppd_idnr": "AUS0000251",
  "capacity_mw": 10,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Berwick",
  "gppd_idnr": "AUS0000080",
  "capacity_mw": 4.6,
  "fuel1": "Waste",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Bidyadanga",
  "gppd_idnr": "AUS0000382",
  "capacity_mw": 1.3,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Blayney Wind Farm",
  "gppd_idnr": "AUS0000027",
  "capacity_mw": 9.9,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Blowering",
  "gppd_idnr": "AUS0000267",
  "capacity_mw": 70,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Bluff Point (Woolnorth) Wind Farm",
  "gppd_idnr": "AUS0000009",
  "capacity_mw": 65,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Boco Rock",
  "gppd_idnr": "AUS0000394",
  "capacity_mw": 270,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Bodangora Wind Farm",
  "gppd_idnr": "AUS0000422",
  "capacity_mw": 100,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Bogong (Mount Beauty Hydro Scheme)",
  "gppd_idnr": "AUS0000102",
  "capacity_mw": 140,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Box Hill",
  "gppd_idnr": "AUS0000342",
  "capacity_mw": 25,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Braemar 1",
  "gppd_idnr": "AUS0000152",
  "capacity_mw": 504,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Braemar 2",
  "gppd_idnr": "AUS0000153",
  "capacity_mw": 519,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2013
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Bremer Bay Diesel Backup",
  "gppd_idnr": "AUS0000349",
  "capacity_mw": 1.3,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Brewer",
  "gppd_idnr": "AUS0000256",
  "capacity_mw": 8.5,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Broadmeadows",
  "gppd_idnr": "AUS0000082",
  "capacity_mw": 6.2,
  "fuel1": "Waste",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Broadwater",
  "gppd_idnr": "AUS0000268",
  "capacity_mw": 30,
  "fuel1": "Biomass",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Broken Hill",
  "gppd_idnr": "AUS0000305",
  "capacity_mw": 50,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Broken Hill Solar Plant",
  "gppd_idnr": "AUS0000477",
  "capacity_mw": 53,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2016
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Brooklyn",
  "gppd_idnr": "AUS0000079",
  "capacity_mw": 2.8,
  "fuel1": "Waste",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Broome",
  "gppd_idnr": "AUS0000180",
  "capacity_mw": 39.6,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Brown Mountain",
  "gppd_idnr": "AUS0000269",
  "capacity_mw": 5.4,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Browns Plains",
  "gppd_idnr": "AUS0000078",
  "capacity_mw": 2.2,
  "fuel1": "Waste",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Bulwer Island",
  "gppd_idnr": "AUS0000461",
  "capacity_mw": 33,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Buronga",
  "gppd_idnr": "AUS0000416",
  "capacity_mw": 150,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Burrendong",
  "gppd_idnr": "AUS0000300",
  "capacity_mw": 18,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Burrinjuck Power Station",
  "gppd_idnr": "AUS0000048",
  "capacity_mw": 27.2,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Burrup Peninsula (Karratha Gas Plant)",
  "gppd_idnr": "AUS0000181",
  "capacity_mw": 240,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Burrup Peninsula (Pluto Phase 1)",
  "gppd_idnr": "AUS0000182",
  "capacity_mw": 160,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Butlers Gorge",
  "gppd_idnr": "AUS0000127",
  "capacity_mw": 12.2,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Callide A",
  "gppd_idnr": "AUS0000178",
  "capacity_mw": 120,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Callide B",
  "gppd_idnr": "AUS0000177",
  "capacity_mw": 700,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Callide C",
  "gppd_idnr": "AUS0000176",
  "capacity_mw": 900,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Camballin",
  "gppd_idnr": "AUS0000414",
  "capacity_mw": 1.04,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Canning Vale",
  "gppd_idnr": "AUS0000330",
  "capacity_mw": 4,
  "fuel1": "Waste",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Cannington Mine",
  "gppd_idnr": "AUS0000452",
  "capacity_mw": 40,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Canunda Wind Farm",
  "gppd_idnr": "AUS0000064",
  "capacity_mw": 46,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Cape Bridgewater Wind Farm",
  "gppd_idnr": "AUS0000007",
  "capacity_mw": 58,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Cape Lambert",
  "gppd_idnr": "AUS0000462",
  "capacity_mw": 120,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2014
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Cape Nelson North Wind Farm",
  "gppd_idnr": "AUS0000112",
  "capacity_mw": 22,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Cape Nelson South Wind Farm",
  "gppd_idnr": "AUS0000111",
  "capacity_mw": 44,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Cape Preston",
  "gppd_idnr": "AUS0000457",
  "capacity_mw": 450,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Cape Sir William Grant Wind Farm",
  "gppd_idnr": "AUS0000110",
  "capacity_mw": 54,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Capital Wind Farm",
  "gppd_idnr": "AUS0000047",
  "capacity_mw": 140.7,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Capral (Aluminium Smelter)",
  "gppd_idnr": "AUS0000270",
  "capacity_mw": 300,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Carnarvon",
  "gppd_idnr": "AUS0000386",
  "capacity_mw": 15,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Catagunya",
  "gppd_idnr": "AUS0000126",
  "capacity_mw": 48,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Cathedral Rocks Wind Farm",
  "gppd_idnr": "AUS0000063",
  "capacity_mw": 66,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Cawse Nickel Mine",
  "gppd_idnr": "AUS0000415",
  "capacity_mw": 16.5,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Cethana",
  "gppd_idnr": "AUS0000144",
  "capacity_mw": 100,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Challicum Hills Wind Farm",
  "gppd_idnr": "AUS0000006",
  "capacity_mw": 52.5,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Channel Island",
  "gppd_idnr": "AUS0000261",
  "capacity_mw": 232,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Charlestown Square",
  "gppd_idnr": "AUS0000401",
  "capacity_mw": 2.8,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Christmas Creek Iron Ore Mine",
  "gppd_idnr": "AUS0000221",
  "capacity_mw": 28,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Clayton",
  "gppd_idnr": "AUS0000083",
  "capacity_mw": 11,
  "fuel1": "Waste",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Clements Gap Wind Farm",
  "gppd_idnr": "AUS0000025",
  "capacity_mw": 56.7,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Cloudbreak",
  "gppd_idnr": "AUS0000324",
  "capacity_mw": 36,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Clover",
  "gppd_idnr": "AUS0000103",
  "capacity_mw": 29,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Cluny",
  "gppd_idnr": "AUS0000125",
  "capacity_mw": 17,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Cockburn",
  "gppd_idnr": "AUS0000183",
  "capacity_mw": 240,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Codrington Wind Farm",
  "gppd_idnr": "AUS0000015",
  "capacity_mw": 18.2,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Collgar Wind Farm",
  "gppd_idnr": "AUS0000307",
  "capacity_mw": 206,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Collie (Bluewaters)",
  "gppd_idnr": "AUS0000184",
  "capacity_mw": 416,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Collie A",
  "gppd_idnr": "AUS0000208",
  "capacity_mw": 340,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Collinsville",
  "gppd_idnr": "AUS0000179",
  "capacity_mw": 190,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Colongra",
  "gppd_idnr": "AUS0000271",
  "capacity_mw": 724,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Condamine A",
  "gppd_idnr": "AUS0000154",
  "capacity_mw": 144,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Condong Sugar Mill",
  "gppd_idnr": "AUS0000263",
  "capacity_mw": 30,
  "fuel1": "Biomass",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Copeton",
  "gppd_idnr": "AUS0000301",
  "capacity_mw": 20,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Coral Bay Diesel Backup",
  "gppd_idnr": "AUS0000351",
  "capacity_mw": 2.24,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Corio",
  "gppd_idnr": "AUS0000336",
  "capacity_mw": 1,
  "fuel1": "Waste",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Crookwell Wind Farm",
  "gppd_idnr": "AUS0000046",
  "capacity_mw": 4.8,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "CSIRO Energy Centre",
  "gppd_idnr": "AUS0000438",
  "capacity_mw": 1.5,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Cullerin Range Wind Farm",
  "gppd_idnr": "AUS0000003",
  "capacity_mw": 30,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Daandine",
  "gppd_idnr": "AUS0000155",
  "capacity_mw": 30,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Dampier",
  "gppd_idnr": "AUS0000185",
  "capacity_mw": 120,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Darling Downs",
  "gppd_idnr": "AUS0000156",
  "capacity_mw": 644,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Darlot Gold Mine",
  "gppd_idnr": "AUS0000321",
  "capacity_mw": 11.7,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Dartmouth (Mount Beauty Hydro Scheme)",
  "gppd_idnr": "AUS0000109",
  "capacity_mw": 185,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Denham Diesel Backup",
  "gppd_idnr": "AUS0000353",
  "capacity_mw": 1.6,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Derby",
  "gppd_idnr": "AUS0000366",
  "capacity_mw": 12.53,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Devils Gate",
  "gppd_idnr": "AUS0000136",
  "capacity_mw": 63,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Diamantina",
  "gppd_idnr": "AUS0000459",
  "capacity_mw": 242,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Dry Creek",
  "gppd_idnr": "AUS0000233",
  "capacity_mw": 156,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "EarthPower Biomass Plant",
  "gppd_idnr": "AUS0000272",
  "capacity_mw": 3.9,
  "fuel1": "Waste",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Eastern Creek",
  "gppd_idnr": "AUS0000045",
  "capacity_mw": 5,
  "fuel1": "Waste",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Eastern Creek 2",
  "gppd_idnr": "AUS0000044",
  "capacity_mw": 7.7,
  "fuel1": "Waste",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Eildon",
  "gppd_idnr": "AUS0000084",
  "capacity_mw": 135,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Eildon Small Hydro",
  "gppd_idnr": "AUS0000335",
  "capacity_mw": 4.5,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Emu Downs Wind Farm",
  "gppd_idnr": "AUS0000043",
  "capacity_mw": 79.2,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Energy Brix",
  "gppd_idnr": "AUS0000085",
  "capacity_mw": 189,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Eraring",
  "gppd_idnr": "AUS0000273",
  "capacity_mw": 42,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Eraring",
  "gppd_idnr": "AUS0000306",
  "capacity_mw": 2820,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Esperance",
  "gppd_idnr": "AUS0000186",
  "capacity_mw": 39,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Esperance Wind Farm Nine Mile Beach",
  "gppd_idnr": "AUS0000042",
  "capacity_mw": 3.6,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Esperance Wind Farm Ten Mile Lagoon",
  "gppd_idnr": "AUS0000391",
  "capacity_mw": 2.03,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Exmouth",
  "gppd_idnr": "AUS0000372",
  "capacity_mw": 8,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Fisher",
  "gppd_idnr": "AUS0000135",
  "capacity_mw": 46,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Fitzroy Crossing",
  "gppd_idnr": "AUS0000367",
  "capacity_mw": 4.06,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Gadara",
  "gppd_idnr": "AUS0000274",
  "capacity_mw": 20,
  "fuel1": "Biomass",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Geraldton",
  "gppd_idnr": "AUS0000187",
  "capacity_mw": 21,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "German Creek",
  "gppd_idnr": "AUS0000157",
  "capacity_mw": 31.8,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Gladstone",
  "gppd_idnr": "AUS0000158",
  "capacity_mw": 1680,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Glenbawn",
  "gppd_idnr": "AUS0000275",
  "capacity_mw": 5,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Glennies Creek",
  "gppd_idnr": "AUS0000276",
  "capacity_mw": 10,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Glenorchy",
  "gppd_idnr": "AUS0000418",
  "capacity_mw": 1.6,
  "fuel1": "Waste",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Gordon",
  "gppd_idnr": "AUS0000143",
  "capacity_mw": 432,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Gosnells",
  "gppd_idnr": "AUS0000331",
  "capacity_mw": 1.1,
  "fuel1": "Waste",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Grange Avenue",
  "gppd_idnr": "AUS0000041",
  "capacity_mw": 1.3,
  "fuel1": "Waste",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Grasmere Wind Farm (Albany stage II)",
  "gppd_idnr": "AUS0000309",
  "capacity_mw": 13.8,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Greenough River Solar Farm",
  "gppd_idnr": "AUS0000474",
  "capacity_mw": 10,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2014
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Gunning",
  "gppd_idnr": "AUS0000040",
  "capacity_mw": 46.5,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Guthega",
  "gppd_idnr": "AUS0000303",
  "capacity_mw": 60,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Hallam Road",
  "gppd_idnr": "AUS0000077",
  "capacity_mw": 6.7,
  "fuel1": "Waste",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Hallett",
  "gppd_idnr": "AUS0000250",
  "capacity_mw": 228.3,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Hallett 1 Brown Hill  Wind Farm",
  "gppd_idnr": "AUS0000022",
  "capacity_mw": 94.5,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Hallett 1 Brown Hill  Wind Farm",
  "gppd_idnr": "AUS0000453",
  "capacity_mw": 94.5,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Hallett 2 Hallet Hill  Wind Farm",
  "gppd_idnr": "AUS0000023",
  "capacity_mw": 71.4,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Hallett 2 Hallet Hill  Wind Farm",
  "gppd_idnr": "AUS0000455",
  "capacity_mw": 71.4,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Hallett 4 North Brown Hill  Wind Farm",
  "gppd_idnr": "AUS0000024",
  "capacity_mw": 132.3,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Hallett 5 The Bluff  Wind Farm",
  "gppd_idnr": "AUS0000454",
  "capacity_mw": 94.5,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Halls Creek",
  "gppd_idnr": "AUS0000368",
  "capacity_mw": 3.69,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Hazelwood",
  "gppd_idnr": "AUS0000087",
  "capacity_mw": 1600,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Henderson",
  "gppd_idnr": "AUS0000355",
  "capacity_mw": 3.2,
  "fuel1": "Waste",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Highbury",
  "gppd_idnr": "AUS0000343",
  "capacity_mw": 1,
  "fuel1": "Waste",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Hobart",
  "gppd_idnr": "AUS0000419",
  "capacity_mw": 1,
  "fuel1": "Waste",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Hopetoun Diesel Backup",
  "gppd_idnr": "AUS0000412",
  "capacity_mw": 1.3,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Hopetoun Wind Turbines",
  "gppd_idnr": "AUS0000413",
  "capacity_mw": 1.2,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Hume",
  "gppd_idnr": "AUS0000076",
  "capacity_mw": 58,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Hunter",
  "gppd_idnr": "AUS0000277",
  "capacity_mw": 29,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Hunter Valley",
  "gppd_idnr": "AUS0000278",
  "capacity_mw": 50,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Inkerman Sugar Mill",
  "gppd_idnr": "AUS0000145",
  "capacity_mw": 10.5,
  "fuel1": "Biomass",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Invicta Sugar Mill",
  "gppd_idnr": "AUS0000056",
  "capacity_mw": 50,
  "fuel1": "Biomass",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Isis Central Sugar Mill",
  "gppd_idnr": "AUS0000159",
  "capacity_mw": 25,
  "fuel1": "Biomass",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Jacks Gully",
  "gppd_idnr": "AUS0000039",
  "capacity_mw": 2.3,
  "fuel1": "Waste",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Jeeralang A",
  "gppd_idnr": "AUS0000088",
  "capacity_mw": 212,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Jeeralang B",
  "gppd_idnr": "AUS0000089",
  "capacity_mw": 228,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Jindabyne Dam Mini Hydro",
  "gppd_idnr": "AUS0000021",
  "capacity_mw": 1.1,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "John Butters",
  "gppd_idnr": "AUS0000134",
  "capacity_mw": 143,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Jounama",
  "gppd_idnr": "AUS0000038",
  "capacity_mw": 14.4,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Jundee Gold Mine",
  "gppd_idnr": "AUS0000222",
  "capacity_mw": 21,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Kalamia Sugar Mill",
  "gppd_idnr": "AUS0000160",
  "capacity_mw": 9,
  "fuel1": "Biomass",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Kalamunda",
  "gppd_idnr": "AUS0000329",
  "capacity_mw": 1.3,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Kalbarri Wind Farm",
  "gppd_idnr": "AUS0000405",
  "capacity_mw": 1.7,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Kalgoorlie (Parkeston)",
  "gppd_idnr": "AUS0000188",
  "capacity_mw": 110,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Kalgoorlie Nickel Smelter",
  "gppd_idnr": "AUS0000209",
  "capacity_mw": 37,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Kambalda",
  "gppd_idnr": "AUS0000210",
  "capacity_mw": 42,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Kangaroo Valley (Shoalhaven Scheme)",
  "gppd_idnr": "AUS0000279",
  "capacity_mw": 160,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Kareeya",
  "gppd_idnr": "AUS0000161",
  "capacity_mw": 88,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Karratha",
  "gppd_idnr": "AUS0000189",
  "capacity_mw": 86,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Katherine",
  "gppd_idnr": "AUS0000259",
  "capacity_mw": 21,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Kemerton",
  "gppd_idnr": "AUS0000211",
  "capacity_mw": 310,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "King Island (Currie)",
  "gppd_idnr": "AUS0000449",
  "capacity_mw": 8.55,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Kogan Creek",
  "gppd_idnr": "AUS0000162",
  "capacity_mw": 744,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2013
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Koombooloomba",
  "gppd_idnr": "AUS0000055",
  "capacity_mw": 7.3,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "KRC Cogeneration Plant",
  "gppd_idnr": "AUS0000332",
  "capacity_mw": 4.2,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Kununurra",
  "gppd_idnr": "AUS0000370",
  "capacity_mw": 12.4,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Kwinan",
  "gppd_idnr": "AUS0000194",
  "capacity_mw": 21,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Kwinana (Alcoa Refinery)",
  "gppd_idnr": "AUS0000190",
  "capacity_mw": 66,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Kwinana (NewGen)",
  "gppd_idnr": "AUS0000196",
  "capacity_mw": 320,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Kwinana A",
  "gppd_idnr": "AUS0000191",
  "capacity_mw": 240,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Kwinana C",
  "gppd_idnr": "AUS0000192",
  "capacity_mw": 400,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Kwinana Cogeneration",
  "gppd_idnr": "AUS0000193",
  "capacity_mw": 123,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Kwinana High Efficiency Gas Turbine Plant",
  "gppd_idnr": "AUS0000195",
  "capacity_mw": 200,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Kwinana Swift",
  "gppd_idnr": "AUS0000197",
  "capacity_mw": 120,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Ladbroke Grove",
  "gppd_idnr": "AUS0000244",
  "capacity_mw": 80,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Lake Bonney Wind Farm",
  "gppd_idnr": "AUS0000062",
  "capacity_mw": 159,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Lake Echo",
  "gppd_idnr": "AUS0000124",
  "capacity_mw": 32,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Lake Glenmaggie",
  "gppd_idnr": "AUS0000086",
  "capacity_mw": 3.8,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Lake Keepit",
  "gppd_idnr": "AUS0000304",
  "capacity_mw": 6.5,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Lake William Hovell",
  "gppd_idnr": "AUS0000099",
  "capacity_mw": 1.8,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Landfill Management Services Shoal Bay",
  "gppd_idnr": "AUS0000252",
  "capacity_mw": 1.1,
  "fuel1": "Waste",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Laverton",
  "gppd_idnr": "AUS0000371",
  "capacity_mw": 1.5,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Laverton (Granny Smith Gold Mine)",
  "gppd_idnr": "AUS0000219",
  "capacity_mw": 30.6,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Laverton North",
  "gppd_idnr": "AUS0000090",
  "capacity_mw": 312,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Leichhardt",
  "gppd_idnr": "AUS0000460",
  "capacity_mw": 60,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Leinster Nickel Mine",
  "gppd_idnr": "AUS0000212",
  "capacity_mw": 59,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Lemonthyme",
  "gppd_idnr": "AUS0000132",
  "capacity_mw": 54,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Leonards Hill",
  "gppd_idnr": "AUS0000341",
  "capacity_mw": 4.1,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Leonora",
  "gppd_idnr": "AUS0000409",
  "capacity_mw": 4.43,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Leonora (Murrin Murrin Nickel Mine)",
  "gppd_idnr": "AUS0000223",
  "capacity_mw": 78,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Liapootah",
  "gppd_idnr": "AUS0000123",
  "capacity_mw": 87.3,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Liddell",
  "gppd_idnr": "AUS0000280",
  "capacity_mw": 2000,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Liddell Solar Thermal",
  "gppd_idnr": "AUS0000473",
  "capacity_mw": 9.3,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2014
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Longford",
  "gppd_idnr": "AUS0000091",
  "capacity_mw": 31.8,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Lonsdale",
  "gppd_idnr": "AUS0000234",
  "capacity_mw": 20.7,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Lower Lake Margaret",
  "gppd_idnr": "AUS0000131",
  "capacity_mw": 3.2,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Lower Rubicon",
  "gppd_idnr": "AUS0000338",
  "capacity_mw": 2.7,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Loy Yang A",
  "gppd_idnr": "AUS0000092",
  "capacity_mw": 2180,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Loy Yang B",
  "gppd_idnr": "AUS0000075",
  "capacity_mw": 1000,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Lucas Heights I",
  "gppd_idnr": "AUS0000037",
  "capacity_mw": 5.39,
  "fuel1": "Waste",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Lucas Heights II",
  "gppd_idnr": "AUS0000036",
  "capacity_mw": 11.33,
  "fuel1": "Waste",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Lucas Heights III",
  "gppd_idnr": "AUS0000035",
  "capacity_mw": 4.12,
  "fuel1": "Waste",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Macarthur Wind Farm",
  "gppd_idnr": "AUS0000417",
  "capacity_mw": 420,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Mackay",
  "gppd_idnr": "AUS0000146",
  "capacity_mw": 34,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Mackintosh",
  "gppd_idnr": "AUS0000142",
  "capacity_mw": 81,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Macknade Sugar Mill",
  "gppd_idnr": "AUS0000174",
  "capacity_mw": 8,
  "fuel1": "Biomass",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Mandurah",
  "gppd_idnr": "AUS0000357",
  "capacity_mw": 1.3,
  "fuel1": "Waste",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Marble Bar Diesel Backup",
  "gppd_idnr": "AUS0000365",
  "capacity_mw": 1.28,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Maryborough",
  "gppd_idnr": "AUS0000346",
  "capacity_mw": 7.5,
  "fuel1": "Biomass",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Maryvale Mill",
  "gppd_idnr": "AUS0000308",
  "capacity_mw": 54.5,
  "fuel1": "Biomass",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "McArthur River Mine",
  "gppd_idnr": "AUS0000424",
  "capacity_mw": 20.9,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "McKay Creek (Mount Beauty Hydro Scheme)",
  "gppd_idnr": "AUS0000104",
  "capacity_mw": 150,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Meadowbank",
  "gppd_idnr": "AUS0000122",
  "capacity_mw": 40,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Meekatharra",
  "gppd_idnr": "AUS0000408",
  "capacity_mw": 2.9,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Melbourne",
  "gppd_idnr": "AUS0000333",
  "capacity_mw": 1.2,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Merredin",
  "gppd_idnr": "AUS0000450",
  "capacity_mw": 82,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Mica Creek",
  "gppd_idnr": "AUS0000446",
  "capacity_mw": 325,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2013
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Mildura Solar Farm",
  "gppd_idnr": "AUS0000448",
  "capacity_mw": 1.5,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2014
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Millmerran",
  "gppd_idnr": "AUS0000163",
  "capacity_mw": 856,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Mintaro",
  "gppd_idnr": "AUS0000249",
  "capacity_mw": 90,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Moranbah",
  "gppd_idnr": "AUS0000164",
  "capacity_mw": 12,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Moranbah North",
  "gppd_idnr": "AUS0000054",
  "capacity_mw": 45.6,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Mortlake",
  "gppd_idnr": "AUS0000108",
  "capacity_mw": 566,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Mount Keith Nickel Mine",
  "gppd_idnr": "AUS0000213",
  "capacity_mw": 112,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Mount Magnet",
  "gppd_idnr": "AUS0000207",
  "capacity_mw": 1.9,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Mount Millar Wind Farm",
  "gppd_idnr": "AUS0000061",
  "capacity_mw": 70,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Mount Stuart",
  "gppd_idnr": "AUS0000165",
  "capacity_mw": 424,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Mt Gambier",
  "gppd_idnr": "AUS0000443",
  "capacity_mw": 10,
  "fuel1": "Biomass",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2013
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Mt Piper",
  "gppd_idnr": "AUS0000281",
  "capacity_mw": 1400,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Mugga Lane",
  "gppd_idnr": "AUS0000034",
  "capacity_mw": 3.5,
  "fuel1": "Waste",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Muja A",
  "gppd_idnr": "AUS0000393",
  "capacity_mw": 120,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Muja B",
  "gppd_idnr": "AUS0000392",
  "capacity_mw": 120,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Muja C",
  "gppd_idnr": "AUS0000214",
  "capacity_mw": 400,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Muja D",
  "gppd_idnr": "AUS0000215",
  "capacity_mw": 454,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Mulgrave",
  "gppd_idnr": "AUS0000375",
  "capacity_mw": 13,
  "fuel1": "Biomass",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Mumbida Wind Farm",
  "gppd_idnr": "AUS0000475",
  "capacity_mw": 55,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2014
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Mungarra",
  "gppd_idnr": "AUS0000216",
  "capacity_mw": 112,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Mungullah",
  "gppd_idnr": "AUS0000387",
  "capacity_mw": 18,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Munmorah",
  "gppd_idnr": "AUS0000282",
  "capacity_mw": 600,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Murray 1",
  "gppd_idnr": "AUS0000107",
  "capacity_mw": 950,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Murray 2",
  "gppd_idnr": "AUS0000106",
  "capacity_mw": 552,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Musselroe",
  "gppd_idnr": "AUS0000420",
  "capacity_mw": 168,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2013
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Narrogin Bioenergy Plant",
  "gppd_idnr": "AUS0000444",
  "capacity_mw": 1,
  "fuel1": "Biomass",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2013
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Neerabup",
  "gppd_idnr": "AUS0000198",
  "capacity_mw": 330,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Newman Iron Ore Mine",
  "gppd_idnr": "AUS0000199",
  "capacity_mw": 140,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Newport",
  "gppd_idnr": "AUS0000094",
  "capacity_mw": 500,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Nieterana",
  "gppd_idnr": "AUS0000013",
  "capacity_mw": 2.2,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Nine Network",
  "gppd_idnr": "AUS0000316",
  "capacity_mw": 3.2,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Noranda",
  "gppd_idnr": "AUS0000326",
  "capacity_mw": 1.1,
  "fuel1": "Waste",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Norseman Mine",
  "gppd_idnr": "AUS0000320",
  "capacity_mw": 9,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "North Sydney",
  "gppd_idnr": "AUS0000314",
  "capacity_mw": 2.4,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Northern",
  "gppd_idnr": "AUS0000248",
  "capacity_mw": 530,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Nymboida",
  "gppd_idnr": "AUS0000283",
  "capacity_mw": 33.6,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Nyngan Solar Plant",
  "gppd_idnr": "AUS0000476",
  "capacity_mw": 102,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2016
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Oakey",
  "gppd_idnr": "AUS0000166",
  "capacity_mw": 282,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Oakland Hills Wind Farm",
  "gppd_idnr": "AUS0000016",
  "capacity_mw": 67.2,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Oaky",
  "gppd_idnr": "AUS0000284",
  "capacity_mw": 4.8,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Oaky Creek",
  "gppd_idnr": "AUS0000167",
  "capacity_mw": 20,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Onslow",
  "gppd_idnr": "AUS0000411",
  "capacity_mw": 3.6,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Ord River",
  "gppd_idnr": "AUS0000224",
  "capacity_mw": 30,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Osborne",
  "gppd_idnr": "AUS0000235",
  "capacity_mw": 180,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Owen Springs",
  "gppd_idnr": "AUS0000255",
  "capacity_mw": 36.7,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Paloona",
  "gppd_idnr": "AUS0000130",
  "capacity_mw": 30,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Paraburdoo",
  "gppd_idnr": "AUS0000229",
  "capacity_mw": 153,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Paraburdoo (Standby)",
  "gppd_idnr": "AUS0000228",
  "capacity_mw": 20,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Pedler Creek",
  "gppd_idnr": "AUS0000236",
  "capacity_mw": 3.1,
  "fuel1": "Waste",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Pelican Point",
  "gppd_idnr": "AUS0000237",
  "capacity_mw": 478,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Perth Zoo",
  "gppd_idnr": "AUS0000426",
  "capacity_mw": 2.37,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Pindari",
  "gppd_idnr": "AUS0000012",
  "capacity_mw": 5.7,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Pine Creek",
  "gppd_idnr": "AUS0000258",
  "capacity_mw": 34.76,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Pinjar",
  "gppd_idnr": "AUS0000200",
  "capacity_mw": 584,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Pinjarra Bauxite Mine and Alumina Refinery",
  "gppd_idnr": "AUS0000201",
  "capacity_mw": 280,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Pioneer Sugar Mill",
  "gppd_idnr": "AUS0000053",
  "capacity_mw": 67.8,
  "fuel1": "Biomass",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Plane Creek Sugar Mill",
  "gppd_idnr": "AUS0000074",
  "capacity_mw": 14,
  "fuel1": "Biomass",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Playford",
  "gppd_idnr": "AUS0000247",
  "capacity_mw": 240,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Plutonic Gold Mine",
  "gppd_idnr": "AUS0000225",
  "capacity_mw": 28,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Poatina",
  "gppd_idnr": "AUS0000121",
  "capacity_mw": 300,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Port Hedland",
  "gppd_idnr": "AUS0000206",
  "capacity_mw": 126,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Port Hedland",
  "gppd_idnr": "AUS0000325",
  "capacity_mw": 84,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Port Lincoln",
  "gppd_idnr": "AUS0000238",
  "capacity_mw": 73.5,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Port Stanvac",
  "gppd_idnr": "AUS0000345",
  "capacity_mw": 57.6,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Proserpine Sugar Mill",
  "gppd_idnr": "AUS0000311",
  "capacity_mw": 17,
  "fuel1": "Biomass",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Quarantine",
  "gppd_idnr": "AUS0000239",
  "capacity_mw": 224,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Ravensthorpe",
  "gppd_idnr": "AUS0000202",
  "capacity_mw": 56,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Red Hill",
  "gppd_idnr": "AUS0000327",
  "capacity_mw": 3.65,
  "fuel1": "Waste",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Redbank",
  "gppd_idnr": "AUS0000285",
  "capacity_mw": 143.8,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Reece",
  "gppd_idnr": "AUS0000141",
  "capacity_mw": 238,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Remount",
  "gppd_idnr": "AUS0000115",
  "capacity_mw": 2.2,
  "fuel1": "Waste",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Repulse",
  "gppd_idnr": "AUS0000120",
  "capacity_mw": 28,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Revesby Workers Club",
  "gppd_idnr": "AUS0000317",
  "capacity_mw": 2.5,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Rochedale",
  "gppd_idnr": "AUS0000073",
  "capacity_mw": 4.2,
  "fuel1": "Waste",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Rockingham",
  "gppd_idnr": "AUS0000358",
  "capacity_mw": 2.1,
  "fuel1": "Waste",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Rocky Point Sugar Sugar Mill",
  "gppd_idnr": "AUS0000060",
  "capacity_mw": 30,
  "fuel1": "Biomass",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Roghan Road",
  "gppd_idnr": "AUS0000072",
  "capacity_mw": 1,
  "fuel1": "Waste",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Roma",
  "gppd_idnr": "AUS0000147",
  "capacity_mw": 80,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Ron Goodin",
  "gppd_idnr": "AUS0000254",
  "capacity_mw": 59.6,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Rowallan",
  "gppd_idnr": "AUS0000129",
  "capacity_mw": 10.5,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Rubicon",
  "gppd_idnr": "AUS0000095",
  "capacity_mw": 9.6,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Savannah Nickel Mine",
  "gppd_idnr": "AUS0000407",
  "capacity_mw": 10.8,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Shenton Park WMRC Project",
  "gppd_idnr": "AUS0000328",
  "capacity_mw": 1,
  "fuel1": "Waste",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Shepparton Biogas Generation Plant",
  "gppd_idnr": "AUS0000017",
  "capacity_mw": 1.1,
  "fuel1": "Waste",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Smithfield Energy",
  "gppd_idnr": "AUS0000286",
  "capacity_mw": 170.9,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Snowtown Wind Farm Stage 1",
  "gppd_idnr": "AUS0000005",
  "capacity_mw": 98.7,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Snowtown Wind Farm Stage 2",
  "gppd_idnr": "AUS0000456",
  "capacity_mw": 98.7,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Snuggery",
  "gppd_idnr": "AUS0000245",
  "capacity_mw": 63,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Solomon Iron Ore Mine",
  "gppd_idnr": "AUS0000458",
  "capacity_mw": 125,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Somerton",
  "gppd_idnr": "AUS0000096",
  "capacity_mw": 160,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "South Cardup (Shale Road Landfill)",
  "gppd_idnr": "AUS0000359",
  "capacity_mw": 3.3,
  "fuel1": "Waste",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "South Johnstone",
  "gppd_idnr": "AUS0000374",
  "capacity_mw": 20,
  "fuel1": "Biomass",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Springvale",
  "gppd_idnr": "AUS0000071",
  "capacity_mw": 4.12,
  "fuel1": "Waste",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "St George Leagues Club",
  "gppd_idnr": "AUS0000318",
  "capacity_mw": 1.5,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Stanwell",
  "gppd_idnr": "AUS0000168",
  "capacity_mw": 1460,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Stapylton Green Energy",
  "gppd_idnr": "AUS0000347",
  "capacity_mw": 4.8,
  "fuel1": "Biomass",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Starfish Hill Wind Farm",
  "gppd_idnr": "AUS0000052",
  "capacity_mw": 34.5,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Studland Bay (Woolnorth) Wind Farm",
  "gppd_idnr": "AUS0000010",
  "capacity_mw": 75,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Summerhill",
  "gppd_idnr": "AUS0000033",
  "capacity_mw": 2.2,
  "fuel1": "Waste",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Suncoast Gold Macadamia",
  "gppd_idnr": "AUS0000059",
  "capacity_mw": 1.5,
  "fuel1": "Biomass",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Sunrise Dam",
  "gppd_idnr": "AUS0000226",
  "capacity_mw": 28.4,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Swanbank B",
  "gppd_idnr": "AUS0000148",
  "capacity_mw": 480,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Swanbank E",
  "gppd_idnr": "AUS0000149",
  "capacity_mw": 385,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Symex Port Melbourne",
  "gppd_idnr": "AUS0000097",
  "capacity_mw": 5.9,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Tableland",
  "gppd_idnr": "AUS0000373",
  "capacity_mw": 7,
  "fuel1": "Biomass",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Tahmoor",
  "gppd_idnr": "AUS0000287",
  "capacity_mw": 7,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Tallawarra",
  "gppd_idnr": "AUS0000288",
  "capacity_mw": 420,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Tamala Park",
  "gppd_idnr": "AUS0000356",
  "capacity_mw": 4.65,
  "fuel1": "Waste",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Tamar Valley",
  "gppd_idnr": "AUS0000138",
  "capacity_mw": 390,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Tarong",
  "gppd_idnr": "AUS0000169",
  "capacity_mw": 15,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Tarong",
  "gppd_idnr": "AUS0000171",
  "capacity_mw": 1400,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Tarong North",
  "gppd_idnr": "AUS0000170",
  "capacity_mw": 450,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Tarraleah",
  "gppd_idnr": "AUS0000119",
  "capacity_mw": 90,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Tatura Biogas Generation Plant",
  "gppd_idnr": "AUS0000018",
  "capacity_mw": 1.1,
  "fuel1": "Waste",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Tea Tree Gully",
  "gppd_idnr": "AUS0000344",
  "capacity_mw": 1,
  "fuel1": "Waste",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Telfer Gold Mine",
  "gppd_idnr": "AUS0000230",
  "capacity_mw": 159,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Tennant Creek",
  "gppd_idnr": "AUS0000253",
  "capacity_mw": 18.2,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Teralba",
  "gppd_idnr": "AUS0000289",
  "capacity_mw": 4,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Terminal Storage",
  "gppd_idnr": "AUS0000058",
  "capacity_mw": 2.5,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "The Drop",
  "gppd_idnr": "AUS0000011",
  "capacity_mw": 2.5,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Ti Tree Bioenergy",
  "gppd_idnr": "AUS0000070",
  "capacity_mw": 3.3,
  "fuel1": "Waste",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Tods Corner",
  "gppd_idnr": "AUS0000118",
  "capacity_mw": 1.7,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Tomago Aluminium Smelter",
  "gppd_idnr": "AUS0000290",
  "capacity_mw": 810,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Toora Wind Farm",
  "gppd_idnr": "AUS0000069",
  "capacity_mw": 21,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Torrens Island A",
  "gppd_idnr": "AUS0000240",
  "capacity_mw": 480,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Torrens Island B",
  "gppd_idnr": "AUS0000241",
  "capacity_mw": 800,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Tower Mine",
  "gppd_idnr": "AUS0000291",
  "capacity_mw": 41.2,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Trevallyn",
  "gppd_idnr": "AUS0000032",
  "capacity_mw": 95.8,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Tribute",
  "gppd_idnr": "AUS0000128",
  "capacity_mw": 84,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Tully Sugar Mill",
  "gppd_idnr": "AUS0000310",
  "capacity_mw": 21.4,
  "fuel1": "Biomass",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Tumut 1 (Upper Tumut)",
  "gppd_idnr": "AUS0000292",
  "capacity_mw": 384,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Tumut 2 (Upper Tumut)",
  "gppd_idnr": "AUS0000293",
  "capacity_mw": 336,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Tumut 3",
  "gppd_idnr": "AUS0000031",
  "capacity_mw": 1500,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Tungatinah",
  "gppd_idnr": "AUS0000117",
  "capacity_mw": 125,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "University of Queensland (St Lucia Campus) Solar Array",
  "gppd_idnr": "AUS0000425",
  "capacity_mw": 1.2,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Upper Lake Margaret",
  "gppd_idnr": "AUS0000133",
  "capacity_mw": 8.4,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Uranquinty",
  "gppd_idnr": "AUS0000294",
  "capacity_mw": 664,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Uterne Solar",
  "gppd_idnr": "AUS0000470",
  "capacity_mw": 1,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2014
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Vales Point B",
  "gppd_idnr": "AUS0000295",
  "capacity_mw": 1320,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Valley (Peaking Facility)",
  "gppd_idnr": "AUS0000098",
  "capacity_mw": 300,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Victoria Sugar Mill",
  "gppd_idnr": "AUS0000175",
  "capacity_mw": 24,
  "fuel1": "Biomass",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Visy Paper Gibson Island",
  "gppd_idnr": "AUS0000445",
  "capacity_mw": 2,
  "fuel1": "Biomass",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Wagerup",
  "gppd_idnr": "AUS0000204",
  "capacity_mw": 380,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Wagerup Bauxite Mine and Alumina Refinery",
  "gppd_idnr": "AUS0000203",
  "capacity_mw": 98,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Walkaway Wind Farm",
  "gppd_idnr": "AUS0000002",
  "capacity_mw": 89.1,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Wallerawang C",
  "gppd_idnr": "AUS0000296",
  "capacity_mw": 1000,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Warmun",
  "gppd_idnr": "AUS0000369",
  "capacity_mw": 1.3,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Warragamba",
  "gppd_idnr": "AUS0000297",
  "capacity_mw": 50,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Warrego",
  "gppd_idnr": "AUS0000262",
  "capacity_mw": 19,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Waterloo Wind Farm",
  "gppd_idnr": "AUS0000050",
  "capacity_mw": 111,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Wattle Point Wind Farm",
  "gppd_idnr": "AUS0000004",
  "capacity_mw": 90.75,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Waubra Wind Farm",
  "gppd_idnr": "AUS0000019",
  "capacity_mw": 192,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Wayatinah",
  "gppd_idnr": "AUS0000116",
  "capacity_mw": 38.3,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Weddell",
  "gppd_idnr": "AUS0000260",
  "capacity_mw": 86,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "West Angelas Mine",
  "gppd_idnr": "AUS0000451",
  "capacity_mw": 86,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "West Illawarra Leagues Club",
  "gppd_idnr": "AUS0000298",
  "capacity_mw": 1,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "West Kalgoorlie",
  "gppd_idnr": "AUS0000205",
  "capacity_mw": 60,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "West Kiewa (Mount Beauty Hydro Scheme)",
  "gppd_idnr": "AUS0000105",
  "capacity_mw": 60,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "West Nowra (Shoalhaven)",
  "gppd_idnr": "AUS0000030",
  "capacity_mw": 1,
  "fuel1": "Waste",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Western Suburbs Leagues Club (Campbelltown)",
  "gppd_idnr": "AUS0000299",
  "capacity_mw": 1.3,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Whitwood Road",
  "gppd_idnr": "AUS0000068",
  "capacity_mw": 1.1,
  "fuel1": "Waste",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Wilga Park",
  "gppd_idnr": "AUS0000302",
  "capacity_mw": 16,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Wilmot",
  "gppd_idnr": "AUS0000140",
  "capacity_mw": 32,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Wilpena Solar Farm",
  "gppd_idnr": "AUS0000447",
  "capacity_mw": 145,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2014
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Wiluna",
  "gppd_idnr": "AUS0000384",
  "capacity_mw": 1.3,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Wiluna Gold Mine",
  "gppd_idnr": "AUS0000227",
  "capacity_mw": 21,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Windimurra Vanadium Mine",
  "gppd_idnr": "AUS0000322",
  "capacity_mw": 23.7,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Windy Hill Wind Farm",
  "gppd_idnr": "AUS0000051",
  "capacity_mw": 12,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Wingfield I",
  "gppd_idnr": "AUS0000242",
  "capacity_mw": 4.1,
  "fuel1": "Waste",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Wingfield II",
  "gppd_idnr": "AUS0000243",
  "capacity_mw": 4.1,
  "fuel1": "Waste",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Wivenhoe",
  "gppd_idnr": "AUS0000057",
  "capacity_mw": 4.5,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Wivenhoe Hydroelectric",
  "gppd_idnr": "AUS0000150",
  "capacity_mw": 500,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Wodgina",
  "gppd_idnr": "AUS0000406",
  "capacity_mw": 13.7,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Wollert",
  "gppd_idnr": "AUS0000067",
  "capacity_mw": 4.4,
  "fuel1": "Waste",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Wonthaggi Wind Farm",
  "gppd_idnr": "AUS0000001",
  "capacity_mw": 12,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Woodlawn Bioreactor",
  "gppd_idnr": "AUS0000029",
  "capacity_mw": 4.3,
  "fuel1": "Waste",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Woodlawn Wind Farm",
  "gppd_idnr": "AUS0000028",
  "capacity_mw": 48.3,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Woodman Point",
  "gppd_idnr": "AUS0000354",
  "capacity_mw": 1.8,
  "fuel1": "Waste",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Worsley",
  "gppd_idnr": "AUS0000389",
  "capacity_mw": 120,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Worsley Cogeneration",
  "gppd_idnr": "AUS0000217",
  "capacity_mw": 106,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Wyangala A",
  "gppd_idnr": "AUS0000026",
  "capacity_mw": 20,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Wyndham",
  "gppd_idnr": "AUS0000066",
  "capacity_mw": 1.1,
  "fuel1": "Waste",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Yabulu",
  "gppd_idnr": "AUS0000172",
  "capacity_mw": 244,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Yallourn",
  "gppd_idnr": "AUS0000100",
  "capacity_mw": 1480,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Yambuk Wind Farm",
  "gppd_idnr": "AUS0000020",
  "capacity_mw": 30,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Yarrawonga",
  "gppd_idnr": "AUS0000101",
  "capacity_mw": 9.5,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Yarwun",
  "gppd_idnr": "AUS0000173",
  "capacity_mw": 154,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Yulara",
  "gppd_idnr": "AUS0000257",
  "capacity_mw": 4.5,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Australia",
  "name": "Yurralyi Maya (Karratha Seven Mile)",
  "gppd_idnr": "AUS0000218",
  "capacity_mw": 180,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Aioi",
  "gppd_idnr": "WRI1000657",
  "capacity_mw": 1125,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Akita",
  "gppd_idnr": "WRI1000619",
  "capacity_mw": 1300,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Ako",
  "gppd_idnr": "WRI1000656",
  "capacity_mw": 1200,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Anan",
  "gppd_idnr": "WRI1000663",
  "capacity_mw": 1245,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Anegasaki",
  "gppd_idnr": "WRI1000625",
  "capacity_mw": 3600,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Aoi Solar Power Plant",
  "gppd_idnr": "WRI1026465",
  "capacity_mw": 2,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Aoyama Kogen",
  "gppd_idnr": "WRI1020222",
  "capacity_mw": 15,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 2003,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Ashikita Solar Power Plant",
  "gppd_idnr": "WRI1026466",
  "capacity_mw": 21.5,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Atsumi",
  "gppd_idnr": "WRI1000640",
  "capacity_mw": 1900,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Awaji Kifune Solar Power Plant",
  "gppd_idnr": "WRI1026467",
  "capacity_mw": 34.7,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Azumi",
  "gppd_idnr": "WRI1000699",
  "capacity_mw": 623,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Boyo Kushiro",
  "gppd_idnr": "WRI1026514",
  "capacity_mw": 1.4,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 2014,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Buzen",
  "gppd_idnr": "WRI1000667",
  "capacity_mw": 1000,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Chiba",
  "gppd_idnr": "WRI1000627",
  "capacity_mw": 2880,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Chiba Kawatetsu",
  "gppd_idnr": "WRI1020075",
  "capacity_mw": 400,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 2002,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Chita",
  "gppd_idnr": "WRI1000638",
  "capacity_mw": 3966,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Chita Daini",
  "gppd_idnr": "WRI1000641",
  "capacity_mw": 1708,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Daini Numazawa",
  "gppd_idnr": "WRI1000693",
  "capacity_mw": 460,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Fujimi-machi Solar Power Plant",
  "gppd_idnr": "WRI1026468",
  "capacity_mw": 8,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Fukuroda Solar Power Plant",
  "gppd_idnr": "WRI1026469",
  "capacity_mw": 31,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Fukushima Daina",
  "gppd_idnr": "WRI1000678",
  "capacity_mw": 4400,
  "fuel1": "Nuclear",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Fukuyama Recyling Power",
  "gppd_idnr": "WRI1020063",
  "capacity_mw": 21,
  "fuel1": "Waste",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 2004,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Funakura Solar Power Plant",
  "gppd_idnr": "WRI1026470",
  "capacity_mw": 7.7,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Futtsu",
  "gppd_idnr": "WRI1000621",
  "capacity_mw": 5040,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Futtsu Solar Power Plant",
  "gppd_idnr": "WRI1026471",
  "capacity_mw": 42,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Genkai",
  "gppd_idnr": "WRI1000687",
  "capacity_mw": 3478,
  "fuel1": "Nuclear",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Gobo",
  "gppd_idnr": "WRI1000650",
  "capacity_mw": 1800,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Goi",
  "gppd_idnr": "WRI1000630",
  "capacity_mw": 1886,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Gushikawa",
  "gppd_idnr": "WRI1020040",
  "capacity_mw": 312,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Hachijojima",
  "gppd_idnr": "WRI1020115",
  "capacity_mw": 3.3,
  "fuel1": "Geothermal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 1999,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Hachinohe - Mitsui Solar Power Plant",
  "gppd_idnr": "WRI1026472",
  "capacity_mw": 8,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Hachinohe - Tohoku Electric Solar Power Plant",
  "gppd_idnr": "WRI1026473",
  "capacity_mw": 1.5,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Hachinohe Taiheiyo",
  "gppd_idnr": "WRI1020084",
  "capacity_mw": 125.2,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Hamaoka",
  "gppd_idnr": "WRI1000680",
  "capacity_mw": 3617,
  "fuel1": "Nuclear",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Haramachi",
  "gppd_idnr": "WRI1000618",
  "capacity_mw": 2000,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Hatanagi No.2",
  "gppd_idnr": "WRI1020020",
  "capacity_mw": 87,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Hatchobaru Otake",
  "gppd_idnr": "WRI1020116",
  "capacity_mw": 110,
  "fuel1": "Geothermal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Hekinan",
  "gppd_idnr": "WRI1000637",
  "capacity_mw": 4100,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Hibiki - Eneseed Solar Power Plant",
  "gppd_idnr": "WRI1026474",
  "capacity_mw": 20.5,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Higashi-Dori",
  "gppd_idnr": "WRI1000675",
  "capacity_mw": 1100,
  "fuel1": "Nuclear",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Higashi Niigata",
  "gppd_idnr": "WRI1000617",
  "capacity_mw": 4810,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Higashi Ogishima",
  "gppd_idnr": "WRI1000629",
  "capacity_mw": 2000,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Higashiyama Solar Power Plant",
  "gppd_idnr": "WRI1026475",
  "capacity_mw": 1.8,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Hikari-no-Mori Solar Power Plant",
  "gppd_idnr": "WRI1026476",
  "capacity_mw": 10,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Himeji Daiichi",
  "gppd_idnr": "WRI1000654",
  "capacity_mw": 1442,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Himeji Daini",
  "gppd_idnr": "WRI1000653",
  "capacity_mw": 1650,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Himeji Solar Power Plant",
  "gppd_idnr": "WRI1026477",
  "capacity_mw": 10,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Hirohata",
  "gppd_idnr": "WRI1020089",
  "capacity_mw": 380,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 1999,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Hirokawa-Hidakagawa",
  "gppd_idnr": "WRI1020211",
  "capacity_mw": 20,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 2014,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Hirono",
  "gppd_idnr": "WRI1000623",
  "capacity_mw": 4400,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Hitachinaka",
  "gppd_idnr": "WRI1000635",
  "capacity_mw": 1000,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Hitotsuse",
  "gppd_idnr": "WRI1000722",
  "capacity_mw": 180,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Hoheiko",
  "gppd_idnr": "WRI1020234",
  "capacity_mw": 50,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 1972,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Hongawa",
  "gppd_idnr": "WRI1000718",
  "capacity_mw": 615,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Iidaka Solar Power Plant",
  "gppd_idnr": "WRI1026478",
  "capacity_mw": 1.9,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Ikata",
  "gppd_idnr": "WRI1000686",
  "capacity_mw": 2022,
  "fuel1": "Nuclear",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Ikata Wind",
  "gppd_idnr": "WRI1020218",
  "capacity_mw": 18,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 2010,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Ikawa",
  "gppd_idnr": "WRI1020024",
  "capacity_mw": 62,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Ikawa - Juwi Solar Power Plant",
  "gppd_idnr": "WRI1026479",
  "capacity_mw": 1.5,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Ikehara",
  "gppd_idnr": "WRI1000731",
  "capacity_mw": 350,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Ikushima - Kyocera Solar Power Plant",
  "gppd_idnr": "WRI1026480",
  "capacity_mw": 2.4,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Imaichi",
  "gppd_idnr": "WRI1000696",
  "capacity_mw": 1050,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Imizu - Orix Solar Power Plant",
  "gppd_idnr": "WRI1026481",
  "capacity_mw": 2.5,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Isago Shin",
  "gppd_idnr": "WRI1000672",
  "capacity_mw": 1200,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Ise Futami Solar Power Plant",
  "gppd_idnr": "WRI1026482",
  "capacity_mw": 7.7,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Ishikawa",
  "gppd_idnr": "WRI1020042",
  "capacity_mw": 315,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Itano Solar Power Plant",
  "gppd_idnr": "WRI1026483",
  "capacity_mw": 2.8,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Itoigawa Power Plant",
  "gppd_idnr": "WRI1020056",
  "capacity_mw": 149,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Iwanuma - Marubeni Solar Power Plant",
  "gppd_idnr": "WRI1026484",
  "capacity_mw": 28.3,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Iwaya Ecopower",
  "gppd_idnr": "WRI1020201",
  "capacity_mw": 27,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 2002,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Izamizawa Solar Power Plant",
  "gppd_idnr": "WRI1026485",
  "capacity_mw": 9,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 2016,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Izumi Solar Power Plant",
  "gppd_idnr": "WRI1026486",
  "capacity_mw": 2.6,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Izumiotsu Solar Power Plant",
  "gppd_idnr": "WRI1026487",
  "capacity_mw": 19.6,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Izunokuni Solar Power Plant",
  "gppd_idnr": "WRI1026488",
  "capacity_mw": 2.2,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Joetsu Solar Power Plant",
  "gppd_idnr": "WRI1026489",
  "capacity_mw": 2,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Jozankei",
  "gppd_idnr": "WRI1020235",
  "capacity_mw": 120,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 1989,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Kagoshima - Nanatsujima Solar Power Plant",
  "gppd_idnr": "WRI1026490",
  "capacity_mw": 70,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Kainan",
  "gppd_idnr": "WRI1000648",
  "capacity_mw": 2100,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Kakkonda",
  "gppd_idnr": "WRI1020117",
  "capacity_mw": 80,
  "fuel1": "Geothermal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Kamaishi Thermal",
  "gppd_idnr": "WRI1020048",
  "capacity_mw": 149,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Kameyama Solar Power Plant",
  "gppd_idnr": "WRI1026491",
  "capacity_mw": 5,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Kamikawai Solar Power Plant",
  "gppd_idnr": "WRI1026492",
  "capacity_mw": 13.5,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Kamogawa Solar Power Plant",
  "gppd_idnr": "WRI1026493",
  "capacity_mw": 31.2,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Kani Mill",
  "gppd_idnr": "WRI1020086",
  "capacity_mw": 70,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 2001,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Kannagawa",
  "gppd_idnr": "WRI1000700",
  "capacity_mw": 470,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Kansai Sendai",
  "gppd_idnr": "WRI1061348",
  "capacity_mw": 112,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 2017,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Kasadori",
  "gppd_idnr": "WRI1020203",
  "capacity_mw": 38,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Kashima",
  "gppd_idnr": "WRI1000622",
  "capacity_mw": 4400,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Kashima Kita",
  "gppd_idnr": "WRI1020073",
  "capacity_mw": 650,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 1981,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Kashima Kyodo",
  "gppd_idnr": "WRI1020068",
  "capacity_mw": 1000,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 1973,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Kashiwazaki Kariwa",
  "gppd_idnr": "WRI1000679",
  "capacity_mw": 8212,
  "fuel1": "Nuclear",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Kawagoe",
  "gppd_idnr": "WRI1000636",
  "capacity_mw": 4802,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Kawasaki",
  "gppd_idnr": "WRI1000631",
  "capacity_mw": 1500,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Kawasaki CCGT",
  "gppd_idnr": "WRI1020070",
  "capacity_mw": 840,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 2008,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Kazunogawa",
  "gppd_idnr": "WRI1000698",
  "capacity_mw": 800,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Kikugawa Horinouchiya Solar Power Plant",
  "gppd_idnr": "WRI1026494",
  "capacity_mw": 7.5,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Kikugawa Ishiyama Solar Power Plant",
  "gppd_idnr": "WRI1026495",
  "capacity_mw": 9.4,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Kimitsu",
  "gppd_idnr": "WRI1020067",
  "capacity_mw": 300,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Kin",
  "gppd_idnr": "WRI1020039",
  "capacity_mw": 440,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Kinugawa Solar Power Plant",
  "gppd_idnr": "WRI1026496",
  "capacity_mw": 1.2,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Kisenyama",
  "gppd_idnr": "WRI1000713",
  "capacity_mw": 466,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Kisozaki Solar Power Plant",
  "gppd_idnr": "WRI1026497",
  "capacity_mw": 49,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Kitakyushu - FirstSolar Solar Power Plant",
  "gppd_idnr": "WRI1026498",
  "capacity_mw": 1.3,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Kitakyushu 13 Solar Power Plant",
  "gppd_idnr": "WRI1026499",
  "capacity_mw": 13,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Kitsuki Solar Power Plant",
  "gppd_idnr": "WRI1026500",
  "capacity_mw": 24.4,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Kizuna Solar Power Plant",
  "gppd_idnr": "WRI1026501",
  "capacity_mw": 3.6,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Kokonoe Solar Power Plant",
  "gppd_idnr": "WRI1026502",
  "capacity_mw": 25.4,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Komatsushima - Nippon Paper 1 Solar Power Plant",
  "gppd_idnr": "WRI1026503",
  "capacity_mw": 21,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Komatsushima - Nippon Paper 2 Solar Power Plant",
  "gppd_idnr": "WRI1026504",
  "capacity_mw": 21,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Komatsushima - Nippon Paper 3 Solar Power Plant",
  "gppd_idnr": "WRI1026505",
  "capacity_mw": 21,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Komatsushima - Softbank Solar Power Plant",
  "gppd_idnr": "WRI1026506",
  "capacity_mw": 2.8,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Komekurayama Solar Power Plant",
  "gppd_idnr": "WRI1026507",
  "capacity_mw": 10,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Koriyama - Kyocera Solar Power Plant",
  "gppd_idnr": "WRI1026508",
  "capacity_mw": 1.5,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Koshimizu Solar Power Plant",
  "gppd_idnr": "WRI1026509",
  "capacity_mw": 9,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Koyagi Solar Power Plant",
  "gppd_idnr": "WRI1026510",
  "capacity_mw": 2.6,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Kumamoto Arao Solar Power Plant",
  "gppd_idnr": "WRI1026511",
  "capacity_mw": 22.4,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Kurisu Solar Power Plant",
  "gppd_idnr": "WRI1026512",
  "capacity_mw": 3.5,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Kushira Solar Power Plant",
  "gppd_idnr": "WRI1026513",
  "capacity_mw": 7.8,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Kushiro - Hoshigaura Solar Power Plant",
  "gppd_idnr": "WRI1026515",
  "capacity_mw": 1.5,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Kushiro - Tsuruno Solar Power Plant",
  "gppd_idnr": "WRI1026517",
  "capacity_mw": 21.7,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Kyoto - Softbank Solar Power Plant",
  "gppd_idnr": "WRI1026518",
  "capacity_mw": 4.2,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Maizuru",
  "gppd_idnr": "WRI1000652",
  "capacity_mw": 1800,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Makurazaki Airport Solar Power Plant",
  "gppd_idnr": "WRI1026519",
  "capacity_mw": 8.3,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Masuura Kushiro",
  "gppd_idnr": "WRI1026516",
  "capacity_mw": 2.1,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 2014,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Matanogawa",
  "gppd_idnr": "WRI1000715",
  "capacity_mw": 1200,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Matsukawa Geothermal",
  "gppd_idnr": "WRI1020119",
  "capacity_mw": 23.5,
  "fuel1": "Geothermal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 1966,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Matsukawa Solar Power Plant",
  "gppd_idnr": "WRI1026520",
  "capacity_mw": 1.1,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Matsushima",
  "gppd_idnr": "WRI1000673",
  "capacity_mw": 1000,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Matsuura",
  "gppd_idnr": "WRI1000670",
  "capacity_mw": 2000,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Matsuura",
  "gppd_idnr": "WRI1020037",
  "capacity_mw": 700,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Mazegawa Daiichi",
  "gppd_idnr": "WRI1000708",
  "capacity_mw": 288,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Mazegawa No.2",
  "gppd_idnr": "WRI1020023",
  "capacity_mw": 66,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Meishihama Solar Power Plant",
  "gppd_idnr": "WRI1026521",
  "capacity_mw": 1.7,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Miboro",
  "gppd_idnr": "WRI1000734",
  "capacity_mw": 215,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Midono",
  "gppd_idnr": "WRI1000701",
  "capacity_mw": 245,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Mihama",
  "gppd_idnr": "WRI1000682",
  "capacity_mw": 826,
  "fuel1": "Nuclear",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Mihama Solar Power Plant",
  "gppd_idnr": "WRI1026522",
  "capacity_mw": 13,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Miike Power Plant",
  "gppd_idnr": "WRI1020060",
  "capacity_mw": 175,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Minabe Solar Power Plant",
  "gppd_idnr": "WRI1026523",
  "capacity_mw": 1.1,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Minami Alps Solar Power Plant",
  "gppd_idnr": "WRI1026524",
  "capacity_mw": 2.7,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Minami Yokohama",
  "gppd_idnr": "WRI1000632",
  "capacity_mw": 1150,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Misaki Solar Power Plant",
  "gppd_idnr": "WRI1026525",
  "capacity_mw": 10,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Mishima Mill (Taio)",
  "gppd_idnr": "WRI1020079",
  "capacity_mw": 500,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Misumi",
  "gppd_idnr": "WRI1000660",
  "capacity_mw": 1000,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Mito Solar Power Plant",
  "gppd_idnr": "WRI1026526",
  "capacity_mw": 39.2,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Mitoyo Solar Power Plant",
  "gppd_idnr": "WRI1026527",
  "capacity_mw": 2,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Miyama Solar Power Plant",
  "gppd_idnr": "WRI1026528",
  "capacity_mw": 22.3,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Mizushima Energy Center",
  "gppd_idnr": "WRI1061346",
  "capacity_mw": 112,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 2017,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Mori",
  "gppd_idnr": "WRI1020120",
  "capacity_mw": 50,
  "fuel1": "Geothermal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 1982,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Muroran Hatchodaira Solar Power Plant",
  "gppd_idnr": "WRI1026529",
  "capacity_mw": 1.2,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Mutsu-Ogawara",
  "gppd_idnr": "WRI1020194",
  "capacity_mw": 32,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 2003,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Nabara",
  "gppd_idnr": "WRI1000716",
  "capacity_mw": 620,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Nagano",
  "gppd_idnr": "WRI1000733",
  "capacity_mw": 220,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Nago Futami Solar Power Plant",
  "gppd_idnr": "WRI1026530",
  "capacity_mw": 8.4,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Nagoya Power Plant",
  "gppd_idnr": "WRI1020055",
  "capacity_mw": 149,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 1990,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Nagoya Power Plant 2",
  "gppd_idnr": "WRI1020155",
  "capacity_mw": 110,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 2017,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Naie",
  "gppd_idnr": "WRI1020030",
  "capacity_mw": 350,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Nakakuma Solar Power Plant",
  "gppd_idnr": "WRI1026531",
  "capacity_mw": 2.5,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Nakoso",
  "gppd_idnr": "WRI1020046",
  "capacity_mw": 1700,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Nanaoota",
  "gppd_idnr": "WRI1000646",
  "capacity_mw": 1200,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Nanko",
  "gppd_idnr": "WRI1000651",
  "capacity_mw": 1800,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Nanyo Complex",
  "gppd_idnr": "WRI1020080",
  "capacity_mw": 829,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 2008,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Nasushiobara - Softbank Solar Power Plant (Under Construction)",
  "gppd_idnr": "WRI1026532",
  "capacity_mw": 13.9,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Niigata Minato",
  "gppd_idnr": "WRI1020071",
  "capacity_mw": 700,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Niihama-nishi",
  "gppd_idnr": "WRI1020043",
  "capacity_mw": 300,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Niikappu",
  "gppd_idnr": "WRI1000691",
  "capacity_mw": 200,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Nishi Nagoya",
  "gppd_idnr": "WRI1000643",
  "capacity_mw": 1190,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Nishiki - Sojitz Solar Power Plant",
  "gppd_idnr": "WRI1026533",
  "capacity_mw": 13,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Nokanan",
  "gppd_idnr": "WRI1020227",
  "capacity_mw": 30,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 1971,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Noshiro",
  "gppd_idnr": "WRI1000620",
  "capacity_mw": 1200,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Numappara",
  "gppd_idnr": "WRI1000726",
  "capacity_mw": 675,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Nyugawa",
  "gppd_idnr": "WRI1020045",
  "capacity_mw": 250,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Ofunato Solar Power Plant",
  "gppd_idnr": "WRI1026534",
  "capacity_mw": 19.8,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 2015,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Ogiri",
  "gppd_idnr": "WRI1020121",
  "capacity_mw": 35,
  "fuel1": "Geothermal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 1996,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Ogishima Solar Power Plant",
  "gppd_idnr": "WRI1026535",
  "capacity_mw": 13,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Ohgishima",
  "gppd_idnr": "WRI1020066",
  "capacity_mw": 1221,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Ohi",
  "gppd_idnr": "WRI1000634",
  "capacity_mw": 1050,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Ohi",
  "gppd_idnr": "WRI1000684",
  "capacity_mw": 4710,
  "fuel1": "Nuclear",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Ohira",
  "gppd_idnr": "WRI1000721",
  "capacity_mw": 500,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Oita - Hoso Solar Power Plant",
  "gppd_idnr": "WRI1026536",
  "capacity_mw": 11,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Oita - JGC Solar Power Plant",
  "gppd_idnr": "WRI1026537",
  "capacity_mw": 26.5,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Oita - Marubeni Solar Power Plant",
  "gppd_idnr": "WRI1026538",
  "capacity_mw": 82,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Oita - Mitsui Fudosan Solar Power Plant",
  "gppd_idnr": "WRI1026539",
  "capacity_mw": 21,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Oita IPP",
  "gppd_idnr": "WRI1020078",
  "capacity_mw": 300,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 2002,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Oita Thermal Power Plant",
  "gppd_idnr": "WRI1020072",
  "capacity_mw": 657,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Okawachi",
  "gppd_idnr": "WRI1000711",
  "capacity_mw": 1280,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Okukiyotsu",
  "gppd_idnr": "WRI1000725",
  "capacity_mw": 1000,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Okumino",
  "gppd_idnr": "WRI1000704",
  "capacity_mw": 1500,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Okuniikappu",
  "gppd_idnr": "WRI1020233",
  "capacity_mw": 44,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 1963,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Okutadami",
  "gppd_idnr": "WRI1000728",
  "capacity_mw": 560,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Okutataragi",
  "gppd_idnr": "WRI1000710",
  "capacity_mw": 1932,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Okuyahagi Daini",
  "gppd_idnr": "WRI1000705",
  "capacity_mw": 780,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Okuyoshino",
  "gppd_idnr": "WRI1000712",
  "capacity_mw": 1206,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Omarugawa",
  "gppd_idnr": "WRI1000719",
  "capacity_mw": 900,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Omuta Miikekou Solar Power Plant",
  "gppd_idnr": "WRI1026540",
  "capacity_mw": 20,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Onagawa",
  "gppd_idnr": "WRI1000676",
  "capacity_mw": 2174,
  "fuel1": "Nuclear",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Onahama 1 Solar Power Plant",
  "gppd_idnr": "WRI1026541",
  "capacity_mw": 12,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Onahama 2 Solar Power Plant",
  "gppd_idnr": "WRI1026542",
  "capacity_mw": 6,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Onbetsu Solar Power Plant",
  "gppd_idnr": "WRI1026543",
  "capacity_mw": 20,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Onikobe",
  "gppd_idnr": "WRI1020122",
  "capacity_mw": 15,
  "fuel1": "Geothermal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 1975,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Onuma Plant",
  "gppd_idnr": "WRI1020123",
  "capacity_mw": 9.5,
  "fuel1": "Geothermal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 1973,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Osaki CoolGen project",
  "gppd_idnr": "WRI1061347",
  "capacity_mw": 166,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 2017,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Osakikamijima Solar Power Plant",
  "gppd_idnr": "WRI1026544",
  "capacity_mw": 13.7,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Oshirakawa",
  "gppd_idnr": "WRI1020237",
  "capacity_mw": 59,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 1963,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Otake",
  "gppd_idnr": "WRI1020124",
  "capacity_mw": 12.5,
  "fuel1": "Geothermal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 1967,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Otori",
  "gppd_idnr": "WRI1000735",
  "capacity_mw": 182,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Owase Mita",
  "gppd_idnr": "WRI1020062",
  "capacity_mw": 875,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Ozu Solar Power Plant",
  "gppd_idnr": "WRI1026545",
  "capacity_mw": 1.1,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Reihoku",
  "gppd_idnr": "WRI1000666",
  "capacity_mw": 1400,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Rokkasho - Chitosedaira North Solar Power Plant",
  "gppd_idnr": "WRI1026546",
  "capacity_mw": 50,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Rokkasho - Takahoko Solar Power Plant",
  "gppd_idnr": "WRI1026547",
  "capacity_mw": 65,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Saijo",
  "gppd_idnr": "WRI1020036",
  "capacity_mw": 406,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Saijo - Itochu Solar Power Plant",
  "gppd_idnr": "WRI1026548",
  "capacity_mw": 33.8,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Saijo - Sumitomo Solar Power Plant",
  "gppd_idnr": "WRI1026549",
  "capacity_mw": 23,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Saijocho Taguchi Solar Power Plant",
  "gppd_idnr": "WRI1026550",
  "capacity_mw": 2.7,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Sakai Solar Power Plant",
  "gppd_idnr": "WRI1026551",
  "capacity_mw": 28,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Sakaide",
  "gppd_idnr": "WRI1000662",
  "capacity_mw": 1500,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Sakaide - JAG Solar Power Plant",
  "gppd_idnr": "WRI1026552",
  "capacity_mw": 2,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Sakaiko",
  "gppd_idnr": "WRI1000649",
  "capacity_mw": 2000,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Sakata Kyodo",
  "gppd_idnr": "WRI1020077",
  "capacity_mw": 700,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 1977,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Sakuma",
  "gppd_idnr": "WRI1000730",
  "capacity_mw": 350,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Sanyo Onoda Solar Power Plant",
  "gppd_idnr": "WRI1026553",
  "capacity_mw": 21,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Sendai",
  "gppd_idnr": "WRI1000668",
  "capacity_mw": 1000,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Sendai",
  "gppd_idnr": "WRI1000688",
  "capacity_mw": 1780,
  "fuel1": "Nuclear",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Sendai Solar Power Plant",
  "gppd_idnr": "WRI1026554",
  "capacity_mw": 2,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Sharp - Yaita Solar Power Plant",
  "gppd_idnr": "WRI1026555",
  "capacity_mw": 1.7,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Shibukawa Solar Power Plant",
  "gppd_idnr": "WRI1026556",
  "capacity_mw": 2.4,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Shibushi - Solarig Solar Power Plant",
  "gppd_idnr": "WRI1026557",
  "capacity_mw": 1.7,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Shika",
  "gppd_idnr": "WRI1000681",
  "capacity_mw": 1746,
  "fuel1": "Nuclear",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Shimane",
  "gppd_idnr": "WRI1000685",
  "capacity_mw": 820,
  "fuel1": "Nuclear",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Shimogo",
  "gppd_idnr": "WRI1000724",
  "capacity_mw": 1000,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Shin Kokura",
  "gppd_idnr": "WRI1000665",
  "capacity_mw": 1800,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Shin Nagoya",
  "gppd_idnr": "WRI1000639",
  "capacity_mw": 3058,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Shin Nariwagawa",
  "gppd_idnr": "WRI1000717",
  "capacity_mw": 303,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Shin Oita",
  "gppd_idnr": "WRI1000664",
  "capacity_mw": 2295,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Shin Onoda",
  "gppd_idnr": "WRI1000661",
  "capacity_mw": 1000,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Shin Takasegawa",
  "gppd_idnr": "WRI1000694",
  "capacity_mw": 1280,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Shin Toyone",
  "gppd_idnr": "WRI1000723",
  "capacity_mw": 1125,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Shinagawa",
  "gppd_idnr": "WRI1000633",
  "capacity_mw": 1140,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Shinanogawa",
  "gppd_idnr": "WRI1000703",
  "capacity_mw": 177,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Shinchi",
  "gppd_idnr": "WRI1020064",
  "capacity_mw": 2000,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Shinkai-machi Solar Power Plant",
  "gppd_idnr": "WRI1026558",
  "capacity_mw": 11.7,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Shinko Kobe",
  "gppd_idnr": "WRI1020065",
  "capacity_mw": 1400,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 2002,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Shinmaiko Solar Power Plant",
  "gppd_idnr": "WRI1026559",
  "capacity_mw": 12.8,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Shinto - Softbank Solar Power Plant",
  "gppd_idnr": "WRI1026560",
  "capacity_mw": 2.4,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Shiobara",
  "gppd_idnr": "WRI1000697",
  "capacity_mw": 900,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Shiranuka Solar Power Plant",
  "gppd_idnr": "WRI1026561",
  "capacity_mw": 32.5,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Shiraoi - Softbank Solar Power Plant",
  "gppd_idnr": "WRI1026562",
  "capacity_mw": 2.6,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Sodegaura",
  "gppd_idnr": "WRI1000624",
  "capacity_mw": 3600,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Suigo Itako Solar Power Plant",
  "gppd_idnr": "WRI1026563",
  "capacity_mw": 14,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Sukagawa Solar Power Plant",
  "gppd_idnr": "WRI1026564",
  "capacity_mw": 26.3,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Sumikawa Akita",
  "gppd_idnr": "WRI1020125",
  "capacity_mw": 50,
  "fuel1": "Geothermal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 1995,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Sumitomo Metals Kashima Thermal",
  "gppd_idnr": "WRI1020049",
  "capacity_mw": 475,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Sunagawa",
  "gppd_idnr": "WRI1020031",
  "capacity_mw": 250,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Tachibana-wan",
  "gppd_idnr": "WRI1020035",
  "capacity_mw": 700,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Tachibanawan",
  "gppd_idnr": "WRI1000669",
  "capacity_mw": 2100,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Tadami",
  "gppd_idnr": "WRI1020236",
  "capacity_mw": 65,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 1989,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Tagokura",
  "gppd_idnr": "WRI1000729",
  "capacity_mw": 395,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Tahara Daiichi Solar Power Plant",
  "gppd_idnr": "WRI1026565",
  "capacity_mw": 40.2,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Tahara Daini Solar Power Plant",
  "gppd_idnr": "WRI1026566",
  "capacity_mw": 40.7,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Tahara Wind Solar Power Plant",
  "gppd_idnr": "WRI1026567",
  "capacity_mw": 50,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Takahama",
  "gppd_idnr": "WRI1000683",
  "capacity_mw": 3392,
  "fuel1": "Nuclear",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Takakuma Solar Power Plant",
  "gppd_idnr": "WRI1026568",
  "capacity_mw": 4.3,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Takami",
  "gppd_idnr": "WRI1000692",
  "capacity_mw": 200,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Takasago",
  "gppd_idnr": "WRI1020041",
  "capacity_mw": 500,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Takasago - Softbank Solar Power Plant",
  "gppd_idnr": "WRI1026569",
  "capacity_mw": 3.4,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Takatoge Solar Power Plant",
  "gppd_idnr": "WRI1026570",
  "capacity_mw": 9.4,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Takehara",
  "gppd_idnr": "WRI1000671",
  "capacity_mw": 1300,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Taketoyo",
  "gppd_idnr": "WRI1000644",
  "capacity_mw": 1125,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Taketoyo Solar Power Plant",
  "gppd_idnr": "WRI1026571",
  "capacity_mw": 7.5,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Takidai Solar Power Plant",
  "gppd_idnr": "WRI1026572",
  "capacity_mw": 4.5,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Takigami",
  "gppd_idnr": "WRI1020126",
  "capacity_mw": 25,
  "fuel1": "Geothermal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 1996,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Takisato",
  "gppd_idnr": "WRI1020228",
  "capacity_mw": 57,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 1999,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Tamahara",
  "gppd_idnr": "WRI1000695",
  "capacity_mw": 1200,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_long": "Japan",
  "name": "Tamashima",
  "gppd_idnr": "WRI1000659",
  "capacity_mw": 1200,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null
}];
},{}],"js/app.js":[function(require,module,exports) {
"use strict";

var _hyperapp = require("hyperapp");

var Plants = require("./data/plant.json");
/** @jsx h */


var state = {
  plants: Plants,
  count: 0
};
var actions = {
  down: function down() {
    return function (state) {
      return {
        count: state.count - 1
      };
    };
  },
  up: function up() {
    return function (state) {
      return {
        count: state.count + 1
      };
    };
  }
};

var card = function card(item) {
  return (0, _hyperapp.h)("div", {
    class: "col3"
  }, (0, _hyperapp.h)("div", {
    class: "card"
  }, (0, _hyperapp.h)("div", {
    class: "card-header"
  }, (0, _hyperapp.h)("h1", {
    class: "card-title"
  }, item.name), (0, _hyperapp.h)("h3", {
    class: "card-meta"
  }, "Software and hardware")), (0, _hyperapp.h)("div", {
    class: "card-body"
  }, (0, _hyperapp.h)("p", null, "Empower every person to achieve more.")), (0, _hyperapp.h)("div", {
    class: "card-footer"
  }, (0, _hyperapp.h)("a", {
    href: "#",
    class: "btn btn-primary"
  }, "View More"))));
};

var view = function view(state, actions) {
  return (0, _hyperapp.h)("div", {
    class: "row grid1"
  }, state.plants.map(function (plant, i) {
    return card(plant);
  }));
};

console.log(Plants);
(0, _hyperapp.app)(state, actions, view, document.querySelector("#ace-app"));
},{"hyperapp":"../node_modules/hyperapp/src/index.js","./data/plant.json":"js/data/plant.json"}],"../../../../../../../usr/local/lib/node_modules/parcel/src/builtins/hmr-runtime.js":[function(require,module,exports) {
var global = arguments[3];
var OVERLAY_ID = '__parcel__error__overlay__';
var OldModule = module.bundle.Module;

function Module(moduleName) {
  OldModule.call(this, moduleName);
  this.hot = {
    data: module.bundle.hotData,
    _acceptCallbacks: [],
    _disposeCallbacks: [],
    accept: function (fn) {
      this._acceptCallbacks.push(fn || function () {});
    },
    dispose: function (fn) {
      this._disposeCallbacks.push(fn);
    }
  };
  module.bundle.hotData = null;
}

module.bundle.Module = Module;
var parent = module.bundle.parent;

if ((!parent || !parent.isParcelRequire) && typeof WebSocket !== 'undefined') {
  var hostname = "" || location.hostname;
  var protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  var ws = new WebSocket(protocol + '://' + hostname + ':' + "56673" + '/');

  ws.onmessage = function (event) {
    var data = JSON.parse(event.data);

    if (data.type === 'update') {
      console.clear();
      data.assets.forEach(function (asset) {
        hmrApply(global.parcelRequire, asset);
      });
      data.assets.forEach(function (asset) {
        if (!asset.isNew) {
          hmrAccept(global.parcelRequire, asset.id);
        }
      });
    }

    if (data.type === 'reload') {
      ws.close();

      ws.onclose = function () {
        location.reload();
      };
    }

    if (data.type === 'error-resolved') {
      console.log('[parcel] ✨ Error resolved');
      removeErrorOverlay();
    }

    if (data.type === 'error') {
      console.error('[parcel] 🚨  ' + data.error.message + '\n' + data.error.stack);
      removeErrorOverlay();
      var overlay = createErrorOverlay(data);
      document.body.appendChild(overlay);
    }
  };
}

function removeErrorOverlay() {
  var overlay = document.getElementById(OVERLAY_ID);

  if (overlay) {
    overlay.remove();
  }
}

function createErrorOverlay(data) {
  var overlay = document.createElement('div');
  overlay.id = OVERLAY_ID; // html encode message and stack trace

  var message = document.createElement('div');
  var stackTrace = document.createElement('pre');
  message.innerText = data.error.message;
  stackTrace.innerText = data.error.stack;
  overlay.innerHTML = '<div style="background: black; font-size: 16px; color: white; position: fixed; height: 100%; width: 100%; top: 0px; left: 0px; padding: 30px; opacity: 0.85; font-family: Menlo, Consolas, monospace; z-index: 9999;">' + '<span style="background: red; padding: 2px 4px; border-radius: 2px;">ERROR</span>' + '<span style="top: 2px; margin-left: 5px; position: relative;">🚨</span>' + '<div style="font-size: 18px; font-weight: bold; margin-top: 20px;">' + message.innerHTML + '</div>' + '<pre>' + stackTrace.innerHTML + '</pre>' + '</div>';
  return overlay;
}

function getParents(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return [];
  }

  var parents = [];
  var k, d, dep;

  for (k in modules) {
    for (d in modules[k][1]) {
      dep = modules[k][1][d];

      if (dep === id || Array.isArray(dep) && dep[dep.length - 1] === id) {
        parents.push(k);
      }
    }
  }

  if (bundle.parent) {
    parents = parents.concat(getParents(bundle.parent, id));
  }

  return parents;
}

function hmrApply(bundle, asset) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (modules[asset.id] || !bundle.parent) {
    var fn = new Function('require', 'module', 'exports', asset.generated.js);
    asset.isNew = !modules[asset.id];
    modules[asset.id] = [fn, asset.deps];
  } else if (bundle.parent) {
    hmrApply(bundle.parent, asset);
  }
}

function hmrAccept(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (!modules[id] && bundle.parent) {
    return hmrAccept(bundle.parent, id);
  }

  var cached = bundle.cache[id];
  bundle.hotData = {};

  if (cached) {
    cached.hot.data = bundle.hotData;
  }

  if (cached && cached.hot && cached.hot._disposeCallbacks.length) {
    cached.hot._disposeCallbacks.forEach(function (cb) {
      cb(bundle.hotData);
    });
  }

  delete bundle.cache[id];
  bundle(id);
  cached = bundle.cache[id];

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    cached.hot._acceptCallbacks.forEach(function (cb) {
      cb();
    });

    return true;
  }

  return getParents(global.parcelRequire, id).some(function (id) {
    return hmrAccept(global.parcelRequire, id);
  });
}
},{}]},{},["../../../../../../../usr/local/lib/node_modules/parcel/src/builtins/hmr-runtime.js","js/app.js"], null)
//# sourceMappingURL=/app.c3f9f951.map