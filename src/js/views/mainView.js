import { h, app } from "hyperapp"
import Regions from "../data/Regions"

const smset = Regions.slice(0,4);
export default (columndata) => {
    return (<div class="main-page grid-layout four-column">
        {smset.map((region, i)=>{
            return (
                <div class="col">
                    <div class="section-content"></div>
                    <div class="section-title">{region}</div>
                </div>
            )
        })}
        
    </div>
    )
};
