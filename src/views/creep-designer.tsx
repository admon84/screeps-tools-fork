import * as React from 'react';

export class CreepDesigner extends React.Component{
    state: Readonly <{
        unitCount: number;
        tickTime: number;
        body: {[part: string]: number};
        boost: {[part: string]: string | null};
        controller: number;
        structures: {[structureType: string]: number};
    }>;
    
    constructor(props: any) {
        super(props);
        
        this.state = {
            unitCount: 1,
            tickTime: 3,
            body: {
                move: 1,
                work: 0,
                attack: 0,
                ranged_attack: 0,
                tough: 0,
                heal: 0,
                claim: 0,
                carry: 0
            },
            boost: {
                move: null,
                work: null,
                attack: null,
                ranged_attack: null,
                tough: null,
                heal: null,
                claim: null,
                carry: null
            },
            controller: 8,
            structures: {
                spawn: 3,
                extensions: 60
            }
        };
        
        if (!props.api) {
            let params = location.href.split('?')[1];
            let searchParams = new URLSearchParams(params);
            
            if (searchParams.get('share')) {
                let body = searchParams.get('share')!;
                let creepBody = this.state.body;
                let i = 0;
                body.split(":").forEach((count) => {
                    creepBody[Object.keys(BODYPARTS)[i]] = parseInt(count);
                    i += 1;
                });
                
                this.setState({body: creepBody});
            }
        }
    }
    
    removeBodyPart(part: string, clearAll: boolean = false) {
        let body = this.state.body;
        
        if (body[part]) {
            if (clearAll) {
                body[part] = 0;
            } else {
                body[part] -= 1;
            }
        }
        
        this.setState({body: body});
    }
    
    addBodyPart(part: string, count: number) {
        let body = this.state.body;
        
        if (this.countParts() < 50 && (this.totalCost() + BODYPART_COST[part]) < RCL_ENERGY[8]) {
            let max = (50 - this.countParts());
            if (this.countParts() + count > 50) {
                count = max;
            }

            if (body[part]) {
                body[part] += count;
            } else {
                body[part] = count;
            }
        }
        
        this.setState({body: body});
    }
    
    partCost(part: string) {
        let cost = 0;
        let component = this;
        
        if (part && BODYPART_COST[part]) {
            cost = (component.state.body[part] * BODYPART_COST[part]);
        }
        
        return cost;
    }
    
    totalCost() {
        let cost = 0;
        let component = this;
        
        Object.keys(BODYPARTS).forEach((part) => {
            cost += (component.state.body[part] * BODYPART_COST[part]);
        })
        
        return cost;
    }
    
    countParts() {
        let count = 0;
        let component = this;
        
        Object.keys(BODYPARTS).forEach((part) => {
            count += component.state.body[part];
        })
        
        return count;
    }
    
    body() {
        let body = '[';
        
        Object.keys(BODYPARTS).forEach((part) => {
            for (let i = 0; i < this.state.body[part]; i++) {
                body += BODYPARTS[part] + ',';
            }
        })
        
        return body.slice(0, -1) + ']';
    }
    
    shareLink() {
        let counts: number[] = [];
        
        Object.keys(BODYPARTS).forEach((part) => {
            counts.push(this.state.body[part]);
        });
        
        return "/creep-designer/?share=" + counts.join(':');
    }
    
    creepLifespan() {
        if (this.state.body.claim > 0) {
            return 500;
        } else {
            return 1500;
        }
    }

    ticksPerHour() {
        // 60 seconds * 60 minutes (1 hour) = 3600 seconds
        return Math.floor(3600 / this.state.tickTime);
    }

    ticksPerDay() {
        // 60 seconds * 60 minutes * 24 hours (1 day) = 86400 seconds
        return Math.floor(86400 / this.state.tickTime);
    }
    
    requiredRCL() {
        let rcl = 8;
        let cost = this.totalCost();
        Object.keys(RCL_ENERGY).reverse().forEach((rclLevel) => {
            if (cost <= RCL_ENERGY[parseInt(rclLevel)]) {
                rcl = parseInt(rclLevel);
            }
        });
        
        return rcl;
    }
    
