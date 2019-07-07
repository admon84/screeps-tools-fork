import * as jQuery from 'jquery'
import * as React from 'react'
import {Form, Text, Select} from 'react-form'
import * as _ from 'lodash'
import * as LZString from 'lz-string'
//import {Link} from 'react-router-dom'

interface TerrainMap{
  [x: number]: {
    [y: number]: number
  }
}

type SelectOptions = Array<{
  value: string
  label: string
}>

interface StructureList{
  [structure: string]: {
    [level: number]: number
  }
}

const CONTROLLER_STRUCTURES: StructureList = {
    "spawn": { 0: 0, 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 2, 8: 3 },
    "extension": { 0: 0, 1: 0, 2: 5, 3: 10, 4: 20, 5: 30, 6: 40, 7: 50, 8: 60 },
    "link": { 1: 0, 2: 0, 3: 0, 4: 0, 5: 2, 6: 3, 7: 4, 8: 6 },
    "road": { 0: 2500, 1: 2500, 2: 2500, 3: 2500, 4: 2500, 5: 2500, 6: 2500, 7: 2500, 8: 2500 },
    "constructedWall": { 1: 0, 2: 2500, 3: 2500, 4: 2500, 5: 2500, 6: 2500, 7: 2500, 8: 2500 },
    "rampart": { 1: 0, 2: 2500, 3: 2500, 4: 2500, 5: 2500, 6: 2500, 7: 2500, 8: 2500 },
    "storage": { 1: 0, 2: 0, 3: 0, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1 },
    "tower": { 1: 0, 2: 0, 3: 1, 4: 1, 5: 2, 6: 2, 7: 3, 8: 6 },
    "observer": { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 1 },
    "powerSpawn": { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 1 },
    "extractor": { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 1, 7: 1, 8: 1 },
    "terminal": { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 1, 7: 1, 8: 1 },
    "lab": { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 3, 7: 6, 8: 10 },
    "container": { 0: 5, 1: 5, 2: 5, 3: 5, 4: 5, 5: 5, 6: 5, 7: 5, 8: 5 },
    "nuker": { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 1 }
};

const STRUCTURES: {[structure: string]: string} = {
  spawn: "Spawn",
  extension: "Extension",
  link: "Link",
  road: "Road",
  constructedWall: "Wall",
  rampart: "Rampart",
  tower: "Tower",
  observer: "Observer",
  powerSpawn: "Power Spawn",
  extractor: "Extractor",
  terminal: "Terminal",
  lab: "Lab",
  container: "Container",
  nuker: "Nuker",
  storage: "Storage"
}

export class BuildingPlanner extends React.Component{
  state: Readonly<{
    room: string
    shard: string
    terrain: TerrainMap
    x: number
    y: number
    shards: SelectOptions
    brush: string
    rcl: number
    structures: {
      [structure: string]: Array<{
        x: number
        y: number
      }>
    }
  }>

  constructor(props: any){
    super(props)

    let terrain: TerrainMap = {}

    for(let i = 0; i < 50; i++){
      terrain[i] = {}

      for(let j = 0; j < 50; j++){
        terrain[i][j] = 0
      }
    }

    this.state = {
      room: '',
      shard: 'shard0',
      terrain: terrain,
      x: 0,
      y: 0,
      shards: [],
      brush: 'spawn',
      rcl: 8,
      structures: {}
    }
  }

  componentDidMount(){
    let component = this

    jQuery.ajax({
      url: '/api/shards',
      dataType: 'json',
      success: (data: any) => {
        let shards: SelectOptions = []
        data.shards.forEach((shard: {name: string}) => {
          shards.push({label: shard.name, value: shard.name})
        })

        component.setState({shards: shards})
      }
    })

    let params = location.href.split('?')[1]
    let searchParams = new URLSearchParams(params)

    if(searchParams.get('share')){
      let json = LZString.decompressFromEncodedURIComponent(searchParams.get('share')!)

      this.loadJSON(JSON.parse(json))
    }
  }

  handleControlForm(values: {[field: string]: any}){
    let component = this

    jQuery.ajax({
      url: '/api/terrain/' + values.shard + '/' + values.room,
      dataType: 'json',
      success: (data: any) => {
        let terrain = data.terrain[0].terrain
        let terrainMap: TerrainMap = {}
        for (var y = 0; y < 50; y++) {
          terrainMap[y] = {}
          for (var x = 0; x < 50; x++) {
            let code = terrain.charAt(y * 50 + x)
            terrainMap[y][x] = code
          }
        }

        component.setState({terrain: terrainMap, room: values.room, shard: values.shard})
      }
    })
  }

