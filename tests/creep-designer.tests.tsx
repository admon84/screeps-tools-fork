import * as React from 'react';
import {shallow} from 'enzyme';
import Enzyme = require('enzyme');
import * as Adapter from 'enzyme-adapter-react-16';
import {CreepDesigner} from '../src/views/creep-designer';

describe('Creep Designer', () => {
    beforeAll(() => {
        Enzyme.configure({ adapter: new Adapter() });
    });
    
    it('should have 1 more part to begin with', () => {
        const designer = shallow(<CreepDesigner />);
        expect(designer.state().body.move).toEqual(1);
    });
    
    it('should work out the required RCL', () => {
        const designer = shallow(<CreepDesigner />);
        expect(designer.instance().requiredRCL()).toEqual(1);
        
        designer.instance().add('claim');
        expect(designer.instance().requiredRCL()).toEqual(3);
    });
    
    it('should import data', () => {
        const designer = shallow(<CreepDesigner />);
        
        designer.instance().import({
            target: {
                value: '[MOVE, WORK, CARRY]'
            }
        });
        expect(designer.state().body.carry).toEqual(1);
        
        designer.instance().import({
            target: {
                value: '[MOVE, WORK, CARRY, CARRY]'
            }
        });
        expect(designer.state().body.carry).toEqual(2);
    });
});