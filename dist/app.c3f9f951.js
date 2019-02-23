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
  "country_code": "GUF",
  "country_long": "French Guiana",
  "name": "D�grad des Cannes",
  "gppd_idnr": "WRI1023509",
  "capacity_mw": 40,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": null,
  "income_group": null,
  "country_code": "GUF",
  "country_long": "French Guiana",
  "name": "D�grad des Cannes",
  "gppd_idnr": "WRI1023510",
  "capacity_mw": 72,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": null,
  "income_group": null,
  "country_code": "KOS",
  "country_long": "Kosovo",
  "name": "Kosovo B Coal Power Plant Kosovo",
  "gppd_idnr": "GEODB0042699",
  "capacity_mw": 678,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2017,
  "avg_gen": null,
  "size": null
}, {
  "Region": null,
  "income_group": null,
  "country_code": "TWN",
  "country_long": "Taiwan",
  "name": "Chiahui",
  "gppd_idnr": "WRI1000372",
  "capacity_mw": 670,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 2004,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": null,
  "income_group": null,
  "country_code": "TWN",
  "country_long": "Taiwan",
  "name": "Dah-Tarn",
  "gppd_idnr": "WRI1000370",
  "capacity_mw": 4380,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": null,
  "income_group": null,
  "country_code": "TWN",
  "country_long": "Taiwan",
  "name": "Datan",
  "gppd_idnr": "WRI1000391",
  "capacity_mw": 14,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 2005,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": null,
  "income_group": null,
  "country_code": "TWN",
  "country_long": "Taiwan",
  "name": "Datan wind",
  "gppd_idnr": "WRI1000447",
  "capacity_mw": 15.1,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": null,
  "income_group": null,
  "country_code": "TWN",
  "country_long": "Taiwan",
  "name": "Kuosheng",
  "gppd_idnr": "WRI1000379",
  "capacity_mw": 2040,
  "fuel1": "Nuclear",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": null,
  "income_group": null,
  "country_code": "TWN",
  "country_long": "Taiwan",
  "name": "Shimen Wind",
  "gppd_idnr": "WRI1000445",
  "capacity_mw": 3.96,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 2004,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": null,
  "income_group": null,
  "country_code": "TWN",
  "country_long": "Taiwan",
  "name": "Tachiachi",
  "gppd_idnr": "WRI1000389",
  "capacity_mw": 180,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": null,
  "income_group": null,
  "country_code": "TWN",
  "country_long": "Taiwan",
  "name": "Taizhong Taichung",
  "gppd_idnr": "WRI1000364",
  "capacity_mw": 5500,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": null,
  "income_group": null,
  "country_code": "TWN",
  "country_long": "Taiwan",
  "name": "Tunghsiao",
  "gppd_idnr": "WRI1000374",
  "capacity_mw": 1785,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 1983,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": null,
  "income_group": null,
  "country_code": "ESH",
  "country_long": "Western Sahara",
  "name": "Dakhla IC Power Plant Western Sahara",
  "gppd_idnr": "GEODB0042583",
  "capacity_mw": 23.4,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2017,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: nonOECD",
  "country_code": "BRN",
  "country_long": "Brunei Darussalam",
  "name": "Bukit Panggal CCGT Power Station Brunei",
  "gppd_idnr": "GEODB0045547",
  "capacity_mw": 110,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2017,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: nonOECD",
  "country_code": "BRN",
  "country_long": "Brunei Darussalam",
  "name": "Gadong 2 Power Plant Brunei Darussalam",
  "gppd_idnr": "GEODB0045543",
  "capacity_mw": 128,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2017,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: nonOECD",
  "country_code": "SGP",
  "country_long": "Singapore",
  "name": "Jurong Island - PLP CCGT Power Plant Singapore",
  "gppd_idnr": "GEODB0045352",
  "capacity_mw": 800,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2017,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: nonOECD",
  "country_code": "SGP",
  "country_long": "Singapore",
  "name": "PowerSeraya Pulau Seraya Oil Power Station Singapore",
  "gppd_idnr": "GEODB0004961",
  "capacity_mw": 2250,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2017,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: nonOECD",
  "country_code": "SGP",
  "country_long": "Singapore",
  "name": "Tuas Oil Power Station Singapore",
  "gppd_idnr": "GEODB0005796",
  "capacity_mw": 1200,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2017,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Anglesea",
  "gppd_idnr": "AUS0000114",
  "capacity_mw": 150,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Argyle Diamond Mine",
  "gppd_idnr": "AUS0000220",
  "capacity_mw": 32,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Ballarat Base Hospital",
  "gppd_idnr": "AUS0000113",
  "capacity_mw": 2,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Bango Wind Farm",
  "gppd_idnr": "AUS0000398",
  "capacity_mw": 200,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Banimboola",
  "gppd_idnr": "AUS0000014",
  "capacity_mw": 12.5,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Barcaldine (Len Wishaw)",
  "gppd_idnr": "AUS0000008",
  "capacity_mw": 55,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Barron Gorge",
  "gppd_idnr": "AUS0000151",
  "capacity_mw": 66,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Bastyan",
  "gppd_idnr": "AUS0000137",
  "capacity_mw": 79.9,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Belconnen",
  "gppd_idnr": "AUS0000400",
  "capacity_mw": 1,
  "fuel1": "Waste",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Bell Bay (Bell Bay Three)",
  "gppd_idnr": "AUS0000139",
  "capacity_mw": 120,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Berrimah",
  "gppd_idnr": "AUS0000251",
  "capacity_mw": 10,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Bidyadanga",
  "gppd_idnr": "AUS0000382",
  "capacity_mw": 1.3,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Boco Rock",
  "gppd_idnr": "AUS0000394",
  "capacity_mw": 270,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Bodangora Wind Farm",
  "gppd_idnr": "AUS0000422",
  "capacity_mw": 100,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Box Hill",
  "gppd_idnr": "AUS0000342",
  "capacity_mw": 25,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Braemar 1",
  "gppd_idnr": "AUS0000152",
  "capacity_mw": 504,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Brewer",
  "gppd_idnr": "AUS0000256",
  "capacity_mw": 8.5,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Broadmeadows",
  "gppd_idnr": "AUS0000082",
  "capacity_mw": 6.2,
  "fuel1": "Waste",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Broadwater",
  "gppd_idnr": "AUS0000268",
  "capacity_mw": 30,
  "fuel1": "Biomass",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Broken Hill Solar Plant",
  "gppd_idnr": "AUS0000477",
  "capacity_mw": 53,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2016,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Brooklyn",
  "gppd_idnr": "AUS0000079",
  "capacity_mw": 2.8,
  "fuel1": "Waste",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Browns Plains",
  "gppd_idnr": "AUS0000078",
  "capacity_mw": 2.2,
  "fuel1": "Waste",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Bulwer Island",
  "gppd_idnr": "AUS0000461",
  "capacity_mw": 33,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Burrendong",
  "gppd_idnr": "AUS0000300",
  "capacity_mw": 18,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Burrinjuck Power Station",
  "gppd_idnr": "AUS0000048",
  "capacity_mw": 27.2,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Burrup Peninsula (Pluto Phase 1)",
  "gppd_idnr": "AUS0000182",
  "capacity_mw": 160,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Callide A",
  "gppd_idnr": "AUS0000178",
  "capacity_mw": 120,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Camballin",
  "gppd_idnr": "AUS0000414",
  "capacity_mw": 1.04,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Cape Nelson North Wind Farm",
  "gppd_idnr": "AUS0000112",
  "capacity_mw": 22,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Carnarvon",
  "gppd_idnr": "AUS0000386",
  "capacity_mw": 15,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Cathedral Rocks Wind Farm",
  "gppd_idnr": "AUS0000063",
  "capacity_mw": 66,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Cethana",
  "gppd_idnr": "AUS0000144",
  "capacity_mw": 100,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Challicum Hills Wind Farm",
  "gppd_idnr": "AUS0000006",
  "capacity_mw": 52.5,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Charlestown Square",
  "gppd_idnr": "AUS0000401",
  "capacity_mw": 2.8,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Christmas Creek Iron Ore Mine",
  "gppd_idnr": "AUS0000221",
  "capacity_mw": 28,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Clayton",
  "gppd_idnr": "AUS0000083",
  "capacity_mw": 11,
  "fuel1": "Waste",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Clements Gap Wind Farm",
  "gppd_idnr": "AUS0000025",
  "capacity_mw": 56.7,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Clover",
  "gppd_idnr": "AUS0000103",
  "capacity_mw": 29,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Collinsville",
  "gppd_idnr": "AUS0000179",
  "capacity_mw": 190,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Condamine A",
  "gppd_idnr": "AUS0000154",
  "capacity_mw": 144,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Copeton",
  "gppd_idnr": "AUS0000301",
  "capacity_mw": 20,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Crookwell Wind Farm",
  "gppd_idnr": "AUS0000046",
  "capacity_mw": 4.8,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "CSIRO Energy Centre",
  "gppd_idnr": "AUS0000438",
  "capacity_mw": 1.5,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Darling Downs",
  "gppd_idnr": "AUS0000156",
  "capacity_mw": 644,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Eastern Creek 2",
  "gppd_idnr": "AUS0000044",
  "capacity_mw": 7.7,
  "fuel1": "Waste",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Emu Downs Wind Farm",
  "gppd_idnr": "AUS0000043",
  "capacity_mw": 79.2,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Eraring",
  "gppd_idnr": "AUS0000306",
  "capacity_mw": 2820,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Fisher",
  "gppd_idnr": "AUS0000135",
  "capacity_mw": 46,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Fitzroy Crossing",
  "gppd_idnr": "AUS0000367",
  "capacity_mw": 4.06,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Gladstone",
  "gppd_idnr": "AUS0000158",
  "capacity_mw": 1680,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Glenbawn",
  "gppd_idnr": "AUS0000275",
  "capacity_mw": 5,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Glennies Creek",
  "gppd_idnr": "AUS0000276",
  "capacity_mw": 10,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Glenorchy",
  "gppd_idnr": "AUS0000418",
  "capacity_mw": 1.6,
  "fuel1": "Waste",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Gosnells",
  "gppd_idnr": "AUS0000331",
  "capacity_mw": 1.1,
  "fuel1": "Waste",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Grange Avenue",
  "gppd_idnr": "AUS0000041",
  "capacity_mw": 1.3,
  "fuel1": "Waste",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Greenough River Solar Farm",
  "gppd_idnr": "AUS0000474",
  "capacity_mw": 10,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2014,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Gunning",
  "gppd_idnr": "AUS0000040",
  "capacity_mw": 46.5,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Hallam Road",
  "gppd_idnr": "AUS0000077",
  "capacity_mw": 6.7,
  "fuel1": "Waste",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Hume",
  "gppd_idnr": "AUS0000076",
  "capacity_mw": 58,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Hunter",
  "gppd_idnr": "AUS0000277",
  "capacity_mw": 29,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Inkerman Sugar Mill",
  "gppd_idnr": "AUS0000145",
  "capacity_mw": 10.5,
  "fuel1": "Biomass",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Invicta Sugar Mill",
  "gppd_idnr": "AUS0000056",
  "capacity_mw": 50,
  "fuel1": "Biomass",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Jeeralang B",
  "gppd_idnr": "AUS0000089",
  "capacity_mw": 228,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Jounama",
  "gppd_idnr": "AUS0000038",
  "capacity_mw": 14.4,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Kalamia Sugar Mill",
  "gppd_idnr": "AUS0000160",
  "capacity_mw": 9,
  "fuel1": "Biomass",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Kalbarri Wind Farm",
  "gppd_idnr": "AUS0000405",
  "capacity_mw": 1.7,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Karratha",
  "gppd_idnr": "AUS0000189",
  "capacity_mw": 86,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "KRC Cogeneration Plant",
  "gppd_idnr": "AUS0000332",
  "capacity_mw": 4.2,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Lake Bonney Wind Farm",
  "gppd_idnr": "AUS0000062",
  "capacity_mw": 159,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Lake Keepit",
  "gppd_idnr": "AUS0000304",
  "capacity_mw": 6.5,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Lake William Hovell",
  "gppd_idnr": "AUS0000099",
  "capacity_mw": 1.8,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Laverton",
  "gppd_idnr": "AUS0000371",
  "capacity_mw": 1.5,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Laverton (Granny Smith Gold Mine)",
  "gppd_idnr": "AUS0000219",
  "capacity_mw": 30.6,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Laverton North",
  "gppd_idnr": "AUS0000090",
  "capacity_mw": 312,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Leinster Nickel Mine",
  "gppd_idnr": "AUS0000212",
  "capacity_mw": 59,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Lemonthyme",
  "gppd_idnr": "AUS0000132",
  "capacity_mw": 54,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Longford",
  "gppd_idnr": "AUS0000091",
  "capacity_mw": 31.8,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Loy Yang A",
  "gppd_idnr": "AUS0000092",
  "capacity_mw": 2180,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Mackay",
  "gppd_idnr": "AUS0000146",
  "capacity_mw": 34,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Macknade Sugar Mill",
  "gppd_idnr": "AUS0000174",
  "capacity_mw": 8,
  "fuel1": "Biomass",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Marble Bar Diesel Backup",
  "gppd_idnr": "AUS0000365",
  "capacity_mw": 1.28,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "McKay Creek (Mount Beauty Hydro Scheme)",
  "gppd_idnr": "AUS0000104",
  "capacity_mw": 150,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Merredin",
  "gppd_idnr": "AUS0000450",
  "capacity_mw": 82,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Moranbah",
  "gppd_idnr": "AUS0000164",
  "capacity_mw": 12,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Mount Magnet",
  "gppd_idnr": "AUS0000207",
  "capacity_mw": 1.9,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Mugga Lane",
  "gppd_idnr": "AUS0000034",
  "capacity_mw": 3.5,
  "fuel1": "Waste",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Muja B",
  "gppd_idnr": "AUS0000392",
  "capacity_mw": 120,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Mungarra",
  "gppd_idnr": "AUS0000216",
  "capacity_mw": 112,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Newport",
  "gppd_idnr": "AUS0000094",
  "capacity_mw": 500,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "North Sydney",
  "gppd_idnr": "AUS0000314",
  "capacity_mw": 2.4,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Nymboida",
  "gppd_idnr": "AUS0000283",
  "capacity_mw": 33.6,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Onslow",
  "gppd_idnr": "AUS0000411",
  "capacity_mw": 3.6,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Owen Springs",
  "gppd_idnr": "AUS0000255",
  "capacity_mw": 36.7,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Paloona",
  "gppd_idnr": "AUS0000130",
  "capacity_mw": 30,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Pedler Creek",
  "gppd_idnr": "AUS0000236",
  "capacity_mw": 3.1,
  "fuel1": "Waste",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Port Hedland",
  "gppd_idnr": "AUS0000325",
  "capacity_mw": 84,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Port Lincoln",
  "gppd_idnr": "AUS0000238",
  "capacity_mw": 73.5,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Repulse",
  "gppd_idnr": "AUS0000120",
  "capacity_mw": 28,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Rochedale",
  "gppd_idnr": "AUS0000073",
  "capacity_mw": 4.2,
  "fuel1": "Waste",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Rockingham",
  "gppd_idnr": "AUS0000358",
  "capacity_mw": 2.1,
  "fuel1": "Waste",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Rocky Point Sugar Sugar Mill",
  "gppd_idnr": "AUS0000060",
  "capacity_mw": 30,
  "fuel1": "Biomass",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Rowallan",
  "gppd_idnr": "AUS0000129",
  "capacity_mw": 10.5,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Smithfield Energy",
  "gppd_idnr": "AUS0000286",
  "capacity_mw": 170.9,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Snuggery",
  "gppd_idnr": "AUS0000245",
  "capacity_mw": 63,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "South Cardup (Shale Road Landfill)",
  "gppd_idnr": "AUS0000359",
  "capacity_mw": 3.3,
  "fuel1": "Waste",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "South Johnstone",
  "gppd_idnr": "AUS0000374",
  "capacity_mw": 20,
  "fuel1": "Biomass",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Stapylton Green Energy",
  "gppd_idnr": "AUS0000347",
  "capacity_mw": 4.8,
  "fuel1": "Biomass",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Starfish Hill Wind Farm",
  "gppd_idnr": "AUS0000052",
  "capacity_mw": 34.5,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Tahmoor",
  "gppd_idnr": "AUS0000287",
  "capacity_mw": 7,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Tea Tree Gully",
  "gppd_idnr": "AUS0000344",
  "capacity_mw": 1,
  "fuel1": "Waste",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Ti Tree Bioenergy",
  "gppd_idnr": "AUS0000070",
  "capacity_mw": 3.3,
  "fuel1": "Waste",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Tumut 1 (Upper Tumut)",
  "gppd_idnr": "AUS0000292",
  "capacity_mw": 384,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Tungatinah",
  "gppd_idnr": "AUS0000117",
  "capacity_mw": 125,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Uranquinty",
  "gppd_idnr": "AUS0000294",
  "capacity_mw": 664,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Wagerup",
  "gppd_idnr": "AUS0000204",
  "capacity_mw": 380,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Wagerup Bauxite Mine and Alumina Refinery",
  "gppd_idnr": "AUS0000203",
  "capacity_mw": 98,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Walkaway Wind Farm",
  "gppd_idnr": "AUS0000002",
  "capacity_mw": 89.1,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Wallerawang C",
  "gppd_idnr": "AUS0000296",
  "capacity_mw": 1000,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Warmun",
  "gppd_idnr": "AUS0000369",
  "capacity_mw": 1.3,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Waterloo Wind Farm",
  "gppd_idnr": "AUS0000050",
  "capacity_mw": 111,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Wayatinah",
  "gppd_idnr": "AUS0000116",
  "capacity_mw": 38.3,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "West Illawarra Leagues Club",
  "gppd_idnr": "AUS0000298",
  "capacity_mw": 1,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Western Suburbs Leagues Club (Campbelltown)",
  "gppd_idnr": "AUS0000299",
  "capacity_mw": 1.3,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Wilga Park",
  "gppd_idnr": "AUS0000302",
  "capacity_mw": 16,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Wilpena Solar Farm",
  "gppd_idnr": "AUS0000447",
  "capacity_mw": 145,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2014,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Wiluna Gold Mine",
  "gppd_idnr": "AUS0000227",
  "capacity_mw": 21,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Wingfield II",
  "gppd_idnr": "AUS0000243",
  "capacity_mw": 4.1,
  "fuel1": "Waste",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Wivenhoe Hydroelectric",
  "gppd_idnr": "AUS0000150",
  "capacity_mw": 500,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Wodgina",
  "gppd_idnr": "AUS0000406",
  "capacity_mw": 13.7,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Wollert",
  "gppd_idnr": "AUS0000067",
  "capacity_mw": 4.4,
  "fuel1": "Waste",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Woodman Point",
  "gppd_idnr": "AUS0000354",
  "capacity_mw": 1.8,
  "fuel1": "Waste",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Worsley",
  "gppd_idnr": "AUS0000389",
  "capacity_mw": 120,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Worsley Cogeneration",
  "gppd_idnr": "AUS0000217",
  "capacity_mw": 106,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "AUS",
  "country_long": "Australia",
  "name": "Yulara",
  "gppd_idnr": "AUS0000257",
  "capacity_mw": 4.5,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": 2012,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Aioi",
  "gppd_idnr": "WRI1000657",
  "capacity_mw": 1125,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Akita",
  "gppd_idnr": "WRI1000619",
  "capacity_mw": 1300,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Aoi Solar Power Plant",
  "gppd_idnr": "WRI1026465",
  "capacity_mw": 2,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Atsumi",
  "gppd_idnr": "WRI1000640",
  "capacity_mw": 1900,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Awaji Kifune Solar Power Plant",
  "gppd_idnr": "WRI1026467",
  "capacity_mw": 34.7,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Buzen",
  "gppd_idnr": "WRI1000667",
  "capacity_mw": 1000,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Fukuyama Recyling Power",
  "gppd_idnr": "WRI1020063",
  "capacity_mw": 21,
  "fuel1": "Waste",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 2004,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Futtsu Solar Power Plant",
  "gppd_idnr": "WRI1026471",
  "capacity_mw": 42,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Gobo",
  "gppd_idnr": "WRI1000650",
  "capacity_mw": 1800,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Hachijojima",
  "gppd_idnr": "WRI1020115",
  "capacity_mw": 3.3,
  "fuel1": "Geothermal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 1999,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Hachinohe - Tohoku Electric Solar Power Plant",
  "gppd_idnr": "WRI1026473",
  "capacity_mw": 1.5,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Hatanagi No.2",
  "gppd_idnr": "WRI1020020",
  "capacity_mw": 87,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Hekinan",
  "gppd_idnr": "WRI1000637",
  "capacity_mw": 4100,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Higashi Niigata",
  "gppd_idnr": "WRI1000617",
  "capacity_mw": 4810,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Higashiyama Solar Power Plant",
  "gppd_idnr": "WRI1026475",
  "capacity_mw": 1.8,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Himeji Daini",
  "gppd_idnr": "WRI1000653",
  "capacity_mw": 1650,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Hitachinaka",
  "gppd_idnr": "WRI1000635",
  "capacity_mw": 1000,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Hitotsuse",
  "gppd_idnr": "WRI1000722",
  "capacity_mw": 180,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Hoheiko",
  "gppd_idnr": "WRI1020234",
  "capacity_mw": 50,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 1972,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Ikawa",
  "gppd_idnr": "WRI1020024",
  "capacity_mw": 62,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Ikawa - Juwi Solar Power Plant",
  "gppd_idnr": "WRI1026479",
  "capacity_mw": 1.5,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Ikehara",
  "gppd_idnr": "WRI1000731",
  "capacity_mw": 350,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Imizu - Orix Solar Power Plant",
  "gppd_idnr": "WRI1026481",
  "capacity_mw": 2.5,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Itano Solar Power Plant",
  "gppd_idnr": "WRI1026483",
  "capacity_mw": 2.8,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Izumi Solar Power Plant",
  "gppd_idnr": "WRI1026486",
  "capacity_mw": 2.6,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Kamogawa Solar Power Plant",
  "gppd_idnr": "WRI1026493",
  "capacity_mw": 31.2,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Kashima Kita",
  "gppd_idnr": "WRI1020073",
  "capacity_mw": 650,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 1981,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Kikugawa Horinouchiya Solar Power Plant",
  "gppd_idnr": "WRI1026494",
  "capacity_mw": 7.5,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Kitakyushu - FirstSolar Solar Power Plant",
  "gppd_idnr": "WRI1026498",
  "capacity_mw": 1.3,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Kitsuki Solar Power Plant",
  "gppd_idnr": "WRI1026500",
  "capacity_mw": 24.4,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Komatsushima - Nippon Paper 2 Solar Power Plant",
  "gppd_idnr": "WRI1026504",
  "capacity_mw": 21,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Komatsushima - Softbank Solar Power Plant",
  "gppd_idnr": "WRI1026506",
  "capacity_mw": 2.8,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Koriyama - Kyocera Solar Power Plant",
  "gppd_idnr": "WRI1026508",
  "capacity_mw": 1.5,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Koyagi Solar Power Plant",
  "gppd_idnr": "WRI1026510",
  "capacity_mw": 2.6,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Kumamoto Arao Solar Power Plant",
  "gppd_idnr": "WRI1026511",
  "capacity_mw": 22.4,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Kurisu Solar Power Plant",
  "gppd_idnr": "WRI1026512",
  "capacity_mw": 3.5,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Maizuru",
  "gppd_idnr": "WRI1000652",
  "capacity_mw": 1800,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Makurazaki Airport Solar Power Plant",
  "gppd_idnr": "WRI1026519",
  "capacity_mw": 8.3,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Matsukawa Solar Power Plant",
  "gppd_idnr": "WRI1026520",
  "capacity_mw": 1.1,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Matsuura",
  "gppd_idnr": "WRI1000670",
  "capacity_mw": 2000,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Matsuura",
  "gppd_idnr": "WRI1020037",
  "capacity_mw": 700,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Mazegawa No.2",
  "gppd_idnr": "WRI1020023",
  "capacity_mw": 66,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Minabe Solar Power Plant",
  "gppd_idnr": "WRI1026523",
  "capacity_mw": 1.1,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Misumi",
  "gppd_idnr": "WRI1000660",
  "capacity_mw": 1000,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Miyama Solar Power Plant",
  "gppd_idnr": "WRI1026528",
  "capacity_mw": 22.3,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Mori",
  "gppd_idnr": "WRI1020120",
  "capacity_mw": 50,
  "fuel1": "Geothermal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 1982,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Muroran Hatchodaira Solar Power Plant",
  "gppd_idnr": "WRI1026529",
  "capacity_mw": 1.2,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Mutsu-Ogawara",
  "gppd_idnr": "WRI1020194",
  "capacity_mw": 32,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 2003,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Nagano",
  "gppd_idnr": "WRI1000733",
  "capacity_mw": 220,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Nago Futami Solar Power Plant",
  "gppd_idnr": "WRI1026530",
  "capacity_mw": 8.4,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Nakoso",
  "gppd_idnr": "WRI1020046",
  "capacity_mw": 1700,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Nanyo Complex",
  "gppd_idnr": "WRI1020080",
  "capacity_mw": 829,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 2008,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Niikappu",
  "gppd_idnr": "WRI1000691",
  "capacity_mw": 200,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Ofunato Solar Power Plant",
  "gppd_idnr": "WRI1026534",
  "capacity_mw": 19.8,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 2015,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Ohira",
  "gppd_idnr": "WRI1000721",
  "capacity_mw": 500,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Oita - Marubeni Solar Power Plant",
  "gppd_idnr": "WRI1026538",
  "capacity_mw": 82,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Okuniikappu",
  "gppd_idnr": "WRI1020233",
  "capacity_mw": 44,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 1963,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Okuyoshino",
  "gppd_idnr": "WRI1000712",
  "capacity_mw": 1206,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Omarugawa",
  "gppd_idnr": "WRI1000719",
  "capacity_mw": 900,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Omuta Miikekou Solar Power Plant",
  "gppd_idnr": "WRI1026540",
  "capacity_mw": 20,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Onahama 2 Solar Power Plant",
  "gppd_idnr": "WRI1026542",
  "capacity_mw": 6,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Osaki CoolGen project",
  "gppd_idnr": "WRI1061347",
  "capacity_mw": 166,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 2017,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Oshirakawa",
  "gppd_idnr": "WRI1020237",
  "capacity_mw": 59,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 1963,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Reihoku",
  "gppd_idnr": "WRI1000666",
  "capacity_mw": 1400,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Sakai Solar Power Plant",
  "gppd_idnr": "WRI1026551",
  "capacity_mw": 28,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Sakaide",
  "gppd_idnr": "WRI1000662",
  "capacity_mw": 1500,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Sakaiko",
  "gppd_idnr": "WRI1000649",
  "capacity_mw": 2000,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Sakuma",
  "gppd_idnr": "WRI1000730",
  "capacity_mw": 350,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Sanyo Onoda Solar Power Plant",
  "gppd_idnr": "WRI1026553",
  "capacity_mw": 21,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Sendai",
  "gppd_idnr": "WRI1000668",
  "capacity_mw": 1000,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Shimogo",
  "gppd_idnr": "WRI1000724",
  "capacity_mw": 1000,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Shin Nagoya",
  "gppd_idnr": "WRI1000639",
  "capacity_mw": 3058,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Shin Nariwagawa",
  "gppd_idnr": "WRI1000717",
  "capacity_mw": 303,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Shin Takasegawa",
  "gppd_idnr": "WRI1000694",
  "capacity_mw": 1280,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Shin Toyone",
  "gppd_idnr": "WRI1000723",
  "capacity_mw": 1125,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Shinagawa",
  "gppd_idnr": "WRI1000633",
  "capacity_mw": 1140,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Shinchi",
  "gppd_idnr": "WRI1020064",
  "capacity_mw": 2000,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Shinkai-machi Solar Power Plant",
  "gppd_idnr": "WRI1026558",
  "capacity_mw": 11.7,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Shinko Kobe",
  "gppd_idnr": "WRI1020065",
  "capacity_mw": 1400,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 2002,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Shinmaiko Solar Power Plant",
  "gppd_idnr": "WRI1026559",
  "capacity_mw": 12.8,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Shinto - Softbank Solar Power Plant",
  "gppd_idnr": "WRI1026560",
  "capacity_mw": 2.4,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Sodegaura",
  "gppd_idnr": "WRI1000624",
  "capacity_mw": 3600,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Sunagawa",
  "gppd_idnr": "WRI1020031",
  "capacity_mw": 250,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Tahara Daiichi Solar Power Plant",
  "gppd_idnr": "WRI1026565",
  "capacity_mw": 40.2,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Tahara Daini Solar Power Plant",
  "gppd_idnr": "WRI1026566",
  "capacity_mw": 40.7,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Takasago - Softbank Solar Power Plant",
  "gppd_idnr": "WRI1026569",
  "capacity_mw": 3.4,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Takehara",
  "gppd_idnr": "WRI1000671",
  "capacity_mw": 1300,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Taketoyo",
  "gppd_idnr": "WRI1000644",
  "capacity_mw": 1125,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Taketoyo Solar Power Plant",
  "gppd_idnr": "WRI1026571",
  "capacity_mw": 7.5,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Tamashima",
  "gppd_idnr": "WRI1000659",
  "capacity_mw": 1200,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Tenmyo Solar Power Plant",
  "gppd_idnr": "WRI1026573",
  "capacity_mw": 14,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Tenzan",
  "gppd_idnr": "WRI1000720",
  "capacity_mw": 600,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Tobata",
  "gppd_idnr": "WRI1020069",
  "capacity_mw": 891.75,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Tokachi",
  "gppd_idnr": "WRI1020232",
  "capacity_mw": 40,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 1985,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Tomakomai",
  "gppd_idnr": "WRI1020052",
  "capacity_mw": 74,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Tomakomai - Japan Petroleum Solar Power Plant",
  "gppd_idnr": "WRI1026575",
  "capacity_mw": 2.4,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Tomato-atsuma",
  "gppd_idnr": "WRI1000616",
  "capacity_mw": 1650,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Tomatoh Abira Solar Power Plant",
  "gppd_idnr": "WRI1026579",
  "capacity_mw": 111,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Tottori Yonago Solar Power Plant",
  "gppd_idnr": "WRI1026581",
  "capacity_mw": 42.9,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Tsuruga",
  "gppd_idnr": "WRI1000690",
  "capacity_mw": 1160,
  "fuel1": "Nuclear",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Ube - US Solar Power Plant",
  "gppd_idnr": "WRI1026588",
  "capacity_mw": 21.3,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Wakayama",
  "gppd_idnr": "WRI1020076",
  "capacity_mw": 147,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 2011,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Wakkanai Solar Power Plant",
  "gppd_idnr": "WRI1026592",
  "capacity_mw": 5,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Yabukinakajima Solar Power Plant",
  "gppd_idnr": "WRI1026594",
  "capacity_mw": 8,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "JPN",
  "country_long": "Japan",
  "name": "Yagisawa",
  "gppd_idnr": "WRI1000702",
  "capacity_mw": 240,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "NZL",
  "country_long": "New Zealand",
  "name": "Aviemore",
  "gppd_idnr": "WRI1000302",
  "capacity_mw": 220,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "NZL",
  "country_long": "New Zealand",
  "name": "Cobb",
  "gppd_idnr": "WRI1000343",
  "capacity_mw": 32,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 1914,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "NZL",
  "country_long": "New Zealand",
  "name": "Huntly (steam)",
  "gppd_idnr": "WRI1000306",
  "capacity_mw": 500,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "NZL",
  "country_long": "New Zealand",
  "name": "Huntly (unit 6)",
  "gppd_idnr": "WRI1000307",
  "capacity_mw": 60,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 2004,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "NZL",
  "country_long": "New Zealand",
  "name": "Kawerau",
  "gppd_idnr": "WRI1000327",
  "capacity_mw": 100,
  "fuel1": "Geothermal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 2008,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "NZL",
  "country_long": "New Zealand",
  "name": "Mahinerangi",
  "gppd_idnr": "WRI1000347",
  "capacity_mw": 36,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 2007,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "NZL",
  "country_long": "New Zealand",
  "name": "Manapouri",
  "gppd_idnr": "WRI1000304",
  "capacity_mw": 800,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "NZL",
  "country_long": "New Zealand",
  "name": "Maraetai",
  "gppd_idnr": "WRI1000318",
  "capacity_mw": 352,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "NZL",
  "country_long": "New Zealand",
  "name": "mokai",
  "gppd_idnr": "WRI1000320",
  "capacity_mw": 112,
  "fuel1": "Geothermal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 2000,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "NZL",
  "country_long": "New Zealand",
  "name": "Ohaaki",
  "gppd_idnr": "WRI1000332",
  "capacity_mw": 122,
  "fuel1": "Geothermal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 1984,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "NZL",
  "country_long": "New Zealand",
  "name": "Ohakuri",
  "gppd_idnr": "WRI1000322",
  "capacity_mw": 106,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 1961,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "NZL",
  "country_long": "New Zealand",
  "name": "Paerau and Patearoa",
  "gppd_idnr": "WRI1000346",
  "capacity_mw": 12,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 2011,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "NZL",
  "country_long": "New Zealand",
  "name": "Te Rapa",
  "gppd_idnr": "WRI1000336",
  "capacity_mw": 44,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "NZL",
  "country_long": "New Zealand",
  "name": "Tuai",
  "gppd_idnr": "WRI1000312",
  "capacity_mw": 60,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 1929,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "NZL",
  "country_long": "New Zealand",
  "name": "Waipapa",
  "gppd_idnr": "WRI1000317",
  "capacity_mw": 54,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 1961,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "NZL",
  "country_long": "New Zealand",
  "name": "Waipori",
  "gppd_idnr": "WRI1000348",
  "capacity_mw": 83,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "KOR",
  "country_long": "South Korea",
  "name": "Ansan Project",
  "gppd_idnr": "WRI1029881",
  "capacity_mw": 834,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 2014,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "KOR",
  "country_long": "South Korea",
  "name": "Anyang CHP",
  "gppd_idnr": "WRI1029882",
  "capacity_mw": 493,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "KOR",
  "country_long": "South Korea",
  "name": "Asan Baebang CHP",
  "gppd_idnr": "WRI1029883",
  "capacity_mw": 113.9,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "KOR",
  "country_long": "South Korea",
  "name": "Boryeong (CC)",
  "gppd_idnr": "WRI1000192",
  "capacity_mw": 1800,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 2004,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "KOR",
  "country_long": "South Korea",
  "name": "Boryeong Hydro Unit",
  "gppd_idnr": "WRI1029862",
  "capacity_mw": 7.5,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "KOR",
  "country_long": "South Korea",
  "name": "Bukeju",
  "gppd_idnr": "WRI1029843",
  "capacity_mw": 150,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 2000,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "KOR",
  "country_long": "South Korea",
  "name": "Dangjin",
  "gppd_idnr": "WRI1000208",
  "capacity_mw": 4000,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "KOR",
  "country_long": "South Korea",
  "name": "Gangcheon",
  "gppd_idnr": "WRI1029879",
  "capacity_mw": 5,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "KOR",
  "country_long": "South Korea",
  "name": "Gimcheon 2",
  "gppd_idnr": "WRI1029913",
  "capacity_mw": 9.3,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "KOR",
  "country_long": "South Korea",
  "name": "Goesan",
  "gppd_idnr": "WRI1000226",
  "capacity_mw": 2.8,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 1957,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "KOR",
  "country_long": "South Korea",
  "name": "Gwangyang POSCO",
  "gppd_idnr": "WRI1029892",
  "capacity_mw": 500,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 2000,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "KOR",
  "country_long": "South Korea",
  "name": "Hanul",
  "gppd_idnr": "WRI1000218",
  "capacity_mw": 5900,
  "fuel1": "Nuclear",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "KOR",
  "country_long": "South Korea",
  "name": "Hwaseong",
  "gppd_idnr": "WRI1029909",
  "capacity_mw": 1,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "KOR",
  "country_long": "South Korea",
  "name": "Imha",
  "gppd_idnr": "WRI1029851",
  "capacity_mw": 50,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "KOR",
  "country_long": "South Korea",
  "name": "Incheon",
  "gppd_idnr": "WRI1000195",
  "capacity_mw": 3052,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 2015,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "KOR",
  "country_long": "South Korea",
  "name": "Ipo",
  "gppd_idnr": "WRI1029877",
  "capacity_mw": 3,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "KOR",
  "country_long": "South Korea",
  "name": "KDHC Daegu",
  "gppd_idnr": "WRI1029841",
  "capacity_mw": 3,
  "fuel1": "Biomass",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "KOR",
  "country_long": "South Korea",
  "name": "Nakdan",
  "gppd_idnr": "WRI1029873",
  "capacity_mw": 3,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "KOR",
  "country_long": "South Korea",
  "name": "Oseong",
  "gppd_idnr": "WRI1029897",
  "capacity_mw": 830,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 2013,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "KOR",
  "country_long": "South Korea",
  "name": "Pyeongtaek",
  "gppd_idnr": "WRI1000198",
  "capacity_mw": 1348,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "KOR",
  "country_long": "South Korea",
  "name": "Sancheong",
  "gppd_idnr": "WRI1029860",
  "capacity_mw": 700,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "KOR",
  "country_long": "South Korea",
  "name": "Sejong",
  "gppd_idnr": "WRI1029866",
  "capacity_mw": 2.3,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "KOR",
  "country_long": "South Korea",
  "name": "Sejong City",
  "gppd_idnr": "WRI1029902",
  "capacity_mw": 550,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 2013,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "KOR",
  "country_long": "South Korea",
  "name": "Seocheon",
  "gppd_idnr": "WRI1000194",
  "capacity_mw": 400,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 1983,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "KOR",
  "country_long": "South Korea",
  "name": "Soyang gang",
  "gppd_idnr": "WRI1029855",
  "capacity_mw": 200,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "KOR",
  "country_long": "South Korea",
  "name": "Wolsong",
  "gppd_idnr": "WRI1000215",
  "capacity_mw": 2799,
  "fuel1": "Nuclear",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "KOR",
  "country_long": "South Korea",
  "name": "Yeoju",
  "gppd_idnr": "WRI1029878",
  "capacity_mw": 5,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "KOR",
  "country_long": "South Korea",
  "name": "Yeongdong",
  "gppd_idnr": "WRI1000188",
  "capacity_mw": 325,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "KOR",
  "country_long": "South Korea",
  "name": "Yeongheung",
  "gppd_idnr": "WRI1000187",
  "capacity_mw": 5080,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "KOR",
  "country_long": "South Korea",
  "name": "Yeongheung",
  "gppd_idnr": "WRI1029935",
  "capacity_mw": 22,
  "fuel1": "Wind",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "KOR",
  "country_long": "South Korea",
  "name": "Yeongnam PV",
  "gppd_idnr": "WRI1029921",
  "capacity_mw": 13,
  "fuel1": "Solar",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "High income: OECD",
  "country_code": "KOR",
  "country_long": "South Korea",
  "name": "Yeongwol",
  "gppd_idnr": "WRI1022449",
  "capacity_mw": 848,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 2010,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "Low income",
  "country_code": "KHM",
  "country_long": "Cambodia",
  "name": "Khmer Electric Power Diesel Power Plant",
  "gppd_idnr": "WRI1026844",
  "capacity_mw": 30,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 2005,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "Low income",
  "country_code": "KHM",
  "country_long": "Cambodia",
  "name": "Kirirom I",
  "gppd_idnr": "WRI1026834",
  "capacity_mw": 12,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 2002,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "Low income",
  "country_code": "KHM",
  "country_long": "Cambodia",
  "name": "MH Bio-Ethanol Distillery",
  "gppd_idnr": "WRI1026843",
  "capacity_mw": 23.2,
  "fuel1": "Waste",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 2014,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "Low income",
  "country_code": "MMR",
  "country_long": "Myanmar",
  "name": "Ahlone",
  "gppd_idnr": "WRI1061349",
  "capacity_mw": 154.2,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": 990,
  "size": "18"
}, {
  "Region": "East Asia & Pacific",
  "income_group": "Low income",
  "country_code": "MMR",
  "country_long": "Myanmar",
  "name": "Khabaung",
  "gppd_idnr": "WRI1061354",
  "capacity_mw": 30,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 2008,
  "year_of_capacity_data": null,
  "avg_gen": 120,
  "size": "14"
}, {
  "Region": "East Asia & Pacific",
  "income_group": "Low income",
  "country_code": "MMR",
  "country_long": "Myanmar",
  "name": "Kyee ON Kyee Wa",
  "gppd_idnr": "WRI1061357",
  "capacity_mw": 74,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 2012,
  "year_of_capacity_data": null,
  "avg_gen": 370,
  "size": "16"
}, {
  "Region": "East Asia & Pacific",
  "income_group": "Low income",
  "country_code": "MMR",
  "country_long": "Myanmar",
  "name": "Mone",
  "gppd_idnr": "WRI1061361",
  "capacity_mw": 75,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 2004,
  "year_of_capacity_data": null,
  "avg_gen": 330,
  "size": "16"
}, {
  "Region": "East Asia & Pacific",
  "income_group": "Low income",
  "country_code": "MMR",
  "country_long": "Myanmar",
  "name": "Myanaung",
  "gppd_idnr": "WRI1061362",
  "capacity_mw": 34.7,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": 200,
  "size": "15"
}, {
  "Region": "East Asia & Pacific",
  "income_group": "Low income",
  "country_code": "MMR",
  "country_long": "Myanmar",
  "name": "Phyu Creek",
  "gppd_idnr": "WRI1061381",
  "capacity_mw": 65,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 2017,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "Low income",
  "country_code": "MMR",
  "country_long": "Myanmar",
  "name": "Shwegyin",
  "gppd_idnr": "WRI1061366",
  "capacity_mw": 75.2,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 2011,
  "year_of_capacity_data": null,
  "avg_gen": 262,
  "size": "15"
}, {
  "Region": "East Asia & Pacific",
  "income_group": "Low income",
  "country_code": "MMR",
  "country_long": "Myanmar",
  "name": "Thaton",
  "gppd_idnr": "WRI1061371",
  "capacity_mw": 50.95,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": 300,
  "size": "16"
}, {
  "Region": "East Asia & Pacific",
  "income_group": "Low income",
  "country_code": "MMR",
  "country_long": "Myanmar",
  "name": "Ywama",
  "gppd_idnr": "WRI1061375",
  "capacity_mw": 70.3,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": 238,
  "size": "15"
}, {
  "Region": "East Asia & Pacific",
  "income_group": "Low income",
  "country_code": "PRK",
  "country_long": "North Korea",
  "name": "Nampo",
  "gppd_idnr": "WRI1019828",
  "capacity_mw": 200,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "Low income",
  "country_code": "PRK",
  "country_long": "North Korea",
  "name": "Pochon",
  "gppd_idnr": "WRI1019865",
  "capacity_mw": 400,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "Low income",
  "country_code": "PRK",
  "country_long": "North Korea",
  "name": "River Changja",
  "gppd_idnr": "WRI1019850",
  "capacity_mw": 81,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "Low income",
  "country_code": "PRK",
  "country_long": "North Korea",
  "name": "Sunchon",
  "gppd_idnr": "WRI1019824",
  "capacity_mw": 400,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "Low income",
  "country_code": "PRK",
  "country_long": "North Korea",
  "name": "The June 16th�Power Plant",
  "gppd_idnr": "WRI1019830",
  "capacity_mw": 200,
  "fuel1": "Coal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": 1975,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "Lower middle income",
  "country_code": "IDN",
  "country_long": "Indonesia",
  "name": "Bakaru",
  "gppd_idnr": "WRI1000738",
  "capacity_mw": 126,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "Lower middle income",
  "country_code": "IDN",
  "country_long": "Indonesia",
  "name": "Balambano",
  "gppd_idnr": "WRI1000739",
  "capacity_mw": 130,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "Lower middle income",
  "country_code": "IDN",
  "country_long": "Indonesia",
  "name": "Besai - Way Kanan",
  "gppd_idnr": "WRI1000744",
  "capacity_mw": 92.8,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "Lower middle income",
  "country_code": "IDN",
  "country_long": "Indonesia",
  "name": "Bili bili",
  "gppd_idnr": "WRI1000745",
  "capacity_mw": 20.1,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "Lower middle income",
  "country_code": "IDN",
  "country_long": "Indonesia",
  "name": "Golang - Pamekasan",
  "gppd_idnr": "WRI1000756",
  "capacity_mw": 2.7,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "Lower middle income",
  "country_code": "IDN",
  "country_long": "Indonesia",
  "name": "Kamojang 1  2  3",
  "gppd_idnr": "WRI1000764",
  "capacity_mw": 140,
  "fuel1": "Geothermal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "Lower middle income",
  "country_code": "IDN",
  "country_long": "Indonesia",
  "name": "Lahendong (Binary Cycle)",
  "gppd_idnr": "WRI1000777",
  "capacity_mw": 20,
  "fuel1": "Geothermal",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "Lower middle income",
  "country_code": "IDN",
  "country_long": "Indonesia",
  "name": "Lau Renun",
  "gppd_idnr": "WRI1000781",
  "capacity_mw": 82,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "Lower middle income",
  "country_code": "IDN",
  "country_long": "Indonesia",
  "name": "Minahasa - rental",
  "gppd_idnr": "WRI1000791",
  "capacity_mw": 35,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "Lower middle income",
  "country_code": "IDN",
  "country_long": "Indonesia",
  "name": "North Duri Cogeneration Plant",
  "gppd_idnr": "WRI1000794",
  "capacity_mw": 300,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "Lower middle income",
  "country_code": "IDN",
  "country_long": "Indonesia",
  "name": "Pejengkolan/Mrica",
  "gppd_idnr": "WRI1000801",
  "capacity_mw": 1.4,
  "fuel1": "Hydro",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "Lower middle income",
  "country_code": "IDN",
  "country_long": "Indonesia",
  "name": "Pemaron BOO",
  "gppd_idnr": "WRI1000802",
  "capacity_mw": 45,
  "fuel1": "Oil",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "Lower middle income",
  "country_code": "IDN",
  "country_long": "Indonesia",
  "name": "PLTG Cikarang Listrindo",
  "gppd_idnr": "WRI1000821",
  "capacity_mw": 150,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "Lower middle income",
  "country_code": "IDN",
  "country_long": "Indonesia",
  "name": "PLTG Duri ex PLTG Sunyaragi Cent Java",
  "gppd_idnr": "WRI1000824",
  "capacity_mw": 20,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "Lower middle income",
  "country_code": "IDN",
  "country_long": "Indonesia",
  "name": "PLTG Grati",
  "gppd_idnr": "WRI1000829",
  "capacity_mw": 302,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "Lower middle income",
  "country_code": "IDN",
  "country_long": "Indonesia",
  "name": "PLTGU Gresik",
  "gppd_idnr": "WRI1000876",
  "capacity_mw": 1579,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "Lower middle income",
  "country_code": "IDN",
  "country_long": "Indonesia",
  "name": "PLTGU Muara Karang repowering Blok 2",
  "gppd_idnr": "WRI1000881",
  "capacity_mw": 210,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}, {
  "Region": "East Asia & Pacific",
  "income_group": "Lower middle income",
  "country_code": "IDN",
  "country_long": "Indonesia",
  "name": "PLTGU Muara Tawar Block 5",
  "gppd_idnr": "WRI1000883",
  "capacity_mw": 384,
  "fuel1": "Gas",
  "fuel2": null,
  "fuel3": null,
  "fuel4": null,
  "commissioning_year": null,
  "year_of_capacity_data": null,
  "avg_gen": null,
  "size": null
}];
},{}],"js/app.js":[function(require,module,exports) {
"use strict";

var _hyperapp = require("hyperapp");

var Plants = require("./data/plant.json");
/** @jsx h */


var BadTypes = "Hydro,Gas,Other,Oil,Nuclear,Coal,Waste,\
Biomass,Geothermal,NA,Cogeneration,Storage,Petcoke".split(',');
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

var bcard = function bcard(item) {
  return (0, _hyperapp.h)("div", {
    class: "card"
  }, (0, _hyperapp.h)("div", {
    class: "card-header"
  }, (0, _hyperapp.h)("div", {
    class: "country-image"
  }, (0, _hyperapp.h)("img", {
    src: "images/country/usa.png"
  })), (0, _hyperapp.h)("div", {
    class: "card-title"
  }, (0, _hyperapp.h)("div", {
    class: "card-maintitle"
  }, item.name), (0, _hyperapp.h)("div", {
    class: "card-subtitle"
  }, item.country_long))), (0, _hyperapp.h)("div", {
    class: 'card-content content-' + (BadTypes.indexOf(item.fuel1) == -1 ? 'good' : 'bad')
  }, (0, _hyperapp.h)("div", {
    class: "card-year"
  }, "2016"), (0, _hyperapp.h)("div", {
    class: "card-icon"
  }, (0, _hyperapp.h)("img", {
    src: 'images/type/' + item.fuel1 + '.png'
  }))), (0, _hyperapp.h)("div", {
    class: "card-footer"
  }, (0, _hyperapp.h)("div", {
    class: "footer-label"
  }, "578 gwh generated"), (0, _hyperapp.h)("div", {
    class: "generation-viz"
  }, (0, _hyperapp.h)("div", {
    class: "unit-on"
  }), (0, _hyperapp.h)("div", {
    class: "unit-on"
  }), (0, _hyperapp.h)("div", {
    class: "unit-on"
  }), (0, _hyperapp.h)("div", {
    class: "unit-on"
  }), (0, _hyperapp.h)("div", {
    class: "unit-on"
  }), (0, _hyperapp.h)("div", {
    class: "unit-on"
  }), (0, _hyperapp.h)("div", {
    class: "unit-off"
  }), (0, _hyperapp.h)("div", {
    class: "unit-off"
  }), (0, _hyperapp.h)("div", {
    class: "unit-off"
  }), (0, _hyperapp.h)("div", {
    class: "unit-off"
  }), (0, _hyperapp.h)("div", {
    class: "unit-off"
  }), (0, _hyperapp.h)("div", {
    class: "unit-off"
  }), (0, _hyperapp.h)("div", {
    class: "unit-off"
  }), (0, _hyperapp.h)("div", {
    class: "unit-off"
  }), (0, _hyperapp.h)("div", {
    class: "unit-off"
  }), (0, _hyperapp.h)("div", {
    class: "unit-off"
  }), (0, _hyperapp.h)("div", {
    class: "unit-off"
  }), (0, _hyperapp.h)("div", {
    class: "unit-off"
  }), (0, _hyperapp.h)("div", {
    class: "unit-off"
  }), (0, _hyperapp.h)("div", {
    class: "unit-off"
  }), (0, _hyperapp.h)("div", {
    class: "unit-off"
  }), (0, _hyperapp.h)("div", {
    class: "unit-off"
  }), (0, _hyperapp.h)("div", {
    class: "unit-off"
  }), (0, _hyperapp.h)("div", {
    class: "unit-off"
  }), (0, _hyperapp.h)("div", {
    class: "unit-off"
  }), (0, _hyperapp.h)("div", {
    class: "unit-off"
  }), (0, _hyperapp.h)("div", {
    class: "unit-off"
  }), (0, _hyperapp.h)("div", {
    class: "unit-off"
  }), (0, _hyperapp.h)("div", {
    class: "unit-off"
  }), (0, _hyperapp.h)("div", {
    class: "unit-off"
  }))));
};

var view = function view(state, actions) {
  return (0, _hyperapp.h)("div", {
    class: "row grid-layout"
  }, state.plants.map(function (plant, i) {
    return bcard(plant);
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
  var ws = new WebSocket(protocol + '://' + hostname + ':' + "50707" + '/');

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