    import(e: any) {
        let data = e.target.value;
        let body = this.state.body;
        
        Object.keys(BODYPARTS).forEach((part) => {
            body[part] = (data.match(new RegExp(BODYPARTS[part], 'g')) || []).length
        });
        
        if (!e.noState) {
            this.setState({body: body});
        }
    }
    
    setBodyPart(e: any, part: string) {
        let value = e.target.value;
        let body = this.state.body;
        
        body[part] = parseInt(value);
        
        this.setState({body: body});
    }

    boostOptions(part: string) {
        let options: React.ReactFragment[] = [];
        if (BOOSTS[part] !== undefined) {
            options.push(<option value="">&minus;</option>);
            for (let resource of Object.keys(BOOSTS[part])) {
                options.push(<option value={resource}>{resource}</option>);
            }
        }
        return options;
    }

    handleBoostChange(e: any, part: string) {
        let boost = this.state.boost;
        let resource = e.target.value && e.target.value || null;
        boost[part] = resource;

        this.setState({boost: boost});
    }

    getActionValueFormatted(part: string, action: string, partMultiplier: number, timeMultiplier: number = 1) {
        return this.formatNumber(this.getActionValue(part, action, partMultiplier, timeMultiplier), 2);
    }

    getActionValue(part: string, action: string, partMultiplier: number, timeMultiplier: number = 1) {
        let partCount = this.state.body[part];
        let returnValue = ((partCount * partMultiplier) * timeMultiplier);

        if (BOOSTS[part] !== undefined) {
            let boostType = this.state.boost[part];
            if (boostType !== null && BOOSTS[part][boostType][action] !== undefined) {
                returnValue *= BOOSTS[part][boostType][action];
            }
        }

        return returnValue;
    }
    
    walkTimeFull(move: number, carry: number, multiplier: number) {
        let time = 0;
        
        if (carry === 0) {
            return 0;
        }
        
        if (move > 0) {
            let incrementer = 1;
            let boostType = this.state.boost['move'];
            if (boostType !== null && BOOSTS['move'][boostType]['fatigue'] !== undefined) {
                incrementer = BOOSTS['move'][boostType]['fatigue'];
            }

            let movePercent = (move / this.countParts());
            let moveIncrementer = (1 / ((move * incrementer) / (this.countParts() - carry)));
            let subtract = (movePercent * moveIncrementer);
            let moveQuality = Math.ceil(moveIncrementer - subtract);
            
            time = Math.ceil(moveQuality * multiplier);
            time = time > 1 ? time : 1;
        }
        
        return time;
    }
    
    walkTimeEmpty(move: number, carry: number, multiplier: number) {
        let time = 0;
        
        if (move > 0) {
            let incrementer = 1;
            let boostType = this.state.boost['move'];
            if (boostType !== null && BOOSTS['move'][boostType]['fatigue'] !== undefined) {
                incrementer = BOOSTS['move'][boostType]['fatigue'];
            }

            let movePercent = (move / (this.countParts() - carry));
            let moveIncrementer = (1 / ((move * incrementer) / (this.countParts() - carry)));
            let subtract = (movePercent * moveIncrementer);
            let moveQuality = Math.ceil(moveIncrementer - subtract);
            
            time = Math.ceil(moveQuality * multiplier);
            time = time > 1 ? time : 1;
        }
        
        return time;
    }

    formatNumber(num: number, digits: number) {
        const units = [
            { value: 1, symbol: "" },
            { value: 1E3, symbol: "k" },
            { value: 1E6, symbol: "M" },
            { value: 1E9, symbol: "G" },
            { value: 1E12, symbol: "T" },
            { value: 1E15, symbol: "P" },
            { value: 1E18, symbol: "E" }
        ];
        let i;
        for (i = units.length - 1; i > 0; i--) {
            if (num >= units[i].value) {
                break;
            }
        }
        let rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
        return (num / units[i].value).toFixed(digits).replace(rx, "$1") + units[i].symbol;
    }

    changeTickTime(e: any) {
        const amount = e.target.value;

        if (!amount || amount.match(/^\d{1,}(\.\d{0,4})?$/)) {
            this.setState({tickTime: amount });
        }
    }

