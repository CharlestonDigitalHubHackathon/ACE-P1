import { h, app } from "hyperapp"
import Regions from "../data/Regions"
import thumbView from "./thumbView";

const smset = Regions.slice(0, 4);
export default (columndata) => {
    return (<div class="main-page grid-layout four-column">
        {smset.map((region, i) => {
            return (
                <div class="col">
                    <div class="section-content">{columndata[region].map((plant)=>thumbView(plant))}</div>
                    <div class="section-title">{region}</div>
                </div>
            )
        })}

    </div>
    )
};