  addStructure(x: number, y: number){
    let structures = this.state.structures
    let added = false

    if(!structures[this.state.brush]){
      structures[this.state.brush] = []
    }

    if(structures[this.state.brush].length < CONTROLLER_STRUCTURES[this.state.brush][this.state.rcl]){
      structures[this.state.brush].push({
        x: x,
        y: y
      })

      added = true
    }


    this.setState({structures: structures})
    return added
  }

  removeStructure(x: number, y: number, structure: string){
    let structures = this.state.structures

    if(structures[structure]){
      structures[structure] = _.filter(structures[structure], (pos) => {
        return !(pos.x === x && pos.y === y)
      })
    }

    this.setState({structures: structures})
  }

  json(){
    let buildings: {[structure: string]: {pos: Array<{x: number, y: number}>}} = {}

    let json = {
      name: this.state.room,
      shard: this.state.shard,
      rcl: this.state.rcl,
      buildings: buildings
    }

    Object.keys(this.state.structures).forEach((structure) => {
      if(!json.buildings[structure]){
        json.buildings[structure] = {
          pos: this.state.structures[structure]
        }
      }
    })

    return JSON.stringify(json)
  }

  setRCL(e: any){
    this.setState({rcl: e.target.value})
  }

  import(e: any){
    let json = JSON.parse(e.target.value)
    
    this.loadJSON(json)
  }

  loadJSON(json: any){
    let component = this

    if(json.shard && json.name){
      jQuery.ajax({
        url: '/api/terrain/' + json.shard + '/' + json.name,
        dataType: 'json',
        success: (data: any) => {
          let terrain = data.terrain[0].terrain
          let terrainMap: TerrainMap = {}
          for (var y = 0; y < 50; y++) {
            terrainMap[y] = {}
            for (var x = 0; x < 50; x++) {
              let code = terrain.charAt(y * 50 + x)
              terrainMap[y][x] = code
            }
          }

          component.setState({terrain: terrainMap})
        }
      })
    }

    let structures: {
      [structure: string]: Array<{
        x: number
        y: number
      }>
    } = {}

    Object.keys(json.buildings).forEach((structure) => {
      structures[structure] = json.buildings[structure].pos
    })

    component.setState({room: json.name, shard: json.shard, rcl: json.rcl, structures: structures})    
  }

  getStructure(x: number, y: number){
    let structure = ''

    Object.keys(this.state.structures).forEach((structureName) => {
      if(structureName != 'road' && structureName != 'rampart'){
        this.state.structures[structureName].forEach((pos) => {
          if(pos.x === x && pos.y === y){
            structure = structureName
          }
        })
      }
    })

    return structure
  }

  isRoad(x: number, y: number){
    let road = false

    if(this.state.structures.road){
      this.state.structures.road.forEach((pos) => {
        if(pos.x === x && pos.y === y){
          road = true
        }
      })
    }

    return road
  }

  isRampart(x: number, y: number){
    let road = false

    if(this.state.structures.rampart){
      this.state.structures.rampart.forEach((pos) => {
        if(pos.x === x && pos.y === y){
          road = true
        }
      })
    }

    return road
  }

  shareableLink(){
    let string = LZString.compressToEncodedURIComponent(this.json())
    return "https://admon.tk/#/building-planner/?share=" + string
  }

