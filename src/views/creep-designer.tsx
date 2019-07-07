//import * as jQuery from 'jquery'
import * as React from 'react'

const RCL_ENERGY: {[level: number]: number} = {
  1: 300,
  2: 550,
  3: 800,
  4: 1300,
  5: 1800,
  6: 2300,
  7: 5600,
  8: 12900
}

const BODYPART_COST: {[part: string]: number} = {
  move: 50,
  work: 100,
  attack: 80,
  carry: 50,
  heal: 250,
  ranged_attack: 150,
  tough: 10,
  claim: 600
}

const BODYPARTS: {[part: string]: string} = {
  tough: "TOUGH",
  move: "MOVE",
  work: "WORK",
  carry: "CARRY",
  attack: "ATTACK",
  ranged_attack: "RANGED_ATTACK",
  heal: "HEAL",
  claim: "CLAIM"
}

export class CreepDesigner extends React.Component{
  state: Readonly<{
    body: {[part: string]: number}
  }>

  constructor(props: any){
    super(props)

    this.state = {
      body: {
        move: 1,
        work: 0,
        attack: 0,
        ranged_attack: 0,
        tough: 0,
        heal: 0,
        claim: 0,
        carry: 0
      }
    }

    if(!props.api){
      let params = location.href.split('?')[1]
      let searchParams = new URLSearchParams(params)

      if(searchParams.get('share')){
        let body = searchParams.get('share')!
        let creepBody = this.state.body
        let i = 0
        body.split("#").forEach((count) => {
          creepBody[Object.keys(BODYPARTS)[i]] = parseInt(count)
          i += 1
        })

        this.setState({body: creepBody})
      }
    }
  }

  remove(part: string){
    let body = this.state.body

    if(body[part]){
      body[part] -= 1
    }

    this.setState({body: body})
  }

  add(part: string){
    let body = this.state.body
    
    if(this.count() < 50 && (this.totalCost() + BODYPART_COST[part]) < RCL_ENERGY[8]){
      if(body[part]){
        body[part] += 1
      }else{
        body[part] = 1
      }
    }

    this.setState({body: body})
  }

  walkTimeFull(move: number, multiplier: number, incrementer: number){
    let time = 0;

    if (move > 0) {
      time = Math.ceil((Math.ceil(1 / ((move * incrementer) / this.count())) - 1) * multiplier);
      time = time > 0 ? time : 1;
    }

    return time
  }

  walkTimeEmpty(move: number, carry: number, multiplier: number, incrementer: number){
    let time = 0;

    if (move > 0) {
      time = Math.ceil((Math.ceil(1 / ((move * incrementer) / (this.count() - carry))) - 1) * multiplier);
      time = time > 0 ? time : 1;
    }

    return time
  }

  partCost(part: string){
    let cost = 0
    let component = this

    if (part && BODYPART_COST[part]) {
      cost = (component.state.body[part] * BODYPART_COST[part])
    }

    return cost
  }

  totalCost(){
    let cost = 0
    let component = this

    Object.keys(BODYPARTS).forEach((part) => {
      cost += (component.state.body[part] * BODYPART_COST[part])
    })

    return cost
  }

  count(){
    let count = 0
    let component = this
    

    Object.keys(BODYPARTS).forEach((part) => {
      count += component.state.body[part]
    })

    return count
  }

  body(){
    let body = '['

    Object.keys(BODYPARTS).forEach((part) => {
      for(let i = 0; i < this.state.body[part]; i++){
        body += BODYPARTS[part] + ','
      }
    })

    return body.slice(0, -1) + ']'
  }

  shareLink(){
    let counts: number[] = []

    Object.keys(BODYPARTS).forEach((part) => {
      counts.push(this.state.body[part])
    })

    return "http://admon.tk/#/creep-designer/?share=" + counts.join('#')
  }

  creepLifespan(){
    if(this.state.body.claim > 0){
      return 500
    }else{
      return 1500
    }
  }

  requiredRCL(){
    let rcl = 8
    let cost = this.totalCost()
    Object.keys(RCL_ENERGY).reverse().forEach((rclLevel) => {
      if(cost <= RCL_ENERGY[parseInt(rclLevel)]){
        rcl = parseInt(rclLevel)
      }
    })

    return rcl
  }

