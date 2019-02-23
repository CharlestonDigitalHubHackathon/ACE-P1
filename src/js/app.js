import { h, app } from "hyperapp"
/** @jsx h */

const state = {
    count: 0
}

const actions = {
    down: () => state => ({ count: state.count - 1 }),
    up: () => state => ({ count: state.count + 1 })
}

const view = (state, actions) => (
    <div class="foo">
        <h1>{state.count}</h1>
        <button onclick={actions.down} disabled={state.count <= 0}>ー</button>
        <button onclick={actions.up}>＋</button>
    </div>
)

app(state, actions, view, document.querySelector("#ace-app"))