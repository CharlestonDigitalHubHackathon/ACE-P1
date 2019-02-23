import { h, app } from "hyperapp"
import BadTypes from "./data/BadTypes"

import thumbView from "./views/thumbView"
import mainView from "./views/mainView"

var Plants = require("./data/plant.json");

/** @jsx h */

function parseArray(data, filterName){
    var Collection = {};
    data.reduce(function (newarr, plt, i) {
        var results = {};
        if (plt.Region !== null) {
            var group_name = plt[filterName];
            if (Collection.hasOwnProperty(group_name)) {
                Collection[group_name].push(plt);
            } else {
                Collection[group_name] = [plt];
            }
        }
        return results
    }, {});
    return Collection;

}


const state = {
    plants: Plants,
    count: 0
}

const actions = {
    down: () => state => ({ count: state.count - 1 }),
    up: () => state => ({ count: state.count + 1 })
}
var filterPlants = parseArray(Plants, 'Region');

const view = (state, actions) => mainView(filterPlants);

// const view = (state, actions) => (
//     <div class="row grid-layout tiny four-column">
//       {mainView()}
//     </div>
// )
// window.Plants = Plants;
// window.parseArray = parseArray;

app(state, actions, view, document.querySelector("#ace-app"));