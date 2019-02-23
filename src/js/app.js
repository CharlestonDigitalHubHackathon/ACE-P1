import { h, app } from "hyperapp"
import BadTypes from "./data/BadTypes"

import thumbView from "./views/thumbView"

var Plants = require("./data/plant.json");

/** @jsx h */


const state = {
    plants: Plants,
    count: 0
}

const actions = {
    down: () => state => ({ count: state.count - 1 }),
    up: () => state => ({ count: state.count + 1 })
}


const view = (state, actions) => (
    <div class="row grid-layout tiny four-column">
        {state.plants.map((plant, i) => thumbView(plant) )}
    </div>
)
window.Plants = Plants;
console.log(Plants);
app(state, actions, view, document.querySelector("#ace-app"));