  import(e: any){
    let data = e.target.value
    let body = this.state.body

    Object.keys(BODYPARTS).forEach((part) => {
      body[part] = (data.match(new RegExp(BODYPARTS[part], 'g')) || []).length
    })

    if(!e.noState){
      this.setState({body: body})
    }
  }

  set(e: any, part: string){
    let value = e.target.value
    let body = this.state.body
    
    body[part] = parseInt(value)

    this.setState({body: body})
  }

  render(){
    return <div className="creep-designer">
      <div className="panel">
        <table className="body">
          <thead>
            <tr>
              <th>Body Part</th>
              <th>Price</th>
              <th>Count</th>
              <th>Sum</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(BODYPARTS).map((part) => {
              return <tr key={part} className={this.state.body[part] > 0 ? 'active-parts' : ''}>
                <td className="part">{BODYPARTS[part]} </td>
                <td className="price">{BODYPART_COST[part]}</td>
                <td className="count">
                  <button onClick={() => this.remove(part)}>&minus;</button>
                  <input type="text" value={this.state.body[part] ? this.state.body[part] : 0} onChange={(e) => this.set(e, part)} />
                  <button onClick={() => this.add(part)}>+</button>
                </td>
                <td className="sum">{this.partCost(part) ? '-' + this.partCost(part) : '0'}</td>
              </tr>
            })}
            <tr>
              <td className="part"><b>Total</b> (RCL {this.requiredRCL()})</td>
              <td className="price"></td>
              <td className="count"><b>{this.count()}</b></td>
              <td className="sum total">{this.totalCost() ? '-' + this.totalCost() : '0'}</td>
            </tr>
          </tbody>
        </table>
        <Creep body={this.state.body} />
        <textarea id='creep-body' value={this.body()} onChange={(e) => this.import(e)}></textarea>
        <a href={this.shareLink()}>Shareable Link</a>
      </div>
      <div className="panel">
        <table className="stats">
          <thead>
            <tr>
              <th></th>
              <th>Unboosted</th>
              <th>T1</th>
              <th>T2</th>
              <th>T3</th>
              <th>Lifespan</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{backgroundColor: '#efefef', color: '#444'}}>
              <td>Health</td>
              <td colSpan={5} className="text-center">{(this.count() * 100).toLocaleString()} (from TOUGH: {(this.state.body.tough * 100).toLocaleString()})</td>
            </tr>
            <tr style={{backgroundColor: '#ffe56d', color: '#444'}}>
              <td>Harvest (Energy)</td>
              <td className="text-center">{(this.state.body.work * 2).toLocaleString()}/T</td>
              <td className="text-center">{((this.state.body.work * 2) * 3).toLocaleString()}/T</td>
              <td className="text-center">{((this.state.body.work * 2) * 5).toLocaleString()}/T</td>
              <td className="text-center">{((this.state.body.work * 2) * 7).toLocaleString()}/T</td>
              <td className="text-center">{((this.state.body.work * 2) * this.creepLifespan()).toLocaleString()}</td> 
            </tr>
            <tr style={{backgroundColor: '#ffe56d', color: '#444'}}>
              <td>Ticks to Empty Source</td>
              <td className="text-center">{(3000 / (this.state.body.work * 2)).toLocaleString()}</td>
              <td className="text-center">{(3000 / ((this.state.body.work * 2) * 3)).toLocaleString()}</td>
              <td className="text-center">{(3000 / ((this.state.body.work * 2) * 5)).toLocaleString()}</td>
              <td className="text-center">{(3000 / ((this.state.body.work * 2) * 7)).toLocaleString()}</td>
              <td className="text-center"></td> 
            </tr>
            <tr style={{backgroundColor: '#ffe56d', color: '#444'}}>
              <td>Harvest (Mineral)</td>
              <td className="text-center">{(this.state.body.work * 1).toLocaleString()}/T</td>
              <td className="text-center">{((this.state.body.work * 1) * 3).toLocaleString()}/T</td>
              <td className="text-center">{((this.state.body.work * 1) * 5).toLocaleString()}/T</td>
              <td className="text-center">{((this.state.body.work * 1) * 7).toLocaleString()}/T</td>
              <td className="text-center">{((this.state.body.work * 1) * this.creepLifespan()).toLocaleString()}</td>
            </tr>
            <tr style={{backgroundColor: '#ffe56d', color: '#444'}}>
              <td>Upgrade Controller</td>
              <td className="text-center">{(this.state.body.work * 1).toLocaleString()}/T</td>
              <td className="text-center">{((this.state.body.work * 1) * 1.5).toLocaleString()}/T</td>
              <td className="text-center">{((this.state.body.work * 1) * 1.8).toLocaleString()}/T</td>
              <td className="text-center">{((this.state.body.work * 1) * 2).toLocaleString()}/T</td>
              <td className="text-center">{((this.state.body.work * 1) * this.creepLifespan()).toLocaleString()}</td>
            </tr>
            <tr style={{backgroundColor: '#ffe56d', color: '#444'}}>
              <td>Build</td>
              <td className="text-center">{(this.state.body.work * 5).toLocaleString()}/T</td>
              <td className="text-center">{((this.state.body.work * 5) * 1.5).toLocaleString()}/T</td>
              <td className="text-center">{((this.state.body.work * 5) * 1.8).toLocaleString()}/T</td>
              <td className="text-center">{((this.state.body.work * 5) * 2).toLocaleString()}/T</td>
              <td className="text-center">{((this.state.body.work * 5) * this.creepLifespan()).toLocaleString()}</td>
            </tr>
            <tr style={{backgroundColor: '#ffe56d', color: '#444'}}>
              <td>Dismantle</td>
              <td className="text-center">{(this.state.body.work * 50).toLocaleString()}/T</td>
              <td className="text-center">{((this.state.body.work * 50) * 2).toLocaleString()}/T</td>
              <td className="text-center">{((this.state.body.work * 50) * 3).toLocaleString()}/T</td>
              <td className="text-center">{((this.state.body.work * 50) * 4).toLocaleString()}/T</td>
              <td className="text-center">{((this.state.body.work * 50) * this.creepLifespan()).toLocaleString()}</td>
            </tr>
            <tr style={{backgroundColor: '#f93842', color: '#fff'}}>
              <td>Attack</td>
              <td className="text-center">{(this.state.body.attack * 30).toLocaleString()}/T</td>
              <td className="text-center">{((this.state.body.attack * 30) * 2).toLocaleString()}/T</td>
              <td className="text-center">{((this.state.body.attack * 30) * 3).toLocaleString()}/T</td>
              <td className="text-center">{((this.state.body.attack * 30) * 4).toLocaleString()}/T</td>
              <td className="text-center">{((this.state.body.attack * 30) * this.creepLifespan()).toLocaleString()}</td>
            </tr>
            <tr style={{backgroundColor: '#5d7fb2', color: '#fff'}}>
              <td>Ranged Attack</td>
              <td className="text-center">{(this.state.body.ranged_attack * 10).toLocaleString()}/T</td>
              <td className="text-center">{((this.state.body.ranged_attack * 10) * 2).toLocaleString()}/T</td>
              <td className="text-center">{((this.state.body.ranged_attack * 10) * 3).toLocaleString()}/T</td>
              <td className="text-center">{((this.state.body.ranged_attack * 10) * 4).toLocaleString()}/T</td>
              <td className="text-center">{((this.state.body.ranged_attack * 10) * this.creepLifespan()).toLocaleString()}</td>               
            </tr>
            <tr style={{backgroundColor: '#5d7fb2', color: '#fff'}}>
              <td>Ranged Mass Attack (1)</td>
              <td className="text-center">{(this.state.body.ranged_attack * 10).toLocaleString()}/T</td>
              <td className="text-center">{((this.state.body.ranged_attack * 10) * 2).toLocaleString()}/T</td>
              <td className="text-center">{((this.state.body.ranged_attack * 10) * 3).toLocaleString()}/T</td>
              <td className="text-center">{((this.state.body.ranged_attack * 10) * 4).toLocaleString()}/T</td>
              <td className="text-center">{((this.state.body.ranged_attack * 10) * this.creepLifespan()).toLocaleString()}</td>               
            </tr>
            <tr style={{backgroundColor: '#5d7fb2', color: '#fff'}}>
              <td>Ranged Mass Attack (2)</td>
              <td className="text-center">{(this.state.body.ranged_attack * 4).toLocaleString()}/T</td>
              <td className="text-center">{((this.state.body.ranged_attack * 4) * 2).toLocaleString()}/T</td>
              <td className="text-center">{((this.state.body.ranged_attack * 4) * 3).toLocaleString()}/T</td>
              <td className="text-center">{((this.state.body.ranged_attack * 4) * 4).toLocaleString()}/T</td>
              <td className="text-center">{((this.state.body.ranged_attack * 4) * this.creepLifespan()).toLocaleString()}</td>              
            </tr>
            <tr style={{backgroundColor: '#5d7fb2', color: '#fff'}}>
              <td>Ranged Mass Attack (3)</td>
              <td className="text-center">{(this.state.body.ranged_attack * 1).toLocaleString()}/T</td>
              <td className="text-center">{((this.state.body.ranged_attack * 1) * 2).toLocaleString()}/T</td>
              <td className="text-center">{((this.state.body.ranged_attack * 1) * 3).toLocaleString()}/T</td>
              <td className="text-center">{((this.state.body.ranged_attack * 1) * 4).toLocaleString()}/T</td>
              <td className="text-center">{((this.state.body.ranged_attack * 1) * this.creepLifespan()).toLocaleString()}</td>              
            </tr>
            <tr style={{backgroundColor: '#65fd62', color: '#444'}}>
              <td>Heal</td>
              <td className="text-center">{(this.state.body.heal * 12).toLocaleString()}/T</td>
              <td className="text-center">{((this.state.body.heal * 12) * 2).toLocaleString()}/T</td>
              <td className="text-center">{((this.state.body.heal * 12) * 3).toLocaleString()}/T</td>
              <td className="text-center">{((this.state.body.heal * 12) * 4).toLocaleString()}/T</td>
              <td className="text-center">{((this.state.body.heal * 12) * this.creepLifespan()).toLocaleString()}</td>
            </tr>
            <tr style={{backgroundColor: '#65fd62', color: '#444'}}>
              <td>Ranged Heal</td>
              <td className="text-center">{(this.state.body.heal * 4).toLocaleString()}/T</td>
              <td className="text-center">{((this.state.body.heal * 4) * 2).toLocaleString()}/T</td>
              <td className="text-center">{((this.state.body.heal * 4) * 3).toLocaleString()}/T</td>
              <td className="text-center">{((this.state.body.heal * 4) * 4).toLocaleString()}/T</td>
              <td className="text-center">{((this.state.body.heal * 4) * this.creepLifespan()).toLocaleString()}</td>              
            </tr>
            <tr style={{backgroundColor: '#efefef', color: '#444'}}>
              <td>Carry</td>
              <td className="text-center">{(this.state.body.carry * 50).toLocaleString()}</td>
              <td className="text-center">{((this.state.body.carry * 50) * 2).toLocaleString()}</td>
              <td className="text-center">{((this.state.body.carry * 50) * 3).toLocaleString()}</td>
              <td className="text-center">{((this.state.body.carry * 50) * 4).toLocaleString()}</td>
              <td className="text-center"></td>
            </tr>
            <tr style={{backgroundColor: '#a9b7c6', color: '#444'}}>
              <td>Move on Plain (empty)</td>
              <td className="text-center">{this.walkTimeEmpty(this.state.body.move, this.state.body.carry, 1, 1)}</td>
              <td className="text-center">{this.walkTimeEmpty(this.state.body.move, this.state.body.carry, 1, 2)}</td>
              <td className="text-center">{this.walkTimeEmpty(this.state.body.move, this.state.body.carry, 1, 3)}</td>
              <td className="text-center">{this.walkTimeEmpty(this.state.body.move, this.state.body.carry, 1, 4)}</td>
              <td className="text-center"></td>
            </tr>
            <tr style={{backgroundColor: '#a9b7c6', color: '#444'}}>
              <td>Move on Road (empty)</td>
              <td className="text-center">{this.walkTimeEmpty(this.state.body.move, this.state.body.carry, 0.5, 1)}</td>
              <td className="text-center">{this.walkTimeEmpty(this.state.body.move, this.state.body.carry, 0.5, 2)}</td>
              <td className="text-center">{this.walkTimeEmpty(this.state.body.move, this.state.body.carry, 0.5, 3)}</td>
              <td className="text-center">{this.walkTimeEmpty(this.state.body.move, this.state.body.carry, 0.5, 4)}</td>
              <td className="text-center"></td>
            </tr>
            <tr style={{backgroundColor: '#a9b7c6', color: '#444'}}>
              <td>Move on Swamp (empty)</td>
              <td className="text-center">{this.walkTimeEmpty(this.state.body.move, this.state.body.carry, 5, 1)}</td>
              <td className="text-center">{this.walkTimeEmpty(this.state.body.move, this.state.body.carry, 5, 2)}</td>
              <td className="text-center">{this.walkTimeEmpty(this.state.body.move, this.state.body.carry, 5, 3)}</td>
              <td className="text-center">{this.walkTimeEmpty(this.state.body.move, this.state.body.carry, 5, 4)}</td>
              <td className="text-center"></td>
            </tr>
            <tr style={{backgroundColor: '#a9b7c6', color: '#444'}}>
              <td>Move on Plain (full)</td>
              <td className="text-center">{this.walkTimeFull(this.state.body.move, 1, 1)}</td>
              <td className="text-center">{this.walkTimeFull(this.state.body.move, 1, 2)}</td>
              <td className="text-center">{this.walkTimeFull(this.state.body.move, 1, 3)}</td>
              <td className="text-center">{this.walkTimeFull(this.state.body.move, 1, 4)}</td>
              <td className="text-center"></td>
            </tr>
            <tr style={{backgroundColor: '#a9b7c6', color: '#444'}}>
              <td>Move on Road (full)</td>
              <td className="text-center">{this.walkTimeFull(this.state.body.move, 0.5, 1)}</td>
              <td className="text-center">{this.walkTimeFull(this.state.body.move, 0.5, 2)}</td>
              <td className="text-center">{this.walkTimeFull(this.state.body.move, 0.5, 3)}</td>
              <td className="text-center">{this.walkTimeFull(this.state.body.move, 0.5, 4)}</td>
              <td className="text-center"></td>
            </tr>
            <tr style={{backgroundColor: '#a9b7c6', color: '#444'}}>
              <td>Move on Swamp (full)</td>
              <td className="text-center">{this.walkTimeFull(this.state.body.move, 5, 1)}</td>
              <td className="text-center">{this.walkTimeFull(this.state.body.move, 5, 2)}</td>
              <td className="text-center">{this.walkTimeFull(this.state.body.move, 5, 3)}</td>
              <td className="text-center">{this.walkTimeFull(this.state.body.move, 5, 4)}</td>
              <td className="text-center"></td>
            </tr>
          </tbody>
        </table>
        <br/>
        <h4>Creep Functions</h4>
        <ul className="creepFunctions">
          <li className={this.state.body.move > 0 ? 'yes' : 'no'}>move</li>
          <li className={this.state.body.move > 0 ? 'yes' : 'no'}>pull</li>
          <li className={this.state.body.work > 0 ? 'yes' : 'no'}>harvest</li>
          <li className={this.state.body.carry > 0 ? 'yes' : 'no'}>drop</li>
          <li className={this.state.body.carry > 0 ? 'yes' : 'no'}>pickup</li>
          <li className={this.state.body.carry > 0 ? 'yes' : 'no'}>transfer</li>
          <li className={this.state.body.carry > 0 ? 'yes' : 'no'}>withdraw</li>
          <li className={(this.state.body.work > 0 && this.state.body.carry > 0) ? 'yes' : 'no'}>build</li>
          <li className={(this.state.body.work > 0 && this.state.body.carry > 0) ? 'yes' : 'no'}>repair</li>
          <li className={(this.state.body.work > 0 && this.state.body.carry > 0) ? 'yes' : 'no'}>upgradeController</li>
        </ul>
        <ul className="creepFunctions">
          <li className={this.state.body.work > 0 ? 'yes' : 'no'}>dismantle</li>
          <li className={this.state.body.attack > 0 ? 'yes' : 'no'}>attack</li>
          <li className={this.state.body.heal > 0 ? 'yes' : 'no'}>heal</li>
          <li className={this.state.body.heal > 0 ? 'yes' : 'no'}>rangedHeal</li>
          <li className={this.state.body.ranged_attack > 0 ? 'yes' : 'no'}>rangedAttack</li>
          <li className={this.state.body.ranged_attack > 0 ? 'yes' : 'no'}>rangedMassAttack</li>
          <li className={this.state.body.claim > 0 ? 'yes' : 'no'}>reserveController</li>
          <li className={this.state.body.claim > 0 ? 'yes' : 'no'}>claimController</li>
          <li className={this.state.body.claim > 0 ? 'yes' : 'no'}>attackController</li>
          <li className={this.state.body.carry >= 20 ? 'yes' : 'no'}>generateSafeMode</li>
        </ul>
      </div>
    </div>
  }
}