  render(){
    return <div className="buildingPlanner">
      <div className="map" style={{width: (window.innerHeight - 50) + 'px', height: (window.innerHeight - 50) + 'px'}}>
        {[...Array(50)].map((x: number, j) => {
          return <div className="row" key={j}>
            {[...Array(50)].map((y: number, i) => {
              return <MapCell
                x={i}
                y={j}
                terrain={this.state.terrain[j][i]}
                parent={this}
                structure={this.getStructure(i, j)}
                road={this.isRoad(i,j)}
                rampart={this.isRampart(i,j)}
                key={'mc-'+ i + '-' + j}
              />
            })}
          </div>
        })}
      </div>
      <div className="controls structures">
        <h4>Building Tools:</h4>
        <div>
          <div className="half-col">
            X= {this.state.x} , Y= {this.state.y}
          </div>
          <div className="half-col">
            RCL: <select value={this.state.rcl} onChange={(e) => this.setRCL(e)}>
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
              <option value={5}>5</option>
              <option value={6}>6</option>
              <option value={7}>7</option>
              <option value={8}>8</option>
            </select>
          </div>
        </div>
        <ul className="brushes">
          {Object.keys(STRUCTURES).map((key) => {
            return <li onClick={() => this.setState({brush: key})} className={this.state.brush === key ? 'active' : ''} key={key}>
              <img src={'/img/screeps/' + key + '.png'} /> {STRUCTURES[key]} <span>{this.state.structures[key] ? this.state.structures[key].length : 0}/{CONTROLLER_STRUCTURES[key][this.state.rcl]}</span>
            </li>
          })}
        </ul>
      </div>
      <div className="controls room">
        <Form onSubmit={(values, e, formApi) => this.handleControlForm(values)}>
          {
            formApi =>
              <form onSubmit={formApi.submitForm}>
                <h4>Import Room:</h4>
                <table>
                  <tr>
                    <td><label>Shard:</label></td>
                    <td><Select field='shard' id='shard' options={this.state.shards} /></td>
                  </tr>
                  <tr>
                    <td><label>Room:</label></td>
                    <td><Text field='room' id='room' /></td>
                  </tr>
                  <tr>
                    <td></td>
                    <td><button type='submit' id='load-terrain'>Load Terrain</button></td>
                  </tr>
                </table>
              </form>
          }
        </Form>
        <br/>
        <h4>JSON:</h4>
        <textarea value={this.json()} id="json-data" onChange={(e) => this.import(e)}></textarea>
        <a href={this.shareableLink()} id="share-link">Shareable Link</a>
      </div>
    </div>
  }
}

interface MapCellProps{
  x: number
  y: number
  terrain: number
  parent: BuildingPlanner
  structure: string
  road: boolean
  rampart: boolean
}

class MapCell extends React.Component<MapCellProps>{
  state: Readonly<{
    hover: boolean
    structure: string
    road: boolean
    rampart: boolean
  }>

  constructor(props: MapCellProps){
    super(props)

    this.state = {
      hover: false,
      structure: this.props.structure,
      road: this.props.road,
      rampart: this.props.rampart
    }
  }

  componentWillReceiveProps(newProps: MapCellProps){
    this.setState({
      structure: newProps.structure,
      road: newProps.road,
      rampart: newProps.rampart
    })
  }

  mouseEnter(e: any){
    this.setState({hover: true})
    this.props.parent.setState({x: parseInt(e.target.dataset.x), y: parseInt(e.target.dataset.y)})
  }

  className(){
    let className = ''

    if(this.state.hover){
      className += 'hover '
    }

    if(this.state.structure !== ''){
      className += this.state.structure + ' '
    }

    if(this.state.road){
      className += 'road '
    }

    if(this.state.rampart){
      className += 'rampart '
    }

    if(this.props.terrain & 1){
      return className + 'cell wall'
    }else if(this.props.terrain & 2){
      return className + 'cell swamp'
    }else{
      return className + 'cell plain'
    }
  }

  mouseLeave(e: any){
    this.setState({hover: false})
  }

  onClick(){
    if(this.state.structure !== ''){
      this.props.parent.removeStructure(this.props.x, this.props.y, this.state.structure)
    }

    if(this.props.parent.addStructure(this.props.x, this.props.y)){
      switch(this.props.parent.state.brush){
        case('road'):
          this.setState({road: true})
        break;
        case('rampart'):
          this.setState({rampart: true})
        break;
        default:
          this.setState({structure: this.props.parent.state.brush})
        break;
      }
    }
  }

  onContextMenu(e: any){
    e.preventDefault()

    if(this.state.structure !== '' || this.state.road || this.state.rampart){
      this.props.parent.removeStructure(this.props.x, this.props.y, this.state.structure)
      this.props.parent.removeStructure(this.props.x, this.props.y, 'rampart')
      this.props.parent.removeStructure(this.props.x, this.props.y, 'road')
      

      this.setState({structure: '', road: false, rampart: false})
    }
  }

  render(){
    return <div
      className={this.className()}
      onMouseEnter={this.mouseEnter.bind(this)}
      onMouseLeave={this.mouseLeave.bind(this)}
      onClick={this.onClick.bind(this)}
      onContextMenu={this.onContextMenu.bind(this)}
      data-x={this.props.x}
      data-y={this.props.y}
    >
      &nbsp;
    </div>
  }
}