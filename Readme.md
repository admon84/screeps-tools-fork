# Screeps Tools

Tools to help players of the Programming MMO Screeps.

This is a personalized fork of [Aracath/screeps-tools](https://github.com/Arcath/screeps-tools)


### Hosted Option

The hosted version is publicly available at [screeps.admon.dev](https://screeps.admon.dev)


### Building Planner

Plan out room layouts with the Building Planner tool.

Remake of the original [building planner by Dissi](http://screeps.dissi.me/)

Features:
* All structures including Factory
* Import rooms from any MMO shard with an option to include structures
* Importing rooms always includes the controller, source(s), and mineral when available
* Road structures are visually connected to adjacent roads like in game
* Hold left-click and drag to place many structures
* Hold right-click and drag to remove many structures
* Ramparts can be placed over structures easily

![View the building planner](https://user-images.githubusercontent.com/10291543/95763564-6a0a6700-0c6c-11eb-9eb8-7325b98a4437.png)


### Creep Designer

Configure Creeps body parts and evaluate stats with the Creep Designer tool.

Remake of the [screeps body calculator by o4kapuk](https://codepen.io/o4kapuk/full/ZKeorE)

Features:
* Stats are shown based on body parts added
* Creep actions are listed based on body parts added
* Body parts can be boosted using the Boost dropdown
* Stats calculated "per tick", "per unit count", "per hour" and "per day"
* Tick duration option affects stats calculated "per hour" and "per day"

![View the creep designer](https://user-images.githubusercontent.com/10291543/95763598-78f11980-0c6c-11eb-9303-362c962876e4.png)


## Development

You can compile the react app and run it locally.

### Requirements

Node.js v10 or higher

### Scripts

To begin, run `npm install` in your project directory to install node modules required for building and launching the react app.

Once you have installed the node modules, you can run any of these scripts in the project directory:

#### `npm run build`

Build lib/app.js (including any changes you make)

#### `npm run start`

Starts the web server.  View it at [http://localhost:3000](http://localhost:3000)

#### `npm run launch`

Builds the app and then starts the web server
