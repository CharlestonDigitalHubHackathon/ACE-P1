import { h, app } from "hyperapp"
import BadTypes from "../data/BadTypes"

export default (item) => {
    return (
        <div class="card">
            <div class="card-header">
                <div class="country-image">
                    <img src={'assets/country/' + item.country_2 + '.png'} />
                </div>
                <div class="card-title">
                    <div class="card-maintitle">{item.name}</div>
                    <div class="card-subtitle">{item.country_long}</div>
                </div>
            </div>
            <div class={'card-content content-' + (BadTypes.indexOf(item.fuel1) == -1 ? 'good' : 'bad')}>
                <div class="card-year">2016</div>
                <div class="card-icon">
                    <img src={'images/type/' + item.fuel1 + '.png'} />
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