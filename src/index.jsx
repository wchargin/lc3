import React from 'react';
import App from './components/App';

import LC3 from './core/lc3';

React.render(<App />, document.getElementById('app'));

// STOPSHIP
window.LC3 = LC3;
