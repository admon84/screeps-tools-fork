import * as React  from 'react'
import {
  HashRouter,
  Route,
  withRouter,
  Switch,
  NavLink
} from 'react-router-dom'
// import * as ReactGA from 'react-ga'
import {RouteComponentProps} from 'react-router'

import {BuildingPlanner} from './building-planner'
import {CreepDesigner} from './creep-designer'
import {Index} from './index'

// ReactGA.initialize('UA-75492019-2')

class AppRouter extends React.Component<RouteComponentProps<{}>>{
  // componentDidMount(){
  //   this.props.history.listen((location, action) => {
  //     ReactGA.set({page: location.pathname})
  //     ReactGA.pageview(location.pathname)
  //   })
  // }

  render(){
    return <div className="screeps-tools">
      <div className="header">
        <img src="/img/screeps/logo.gif" />
        <NavLink to='/' exact>Tools</NavLink>
        <NavLink to='/building-planner'>Building Planner</NavLink>
        <NavLink to='/creep-designer'>Creep Designer</NavLink>
        <a href="https://github.com/Arcath/screeps-tools" className="gh-link">GitHub</a>
      </div>
      <Switch>
        <Route path='/building-planner' component={BuildingPlanner} />
        <Route path='/creep-designer' component={CreepDesigner} />
        <Route path='/' exact component={Index} />
      </Switch>
    </div>
  }
}

const WrappedApp = withRouter(AppRouter)

export const App = () => (
  <HashRouter>
    <WrappedApp />
  </HashRouter>
)