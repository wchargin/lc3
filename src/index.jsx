import React from 'react';
import {createStore} from 'redux';
import {Provider} from 'react-redux';

import reducer from './reducers';

import App from './components/App';
import LC3 from './core/lc3';

const store = createStore(reducer);

const component = <Provider store={store}>
    {() => <App />}
</Provider>;

React.render(component, document.getElementById('app'));
