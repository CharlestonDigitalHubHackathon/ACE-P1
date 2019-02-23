import { h, app } from "hyperapp"
import BadTypes from "../data/BadTypes"

export default (item) => {
    return (<div class={'card ' + (BadTypes.indexOf(item.fuel1) == -1 ? 'good' : 'bad')}>
        <div class="card-header">
            <div class="country-image">
                <img src="images/country/usa.png" />
            </div>
            <div class="card-title">
                <div class="card-maintitle">{item.name}</div>
                <div class="card-subtitle">{item.country_long}</div>
            </div>
        </div>
    </div>
    )
};
