require("babel-core/polyfill");
import React from 'react';
import ReactDOM from 'react-dom';
import {createStore} from 'redux';
import {Provider} from 'react-redux';

import reducer from './reducers';

import App from './components/App';
import LC3 from './core/lc3';

const store = createStore(reducer);

const component = <Provider store={store}>
    <App />
</Provider>;

ReactDOM.render(component, document.getElementById('app'));
