import * as React  from 'react';
import {BrowserRouter, Route, withRouter, Switch, NavLink} from 'react-router-dom';
import {RouteComponentProps} from 'react-router';

import {BuildingPlanner} from './building-planner';
import {CreepDesigner} from './creep-designer';
import {Index} from './index';

class AppRouter extends React.Component<RouteComponentProps<{}>> {
    render() {
        return (
            <div className="screeps-tools">
                <div className="header">
                    <img src="/img/screeps/logo.svg" />
                    <NavLink to='/' exact>Tools</NavLink>
                    <NavLink to='/building-planner'>Building Planner</NavLink>
                    <NavLink to='/creep-designer'>Creep Designer</NavLink>
                </div>
                <Switch>
                    <Route path='/' exact component={Index} />
                    <Route path='/building-planner' component={BuildingPlanner} />
                    <Route path='/creep-designer' component={CreepDesigner} />
                </Switch>
            </div>
        );
    }
}

const WrappedApp = withRouter(AppRouter);

export const App = () => (
    <BrowserRouter forceRefresh={true}>
        <WrappedApp />
    </BrowserRouter>
);