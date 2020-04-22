import * as React from 'react';
import {Form, Text, Select} from 'react-form';
import * as _ from 'lodash';
import * as LZString from 'lz-string';

interface TerrainMap {
    [x: number]: {
        [y: number]: number
    }
};

type SelectOptions = Array<{
    value: string
    label: string
}>;

interface StructureList{
    [structure: string]: {
        [level: number]: number
    }
};

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
    "nuker": { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 1 },
    "factory": { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 1, 8: 1 }
};

const STRUCTURES: {[structure: string]: string} = {
    spawn: "Spawn",
    container: "Container",
    extension: "Extension",
    tower: "Tower",
    storage: "Storage",
    link: "Link",
    terminal: "Terminal",
    extractor: "Extractor",
    lab: "Lab",
    factory: "Factory",
    observer: "Observer",
    powerSpawn: "Power Spawn",
    nuker: "Nuker",
    rampart: "Rampart",
    constructedWall: "Wall",
    road: "Road",
};

export class BuildingPlanner extends React.Component {
    state: Readonly<{
        room: string;
        shard: string;
        terrain: TerrainMap;
        x: number;
        y: number;
        shards: SelectOptions;
        brush: string;
        rcl: number;
        structures: {
            [structure: string]: Array<{
                x: number
                y: number
            }>
        };
    }>;

