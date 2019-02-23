import { h, app } from "hyperapp"

var Plants = require("./data/plant.json");
/** @jsx h */
var BadTypes = "Hydro,Gas,Other,Oil,Nuclear,Coal,Waste,\
Biomass,Geothermal,NA,Cogeneration,Storage,Petcoke"
.split(',');

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

const bcard = (item) => {
    return (
        <div class="card">
            <div class="card-header">
                <div class="country-image">
                    <img src="images/country/usa.png" />
                </div>
                <div class="card-title">
                        <div class="card-maintitle">{item.name}</div>
                    <div class="card-subtitle">{item.country_long}</div>
                </div>
            </div>
            <div class={'card-content content-'+(BadTypes.indexOf(item.fuel1)== -1?'good':'bad')}>
                <div class="card-year">2016</div>
                <div class="card-icon">
                        <img src={'images/type/'+item.fuel1+'.png'} />
                </div>
            </div>
            <div class="card-footer">
                <div class="footer-label">
                    578 gwh generated
                </div>
                <div class="generation-viz">
                    <div class="unit-on"></div>
                    <div class="unit-on"></div>
                    <div class="unit-on"></div>
                    <div class="unit-on"></div>
                    <div class="unit-on"></div>
                    <div class="unit-on"></div>
                    <div class="unit-off"></div>
                    <div class="unit-off"></div>
                    <div class="unit-off"></div>
                    <div class="unit-off"></div>
                    <div class="unit-off"></div>
                    <div class="unit-off"></div>
                    <div class="unit-off"></div>
                    <div class="unit-off"></div>
                    <div class="unit-off"></div>
                    <div class="unit-off"></div>
                    <div class="unit-off"></div>
                    <div class="unit-off"></div>
                    <div class="unit-off"></div>
                    <div class="unit-off"></div>
                    <div class="unit-off"></div>
                    <div class="unit-off"></div>
                    <div class="unit-off"></div>
                    <div class="unit-off"></div>
                    <div class="unit-off"></div>
                    <div class="unit-off"></div>
                    <div class="unit-off"></div>
                    <div class="unit-off"></div>
                    <div class="unit-off"></div>
                    <div class="unit-off"></div>
                </div>
            </div>
        </div>
        )
}

const view = (state, actions) => (
    <div class="row grid-layout">
        {state.plants.map((plant,i)=> bcard(plant) )}
    </div>
)
console.log(Plants);
app(state, actions, view, document.querySelector("#ace-app"))