    getEnergyCapacity(type: string) {
        if (type == 'spawn') {
            return SPAWN_ENERGY_CAPACITY;
        } else if (type == 'extension') {
            return EXTENSION_ENERGY_CAPACITY[this.state.controller];
        }
        return 0;
    }
    
    setStructure(e: any, type: string) {
        let value = e.target.value;
        let structures = this.state.structures;
        
        structures[type] = parseInt(value);
        
        this.setState({structures: structures});
    }
    
    removeStructure(type: string, clearAll: boolean = false) {
        let structures = this.state.structures;
        
        if (structures[type]) {
            if (clearAll) {
                structures[type] = 0;
            } else {
                structures[type] -= 1;
            }
        }

        if (structures[type] < 0) {
            structures[type] = 0;
        }
        
        this.setState({structures: structures});
    }
    
    addStructure(type: string, count: number) {
        let structures = this.state.structures;
        
        if (structures[type]) {
            structures[type] += count;
        } else {
            structures[type] = count;
        }

        let max = CONTROLLER_STRUCTURES[type][this.state.controller];
        if (max !== undefined && structures[type] > max) {
            structures[type] = max;
        }
        
        this.setState({structures: structures});
    }
    
    structureSum(type: string) {
        let sum = 0;
        let component = this;
        let energyCapacity = this.getEnergyCapacity(type);
        
        if (type && BODYPART_COST[type]) {
            sum = (component.state.structures[type] * energyCapacity);
        }
        
        return sum;
    }
    
    totalBalance() {
        let component = this;
        let totalCost = this.totalCost();

        Object.keys(CONTROLLER_STRUCTURES).forEach(type => {
            totalCost -= component.structureSum(type);
        });
        
        return totalCost;
    }
    