    constructor(props: any) {
        super(props);

        let terrain: TerrainMap = {};

        for (let i = 0; i < 50; i++) {
            terrain[i] = {};

            for (let j = 0; j < 50; j++) {
                terrain[i][j] = 0;
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
        };
    }

    componentDidMount() {
        let component = this;

        fetch('/api/shards').then((response) => {
            response.json().then((data: any) => {
                let shards: SelectOptions = [];
                data.shards.forEach((shard: {name: string}) => {
                    shards.push({label: shard.name, value: shard.name});
                })

                component.setState({shards: shards});
            });
        });

        let params = location.href.split('?')[1];
        let searchParams = new URLSearchParams(params);

        if (searchParams.get('share')) {
            let json = LZString.decompressFromEncodedURIComponent(searchParams.get('share')!);
            if (json) {
                this.loadJSON(JSON.parse(json));
            }
        }
    }

    handleControlForm(values: {[field: string]: any}) {
        let component = this;

        fetch(`/api/terrain/${values.shard}/${values.room}`).then((response) => {
            response.json().then((data: any) => {
                let terrain = data.terrain[0].terrain;
                let terrainMap: TerrainMap = {};
                for (var y = 0; y < 50; y++) {
                    terrainMap[y] = {};
                    for (var x = 0; x < 50; x++) {
                        let code = terrain.charAt(y * 50 + x);
                        terrainMap[y][x] = code;
                    }
                }

                component.setState({terrain: terrainMap, room: values.room, shard: values.shard});
            });
        });
    }

    addStructure(x: number, y: number) {
        let structures = this.state.structures;
        let added = false;

        if (CONTROLLER_STRUCTURES[this.state.brush][this.state.rcl] && x > 0 && x < 49 && y > 0 && y < 49) {
            if (!structures[this.state.brush]) {
                structures[this.state.brush] = [];
            }

            if (structures[this.state.brush].length < CONTROLLER_STRUCTURES[this.state.brush][this.state.rcl]) {
                structures[this.state.brush].push({
                    x: x,
                    y: y
                });

                added = true;
            }
        }

        this.setState({structures: structures});
        return added;
    }

    removeStructure(x: number, y: number, structure: string) {
        let structures = this.state.structures;

        if (structures[structure]) {
            structures[structure] = _.filter(structures[structure], (pos) => {
                return !(pos.x === x && pos.y === y);
            })
        }

        this.setState({structures: structures});
    }

    json() {
        let buildings: {[structure: string]: {pos: Array<{x: number, y: number}>}} = {};

        let json = {
            name: this.state.room,
            shard: this.state.shard,
            rcl: this.state.rcl,
            buildings: buildings
        };

        Object.keys(this.state.structures).forEach((structure) => {
            if (!json.buildings[structure]) {
                json.buildings[structure] = {
                    pos: this.state.structures[structure]
                };
            }
        });

        return JSON.stringify(json);
    }

    setRCL(e: any) {
        this.setState({rcl: e.target.value});
    }

    import(e: any) {
        let json = JSON.parse(e.target.value);
        
        this.loadJSON(json);
    }

    loadJSON(json: any) {
        let component = this;

        if (json.shard && json.name) {
            fetch(`/api/terrain/${json.shard}/${json.name}`).then((response) => {
                response.json().then((data: any) => {
                    let terrain = data.terrain[0].terrain;
                    let terrainMap: TerrainMap = {};
                    for (var y = 0; y < 50; y++) {
                        terrainMap[y] = {};
                        for (var x = 0; x < 50; x++) {
                            let code = terrain.charAt(y * 50 + x);
                            terrainMap[y][x] = code;
                        }
                    }

                    component.setState({terrain: terrainMap});
                });
            });
        }

        let structures: {
            [structure: string]: Array<{
                x: number;
                y: number;
            }>
        } = {};

        Object.keys(json.buildings).forEach((structure) => {
            structures[structure] = json.buildings[structure].pos;
        });

        component.setState({room: json.name, shard: json.shard, rcl: json.rcl, structures: structures});   
    }

    getRoadProps(x: number, y: number) {
        let roadProps = {
            middle: false,
            top: false,
            top_right: false,
            right: false,
            bottom_right: false,
            bottom: false,
            bottom_left: false,
            left: false,
            top_left: false
        };
        if (this.isRoad(x,y)) {
            roadProps.middle = true;
            for (let rx of [-1, 0, 1]) {
                for (let ry of [-1, 0, 1]) {
                    if (rx === 0 && ry === 0) continue;
                    if (this.isRoad(x + rx, y + ry)) {
                        if (rx === -1 && ry === -1) {
                            roadProps.top_left = true;
                        } else if (rx === 0 && ry === -1) {
                            roadProps.top = true;
                        } else if (rx === 1 && ry === -1) {
                            roadProps.top_right = true;
                        } else if (rx === 1 && ry === 0) {
                            roadProps.right = true;
                        } else if (rx === 1 && ry === 1) {
                            roadProps.bottom_right = true;
                        } else if (rx === 0 && ry === 1) {
                            roadProps.bottom = true;
                        } else if (rx === -1 && ry === 1) {
                            roadProps.bottom_left = true;
                        } else if (rx === -1 && ry === 0) {
                            roadProps.left = true;
                        }
                    }
                }
            }
        }
        return roadProps;
    }

    getStructure(x: number, y: number) {
        let structure = '';
        Object.keys(this.state.structures).forEach((structureName) => {
            if (structureName != 'road' && structureName != 'rampart') {
                this.state.structures[structureName].forEach((pos) => {
                    if (pos.x === x && pos.y === y) {
                        structure = structureName;
                    }
                });
            }
        });
        return structure;
    }

    isRoad(x: number, y: number) {
        let road = false;
        if (this.state.structures.road) {
            this.state.structures.road.forEach((pos) => {
                if (pos.x === x && pos.y === y) {
                    road = true;
                }
            });
        }
        return road;
    }

    isRampart(x: number, y: number) {
        let rampart = false;
        if (this.state.structures.rampart) {
            this.state.structures.rampart.forEach((pos) => {
                if (pos.x === x && pos.y === y) {
                    rampart = true;
                }
            });
        }
        return rampart;
    }

    shareableLink() {
        let string = LZString.compressToEncodedURIComponent(this.json());
        return "/building-planner/?share=" + string;
    }

    render() {
        return (
            <div className="buildingPlanner">
                <div className="map">
                    {[...Array(50)].map((x: number, j) => {
                        return <div className="row" key={j}>
                            {[...Array(50)].map((y: number, i) => {
                                return <MapCell
                                    x={i}
                                    y={j}
                                    terrain={this.state.terrain[j][i]}
                                    parent={this}
                                    structure={this.getStructure(i, j)}
                                    road={this.getRoadProps(i, j)}
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
                            x: {this.state.x}, y: {this.state.y}
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
                            let classes = '';
                            if (this.state.brush === key) {
                                classes += 'active ';
                            }
                            if (CONTROLLER_STRUCTURES[key][this.state.rcl] === 0) {
                                classes += 'disabled';
                            }
                            return <li onClick={() => this.setState({brush: key})} className={classes} key={key}>
                                <img src={'/img/screeps/' + key + '.png'} /> {STRUCTURES[key]} <span>{this.state.structures[key] ? this.state.structures[key].length : 0}/{CONTROLLER_STRUCTURES[key][this.state.rcl]}</span>
                            </li>
                        })}
                    </ul>
                </div>
                <div className="controls room">
                    <Form onSubmit={(values, e, formApi) => this.handleControlForm(values)}>
                        {formApi => (
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
                        )}
                    </Form>
                    <br/>
                    <h4>JSON:</h4>
                    <textarea value={this.json()} id="json-data" onChange={(e) => this.import(e)}></textarea>
                    <a href={this.shareableLink()} id="share-link">Shareable Link</a>
                </div>
            </div>
        );
    }
}

interface MapCellProps {
    x: number;
    y: number;
    terrain: number;
    parent: BuildingPlanner;
    structure: string;
    road: {
        middle: boolean;
        top: boolean;
        top_right: boolean;
        right: boolean;
        bottom_right: boolean;
        bottom: boolean;
        bottom_left: boolean;
        left: boolean;
        top_left: boolean;
    };
    rampart: boolean;
};

class MapCell extends React.Component<MapCellProps> {
    state: Readonly<{
        hover: boolean;
        structure: string;
        road: {
            middle: boolean;
            top: boolean;
            top_right: boolean;
            right: boolean;
            bottom_right: boolean;
            bottom: boolean;
            bottom_left: boolean;
            left: boolean;
            top_left: boolean;
        };
        rampart: boolean;
    }>;

    constructor(props: MapCellProps) {
        super(props);

        this.state = {
            hover: false,
            structure: this.props.structure,
            road: {
                middle: this.props.road.middle,
                top: this.props.road.top,
                top_right: this.props.road.top_right,
                right: this.props.road.right,
                bottom_right: this.props.road.bottom_right,
                bottom: this.props.road.bottom,
                bottom_left: this.props.road.bottom_left,
                left: this.props.road.left,
                top_left: this.props.road.top_left,
            },
            rampart: this.props.rampart
        };
    }

    componentWillReceiveProps(newProps: MapCellProps) {
        this.setState({
            structure: newProps.structure,
            road: newProps.road,
            rampart: newProps.rampart
        });
    }

    mouseEnter(e: any) {
        // update this.state.x and this.state.y
        this.setState({hover: true});
        this.props.parent.setState({
            x: parseInt(e.currentTarget.dataset.x),
            y: parseInt(e.currentTarget.dataset.y)
        });
    }

    getCellContent() {
        let content = [];

        switch (this.state.structure) {
            case 'spawn':
                content.push(<img src="/img/screeps/spawn.png" />);
                break;
            
            case 'extension':
                content.push(<img src="/img/screeps/extensions.png" />);
                break;
            
            case 'link':
                content.push(<img src="/img/screeps/link.png" />);
                break;
            
            case 'constructedWall':
                content.push(<img src="/img/screeps/constructedWall.png" />);
                break;
            
            case 'tower':
                content.push(<img src="/img/screeps/tower.png" />);
                break;
            
            case 'observer':
                content.push(<img src="/img/screeps/observer.png" />);
                break;
            
            case 'powerSpawn':
                content.push(<img src="/img/screeps/powerSpawn.png" />);
                break;
            
            case 'extractor':
                content.push(<img src="/img/screeps/extractor.png" />);
                break;
            
            case 'terminal':
                content.push(<img src="/img/screeps/terminal.png" />);
                break;
            
            case 'lab':
                content.push(<img src="/img/screeps/lab.png" />);
                break;
            
            case 'container':
                content.push(<img src="/img/screeps/container.png" />);
                break;
            
            case 'nuker':
                content.push(<img src="/img/screeps/nuker.png" />);
                break;
            
            case 'storage':
                content.push(<img src="/img/screeps/storage.png" />);
                break;
            
            case 'factory':
                content.push(<img src="/img/screeps/factory.png" />);
                break;
        }

        if (this.state.road.middle) {
            content.push(<svg height="2%" width="100%">
                <circle cx="50%" cy="50%" r="1" fill="#6b6b6b" />
            </svg>);
        }
        if (this.state.road.top_left) {
            content.push(<svg height="2%" width="100%">
                <line x1="0" y1="0" x2="50%" y2="50%" stroke="#6b6b6b" strokeWidth={2} />
            </svg>);
        }
        if (this.state.road.top) {
            content.push(<svg height="2%" width="100%">
                <line x1="50%" y1="0" x2="50%" y2="50%" stroke="#6b6b6b" strokeWidth={2} />
            </svg>);
        }
        if (this.state.road.top_right) {
            content.push(<svg height="2%" width="100%">
                <line x1="100%" y1="0" x2="50%" y2="50%" stroke="#6b6b6b" strokeWidth={2} />
            </svg>);
        }
        if (this.state.road.right) {
            content.push(<svg height="2%" width="100%">
                <line x1="100%" y1="50%" x2="50%" y2="50%" stroke="#6b6b6b" strokeWidth={2} />
            </svg>);
        }
        if (this.state.road.bottom_right) {
            content.push(<svg height="2%" width="100%">
                <line x1="100%" y1="100%" x2="50%" y2="50%" stroke="#6b6b6b" strokeWidth={2} />
            </svg>);
        }
        if (this.state.road.bottom) {
            content.push(<svg height="2%" width="100%">
                <line x1="50%" y1="100%" x2="50%" y2="50%" stroke="#6b6b6b" strokeWidth={2} />
            </svg>);
        }
        if (this.state.road.bottom_left) {
            content.push(<svg height="2%" width="100%">
                <line x1="0" y1="100%" x2="50%" y2="50%" stroke="#6b6b6b" strokeWidth={2} />
            </svg>);
        }
        if (this.state.road.left) {
            content.push(<svg height="2%" width="100%">
                <line x1="0" y1="50%" x2="50%" y2="50%" stroke="#6b6b6b" strokeWidth={2} />
            </svg>);
        }

        return (content.length ? content : ' ');
    }

    className() {
        let className = '';

        if (this.state.hover) {
            className += 'hover ';
        }

        if (this.state.structure !== '') {
            className += this.state.structure + ' ';
        }

        if (this.state.road.middle) {
            className += 'road ';
        }

        if (this.state.rampart) {
            className += 'rampart ';
        }

        if (this.props.terrain & 1) {
            return className + 'cell wall';
        } else if (this.props.terrain & 2) {
            return className + 'cell swamp';
        } else {
            return className + 'cell plain';
        }
    }

    mouseLeave(e: any) {
        this.setState({hover: false});
    }

    onClick() {
        if (this.props.parent.addStructure(this.props.x, this.props.y)) {
            switch (this.props.parent.state.brush) {
                case('road'):
                    this.setState({road: true});
                    break;
                case('rampart'):
                    this.setState({rampart: true});
                    break;
                default:
                    this.setState({structure: this.props.parent.state.brush});
                    break;
            }
        }
    }

    onContextMenu(e: any) {
        e.preventDefault();

        if (this.state.structure !== '' || this.state.road || this.state.rampart) {
            this.props.parent.removeStructure(this.props.x, this.props.y, this.state.structure);
            this.props.parent.removeStructure(this.props.x, this.props.y, 'rampart');
            this.props.parent.removeStructure(this.props.x, this.props.y, 'road');
            
            this.setState({structure: '', road: false, rampart: false})
        }
    }

    render() {
        return (
            <div className={this.className()}
                onMouseEnter={this.mouseEnter.bind(this)}
                onMouseLeave={this.mouseLeave.bind(this)}
                onClick={this.onClick.bind(this)}
                onContextMenu={this.onContextMenu.bind(this)}
                data-x={this.props.x}
                data-y={this.props.y}>
                {this.getCellContent()}
            </div>
        );
    }
}