const Creep = ({body}: {body: {[part: string]: number}}) => (
  <svg width="200" height="200">
    {/* TOUGH */}
    <circle cx={100} cy={100} r={65} fill="#525252" opacity={body.tough > 0 ? body.tough / 50 : 0 } />

    <circle cx={100} cy={100} r={60} fill="#222" />

    {/* RANGED_ATTACK */}
    <path d={bodyPartWedge(100,
      100,
      0 - bodyPartCountToDeg(body.claim + body.ranged_attack + body.attack + body.heal + body.work),
      bodyPartCountToDeg(body.claim + body.ranged_attack + body.attack + body.heal + body.work),
      65
    )} fill="#5d7fb2" transform="rotate(-90 100 100)" />

    {/* ATTACK */}
    <path d={bodyPartWedge(100,
      100,
      0 - bodyPartCountToDeg(body.claim + body.attack + body.heal + body.work),
      bodyPartCountToDeg(body.claim + body.attack + body.heal + body.work),
      65
    )} fill="#f93842" transform="rotate(-90 100 100)" />

    {/* HEAL */}
    <path d={bodyPartWedge(100,
      100,
      0 - bodyPartCountToDeg(body.claim + body.heal + body.work),
      bodyPartCountToDeg(body.claim + body.heal + body.work),
      65
    )} fill="#65fd62" transform="rotate(-90 100 100)" />

    {/* WORK */}
    <path d={bodyPartWedge(100,
      100,
      0 - bodyPartCountToDeg(body.claim + body.work),
      bodyPartCountToDeg(body.claim + body.work),
      65
    )} fill="#ffe56d" transform="rotate(-90 100 100)" />

    {/* CLAIM */}
    <path d={bodyPartWedge(100,
      100,
      0 - bodyPartCountToDeg(body.claim),
      bodyPartCountToDeg(body.claim),
      65
    )} fill="#b99cfb" transform="rotate(-90 100 100)" />

    {/* MOVE */}
    <path d={bodyPartWedge(100,
      100,
      0 - bodyPartCountToDeg(body.move),
      bodyPartCountToDeg(body.move),
    65)} fill="#a9b7c6" transform="rotate(90 100 100)" />
    

    <circle cx={100} cy={100} r={50} fill="#555" />
    <circle cx={100} cy={100} r={body.carry} fill="#ffe56d" />
  </svg>
)

function bodyPartCountToDeg(count: number){
  return (count * 7.2) / 2
}

function bodyPartWedge(startX: number, startY: number, startAngle: number, endAngle: number, radius: number){
  var x1 = startX + radius * Math.cos(Math.PI * startAngle/180);
  var y1 = startY + radius * Math.sin(Math.PI * startAngle/180);
  var x2 = startX + radius * Math.cos(Math.PI * endAngle/180);
  var y2 = startY + radius * Math.sin(Math.PI * endAngle/180);

  let largeArc = 0
  let travel = startAngle - endAngle

  if(travel < -180){
    largeArc = 1
  }

  var pathString = "M"+ startX + " " + startY + " L" + x1 + " " + y1 + " A" + radius + " " + radius + " 0 " + largeArc + " 1 " + x2 + " " + y2 + " z";

  return pathString;

}