    render() {
        return (
            <div className="creep-designer">
                <div className="panel">
                    <table className="body">
                        <thead>
                            <tr>
                                <th>Part/Struct</th>
                                <th>Energy</th>
                                <th>Count</th>
                                <th>Boost</th>
                                <th>Sum</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.keys(BODYPARTS).map(part => {
                                return (
                                    <tr key={part} className={this.state.body[part] > 0 ? 'active-parts' : ''}>
                                        <td className="part">{BODYPARTS[part]} </td>
                                        <td className="price">{BODYPART_COST[part]}</td>
                                        <td>
                                            <button onClick={() => this.removeBodyPart(part, true)}>min</button>
                                            <button onClick={() => this.removeBodyPart(part)}>-</button>
                                            <input type="text" className="count" value={this.state.body[part] ? this.state.body[part] : 0} onChange={(e) => this.setBodyPart(e, part)} />
                                            <button onClick={() => this.addBodyPart(part, 1)}>+</button>
                                            <button onClick={() => this.addBodyPart(part, 5)}>+5</button>
                                        </td>
                                        <td className="text-center">
                                            {BOOSTS[part] !== undefined && <select className="boost" onChange={(e) => this.handleBoostChange(e, part)}>
                                                {this.boostOptions(part)}
                                            </select>}
                                        </td>
                                        <td className="sum">{this.partCost(part) ? this.partCost(part) : '0'}</td>
                                    </tr>
                                );
                            })}
                            {Object.keys(CONTROLLER_STRUCTURES).map(type => {
                                return (
                                    <tr key={type} className={this.state.structures[type] > 0 ? 'active-struct' : ''}>
                                        <td className="part">{type}</td>
                                        <td className="price">{this.getEnergyCapacity(type)}</td>
                                        <td>
                                            <button onClick={() => this.removeStructure(type, true)}>min</button>
                                            <button onClick={() => this.removeStructure(type)}>-</button>
                                            <input type="text" className="count" value={this.state.structures[type] ? this.state.structures[type] : 0} onChange={(e) => this.setStructure(e, type)} />
                                            <button onClick={() => this.addStructure(type, 1)}>+</button>
                                            {type !== 'spawn' && <button onClick={() => this.addStructure(type, 5)}>+5</button>}
                                        </td>
                                        <td></td>
                                        <td className="sum">{this.structureSum(type) ? this.structureSum(type) : '0'}</td>
                                    </tr>
                                );
                            })}
                            <tr>
                                <td><b>Units:</b></td>
                                <td>
                                    <input type="text" className="unitCount" value={this.state.unitCount} pattern="[0-9]*" onChange={(e) => this.setState({unitCount: e.target.value.replace(/\D/,'')})} />
                                </td>
                                <td className="text-center"><b>{this.countParts()}</b></td>
                                <td className="sum">sum:</td>
                                <td className="sum total">{this.totalCost() ? this.formatNumber(this.totalCost(), 2) : '0'}</td>
                            </tr>
                            <tr>
                                <td>Controller:</td>
                                <td><input type="text" /></td>
                                <td></td>
                                <td className="sum">balance:</td>
                                <td className="sum total">{this.totalBalance() ? this.formatNumber(this.totalBalance(), 2) : '0'}</td>
                            </tr>
                            <tr>
                                <td>Tick Duration:</td>
                                <td colSpan={4}><input type="text" className="tickTime" value={this.state.tickTime} onChange={(e) => this.changeTickTime(e)} /> (sec)</td>
                            </tr>
                        </tbody>
                    </table>
                    <Creep body={this.state.body} />
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
                    <textarea id='creep-body' value={this.body()} onChange={(e) => this.import(e)}></textarea>
                    <a href={this.shareLink()}>Shareable Link</a>
                </div>
                {this.countParts() > 0 && <div className="panel">
                    <table className="stats">
                        <tbody>
                        <tr style={{backgroundColor: '#efefef', color: '#444'}}>
                            <td>Health</td>
                            <td colSpan={4} className="text-center">{(this.countParts() * 100).toLocaleString()} {(this.state.body.tough > 0 ? '(from TOUGH: ' + (this.state.body.tough * 100).toLocaleString() + ')' : '')}</td>
                        </tr>
                        {this.state.body.work > 0 && <tr style={{backgroundColor: '#ffe56d', color: '#444'}}>
                            <td>Harvest (Energy)</td>
                            <td className="text-center">{this.getActionValueFormatted('work', 'harvest', 2)}/T</td>
                            <td className="text-center">{this.getActionValueFormatted('work', 'harvest', 2, this.creepLifespan())}/life</td>
                            <td className="text-center">{this.getActionValueFormatted('work', 'harvest', 2, this.ticksPerHour())}/hr</td>
                            <td className="text-center">{this.getActionValueFormatted('work', 'harvest', 2, this.ticksPerDay())}/day</td>
                        </tr>}
                        {this.state.body.work > 0 && <tr style={{backgroundColor: '#ffe56d', color: '#444'}}>
                            <td>Ticks to Empty Source</td>
                            <td colSpan={4} className="text-center">{Math.ceil(3000 / this.getActionValue('work', 'harvest', 2)).toLocaleString()}</td>
                        </tr>}
                        {this.state.body.work > 0 && <tr style={{backgroundColor: '#ffe56d', color: '#444'}}>
                            <td>Harvest (Mineral)</td>
                            <td className="text-center">{this.getActionValueFormatted('work', 'harvest', 1)}/T</td>
                            <td className="text-center">{this.getActionValueFormatted('work', 'harvest', 1, this.creepLifespan())}/life</td>
                            <td className="text-center">{this.getActionValueFormatted('work', 'harvest', 1, this.ticksPerHour())}/hr</td>
                            <td className="text-center">{this.getActionValueFormatted('work', 'harvest', 1, this.ticksPerDay())}/day</td>
                        </tr>}
                        {this.state.body.work > 0 && <tr style={{backgroundColor: '#ffe56d', color: '#444'}}>
                            <td>Upgrade Controller</td>
                            <td className="text-center">{this.getActionValueFormatted('work', 'upgradeController', 1)}/T</td>
                            <td className="text-center">{this.getActionValueFormatted('work', 'upgradeController', 1, this.creepLifespan())}/life</td>
                            <td className="text-center">{this.getActionValueFormatted('work', 'upgradeController', 1, this.ticksPerHour())}/hr</td>
                            <td className="text-center">{this.getActionValueFormatted('work', 'upgradeController', 1, this.ticksPerDay())}/day</td>
                        </tr>}
                        {this.state.body.work > 0 && <tr style={{backgroundColor: '#ffe56d', color: '#444'}}>
                            <td>Build</td>
                            <td className="text-center">{this.getActionValueFormatted('work', 'build', 5)}/T</td>
                            <td className="text-center">{this.getActionValueFormatted('work', 'build', 5, this.creepLifespan())}/life</td>
                            <td className="text-center">{this.getActionValueFormatted('work', 'build', 5, this.ticksPerHour())}/hr</td>
                            <td className="text-center">{this.getActionValueFormatted('work', 'build', 5, this.ticksPerDay())}/day</td>
                        </tr>}
                        {this.state.body.work > 0 && <tr style={{backgroundColor: '#ffe56d', color: '#444'}}>
                            <td>Dismantle</td>
                            <td className="text-center">{this.getActionValueFormatted('work', 'dismantle', 50)}/T</td>
                            <td className="text-center">{this.getActionValueFormatted('work', 'dismantle', 50, this.creepLifespan())}/life</td>
                            <td className="text-center">{this.getActionValueFormatted('work', 'dismantle', 50, this.ticksPerHour())}/hr</td>
                            <td className="text-center">{this.getActionValueFormatted('work', 'dismantle', 50, this.ticksPerDay())}/day</td>
                        </tr>}
                        {this.state.body.attack > 0 && <tr style={{backgroundColor: '#f93842', color: '#fff'}}>
                            <td>Attack</td>
                            <td className="text-center">{this.getActionValueFormatted('attack', 'attack', 30)}/T</td>
                            <td className="text-center">{this.getActionValueFormatted('attack', 'attack', 30, this.creepLifespan())}/life</td>
                            <td className="text-center">{this.getActionValueFormatted('attack', 'attack', 30, this.ticksPerHour())}/hr</td>
                            <td className="text-center">{this.getActionValueFormatted('attack', 'attack', 30, this.ticksPerDay())}/day</td>
                        </tr>}
                        {this.state.body.ranged_attack > 0 && <tr style={{backgroundColor: '#5d7fb2', color: '#fff'}}>
                            <td>Ranged Attack</td>
                            <td className="text-center">{this.getActionValueFormatted('ranged_attack', 'rangedAttack', 10)}/T</td>
                            <td className="text-center">{this.getActionValueFormatted('ranged_attack', 'rangedAttack', 10, this.creepLifespan())}/life</td>
                            <td className="text-center">{this.getActionValueFormatted('ranged_attack', 'rangedAttack', 10, this.ticksPerHour())}/hr</td>
                            <td className="text-center">{this.getActionValueFormatted('ranged_attack', 'rangedAttack', 10, this.ticksPerDay())}/day</td>
                        </tr>}
                        {this.state.body.ranged_attack > 0 && <tr style={{backgroundColor: '#5d7fb2', color: '#fff'}}>
                            <td>Mass Attack 1</td>
                            <td className="text-center">{this.getActionValueFormatted('ranged_attack', 'rangedMassAttack', 10)}/T</td>
                            <td className="text-center">{this.getActionValueFormatted('ranged_attack', 'rangedMassAttack', 10, this.creepLifespan())}/life</td>
                            <td className="text-center">{this.getActionValueFormatted('ranged_attack', 'rangedMassAttack', 10, this.ticksPerHour())}/hr</td>
                            <td className="text-center">{this.getActionValueFormatted('ranged_attack', 'rangedMassAttack', 10, this.ticksPerDay())}/day</td>
                        </tr>}
                        {this.state.body.ranged_attack > 0 && <tr style={{backgroundColor: '#5d7fb2', color: '#fff'}}>
                            <td>Mass Attack 2</td>
                            <td className="text-center">{this.getActionValueFormatted('ranged_attack', 'rangedMassAttack', 4)}/T</td>
                            <td className="text-center">{this.getActionValueFormatted('ranged_attack', 'rangedMassAttack', 4, this.creepLifespan())}/life</td>
                            <td className="text-center">{this.getActionValueFormatted('ranged_attack', 'rangedMassAttack', 4, this.ticksPerHour())}/hr</td>
                            <td className="text-center">{this.getActionValueFormatted('ranged_attack', 'rangedMassAttack', 4, this.ticksPerDay())}/day</td>
                        </tr>}
                        {this.state.body.ranged_attack > 0 && <tr style={{backgroundColor: '#5d7fb2', color: '#fff'}}>
                            <td>Mass Attack 3</td>
                            <td className="text-center">{this.getActionValueFormatted('ranged_attack', 'rangedMassAttack', 1)}/T</td>
                            <td className="text-center">{this.getActionValueFormatted('ranged_attack', 'rangedMassAttack', 1, this.creepLifespan())}/life</td>
                            <td className="text-center">{this.getActionValueFormatted('ranged_attack', 'rangedMassAttack', 1, this.ticksPerHour())}/hr</td>
                            <td className="text-center">{this.getActionValueFormatted('ranged_attack', 'rangedMassAttack', 1, this.ticksPerDay())}/day</td>
                        </tr>}
                        {this.state.body.heal > 0 && <tr style={{backgroundColor: '#65fd62', color: '#444'}}>
                            <td>Heal</td>
                            <td className="text-center">{this.getActionValueFormatted('heal', 'heal', 10)}/T</td>
                            <td className="text-center">{this.getActionValueFormatted('heal', 'heal', 10, this.creepLifespan())}/life</td>
                            <td className="text-center">{this.getActionValueFormatted('heal', 'heal', 10, this.ticksPerHour())}/hr</td>
                            <td className="text-center">{this.getActionValueFormatted('heal', 'heal', 10, this.ticksPerDay())}/day</td>
                        </tr>}
                        {this.state.body.heal > 0 && <tr style={{backgroundColor: '#65fd62', color: '#444'}}>
                            <td>Ranged Heal</td>
                            <td className="text-center">{this.getActionValueFormatted('heal', 'rangedHeal', 10)}/T</td>
                            <td className="text-center">{this.getActionValueFormatted('heal', 'rangedHeal', 10, this.creepLifespan())}/life</td>
                            <td className="text-center">{this.getActionValueFormatted('heal', 'rangedHeal', 10, this.ticksPerHour())}/hr</td>
                            <td className="text-center">{this.getActionValueFormatted('heal', 'rangedHeal', 10, this.ticksPerDay())}/day</td>
                        </tr>}
                        {this.state.body.carry > 0 && <tr style={{backgroundColor: '#efefef', color: '#444'}}>
                            <td>Carry</td>
                            <td className="text-center">{this.getActionValueFormatted('carry', 'capacity', 50)}/T</td>
                            <td className="text-center">{this.getActionValueFormatted('carry', 'capacity', 50, this.creepLifespan())}/life</td>
                            <td className="text-center">{this.getActionValueFormatted('carry', 'capacity', 50, this.ticksPerHour())}/hr</td>
                            <td className="text-center">{this.getActionValueFormatted('carry', 'capacity', 50, this.ticksPerDay())}/day</td>
                        </tr>}
                        {this.state.body.move > 0 && <tr style={{backgroundColor: '#a9b7c6', color: '#444'}}>
                            <td>Move on Plain{this.state.body.carry > 0 && ' (empty)'}</td>
                            <td colSpan={4} className="text-center">plain={this.walkTimeEmpty(this.state.body.move, this.state.body.carry, 1)} &nbsp; road={this.walkTimeEmpty(this.state.body.move, this.state.body.carry, 0.5)} &nbsp; swamp={this.walkTimeEmpty(this.state.body.move, this.state.body.carry, 5)}</td>
                        </tr>}
                        {this.state.body.move > 0 && this.state.body.carry > 0 && <tr style={{backgroundColor: '#a9b7c6', color: '#444'}}>
                            <td>Move on Plain (full)</td>
                            <td colSpan={4} className="text-center">plain={this.walkTimeFull(this.state.body.move, this.state.body.carry, 1)} &nbsp; road={this.walkTimeFull(this.state.body.move, this.state.body.carry, 0.5)} &nbsp; swamp={this.walkTimeFull(this.state.body.move, this.state.body.carry, 5)}</td>
                        </tr>}
                        </tbody>
                    </table>
                </div>}
            </div>
        );
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
);

