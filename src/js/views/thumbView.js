import { h, app } from "hyperapp"
import BadTypes from "../data/BadTypes"

export default (item) => {
    return (<div class={'card tiny-card ' + (BadTypes.indexOf(item.fuel1) == -1 ? 'content-good' : 'content-bad')}>
        <div class="card-header">
            <div>
                <img src={'assets/country/' + item.country_2 + '.png'} />
            </div>
            <div>
                <div class="card-maintitle">{item.name}</div>
            </div>
        </div>
    </div>
    )
};
