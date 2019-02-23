import { h, app } from "hyperapp"

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
const card = (item) => {
    return (<div class="col3"><div class="card">
                <div class="card-header">
                    <h1 class="card-title">{item.name}</h1>
                    <h3 class="card-meta">Software and hardware</h3>
                </div>
                <div class="card-body">
                    <p>Empower every person to achieve more.</p>
                </div>
                    <div class="card-footer"><a href="#" class="btn btn-primary">View More</a></div>
            </div></div>
        )
};

const view = (state, actions) => (
    <div class="row grid1">
        {state.plants.map((plant,i)=> card(plant) )}
    </div>
)
console.log(Plants);
app(state, actions, view, document.querySelector("#ace-app"))