function bodyPartCountToDeg(count: number) {
    return (count * 7.2) / 2;
}

function bodyPartWedge(startX: number, startY: number, startAngle: number, endAngle: number, radius: number) {
    var x1 = startX + radius * Math.cos(Math.PI * startAngle/180);
    var y1 = startY + radius * Math.sin(Math.PI * startAngle/180);
    var x2 = startX + radius * Math.cos(Math.PI * endAngle/180);
    var y2 = startY + radius * Math.sin(Math.PI * endAngle/180);
    
    let largeArc = 0;
    let travel = startAngle - endAngle;
    
    if (travel < -180) {
        largeArc = 1;
    }
    
    var pathString = "M"+ startX + " " + startY + " L" + x1 + " " + y1 + " A" + radius + " " + radius + " 0 " + largeArc + " 1 " + x2 + " " + y2 + " z";
    return pathString; 
}

/**
 * Game Constants
 */
const SPAWN_ENERGY_CAPACITY: number = 300;

const EXTENSION_ENERGY_CAPACITY: {[level: number]: number} = {
    0: 50,
    1: 50,
    2: 50,
    3: 50,
    4: 50,
    5: 50,
    6: 50,
    7: 100,
    8: 200
};

const CONTROLLER_STRUCTURES: {[structureType: string]: {[level: number]: number}} = {
    spawn: {0: 0, 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 2, 8: 3},
    extension: {0: 0, 1: 0, 2: 5, 3: 10, 4: 20, 5: 30, 6: 40, 7: 50, 8: 60},
};

