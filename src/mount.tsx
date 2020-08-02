import * as React  from 'react';
import * as ReactDOM  from 'react-dom';
import {App} from './views/router';

import './less/main.less';
import 'bootstrap/dist/css/bootstrap.css';

document.addEventListener('DOMContentLoaded', function() {
    ReactDOM.render(React.createElement(App), document.getElementById('react-container'));
});