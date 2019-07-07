import * as React from 'react'
import {Link} from 'react-router-dom'

export const Index = () => (
  <div className="index">
    <img src="/img/screeps/header.jpg" id="screeps-header" />
    <br/>
    <h2><Link to='/building-planner'>Building Planner</Link></h2>
    <p>
      The Building planner is a port of Dissi's Building planner into React.
    </p>
    <br/>
    <h2><Link to='/creep-designer'>Creep Designer</Link></h2>
    <p>
      The Creep Designer gives a UI to build creeps and see all their stats.
    </p>
  </div>
)