const RCL_ENERGY: {[level: number]: number} = {
    1: 300,
    2: 550,
    3: 800,
    4: 1300,
    5: 1800,
    6: 2300,
    7: 5600,
    8: 12900
};

const BODYPART_COST: {[part: string]: number} = {
    move: 50,
    work: 100,
    attack: 80,
    carry: 50,
    heal: 250,
    ranged_attack: 150,
    tough: 10,
    claim: 600
};

const BODYPARTS: {[part: string]: string} = {
    tough: "TOUGH",
    move: "MOVE",
    work: "WORK",
    carry: "CARRY",
    attack: "ATTACK",
    ranged_attack: "RANGED_ATTACK",
    heal: "HEAL",
    claim: "CLAIM"
};

const BOOSTS: {[part: string]: {[resource: string]: {[method: string]: number}}} = {
    work: {
        UO: {
            harvest: 3
        },
        UHO2: {
            harvest: 5
        },
        XUHO2: {
            harvest: 7
        },
        LH: {
            build: 1.5,
            repair: 1.5
        },
        LH2O: {
            build: 1.8,
            repair: 1.8
        },
        XLH2O: {
            build: 2,
            repair: 2
        },
        ZH: {
            dismantle: 2
        },
        ZH2O: {
            dismantle: 3
        },
        XZH2O: {
            dismantle: 4
        },
        GH: {
            upgradeController: 1.5
        },
        GH2O: {
            upgradeController: 1.8
        },
        XGH2O: {
            upgradeController: 2
        }
    },
    attack: {
        UH: {
            attack: 2
        },
        UH2O: {
            attack: 3
        },
        XUH2O: {
            attack: 4
        }
    },
    ranged_attack: {
        KO: {
            rangedAttack: 2,
            rangedMassAttack: 2
        },
        KHO2: {
            rangedAttack: 3,
            rangedMassAttack: 3
        },
        XKHO2: {
            rangedAttack: 4,
            rangedMassAttack: 4
        }
    },
    heal: {
        LO: {
            heal: 2,
            rangedHeal: 2
        },
        LHO2: {
            heal: 3,
            rangedHeal: 3
        },
        XLHO2: {
            heal: 4,
            rangedHeal: 4
        }
    },
    carry: {
        KH: {
            capacity: 2
        },
        KH2O: {
            capacity: 3
        },
        XKH2O: {
            capacity: 4
        }
    },
    move: {
        ZO: {
            fatigue: 2
        },
        ZHO2: {
            fatigue: 3
        },
        XZHO2: {
            fatigue: 4
        }
    },
    tough: {
        GO: {
            damage: .7
        },
        GHO2: {
            damage: .5
        },
        XGHO2: {
            damage: .3
        }
    }
};