import * as React from 'react';
import {shallow} from 'enzyme';
import Enzyme = require('enzyme');
import * as Adapter from 'enzyme-adapter-react-16';
import {BuildingPlanner} from '../src/views/building-planner';

describe('Building Planner', () => {
    beforeAll(() => {
        Enzyme.configure({ adapter: new Adapter() });
    });
    
    it('should default to RCL8 on shard0', () => {
        const planner = shallow(<BuildingPlanner />);
        expect(planner.state().rcl).toEqual(8);

        expect(planner.state().shard).toEqual('shard0');
    });
    
    it('should select the right brush', () => {
        const planner = shallow(<BuildingPlanner />);
        expect(planner.state().brush).toEqual('spawn');

        planner.find('.brushes').childAt(2).simulate('click');
        expect(planner.state().brush).toEqual('extension');
    });
    
    it('should paint with the selected brush', () => {
        const planner = shallow(<BuildingPlanner />);
        expect(planner.state().brush).toEqual('spawn');

        planner.instance().addStructure(2,2);
        expect(planner.state().structures.spawn[0].x).toEqual(2);
    });
});