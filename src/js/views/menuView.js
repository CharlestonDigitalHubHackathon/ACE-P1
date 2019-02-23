import { h, app } from "hyperapp"
import Regions from "../data/Regions"

export default (columndata) => {
    return (<ul class="filter-menu">
        {smset.map((region, i) => {
            return (
                <li><input type="radio" name="type" value="coal"/>{region}</li>
            )
        })}
    </ul>
    )
};
