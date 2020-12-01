import * as bodyParser from 'body-parser';
import * as express from 'express';
import * as http from 'http';
import * as path from 'path';
import * as superAgent from 'superagent';

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: false }));

app.use('/app', express.static('public/app'));
app.use('/img', express.static('public/img'));

app.get('/api/shards/:world', (req, res) => {
    const path = (req.params.world == 'season' ? '/season' : '');
    const url = `https://screeps.com${path}/api/game/shards/info`;
    superAgent.get(url).end((err, agentRes) => {
        if (agentRes) {
            res.json(agentRes.body);
        } else {
            res.end();
        }
    });
});

app.get('/api/terrain/:world/:shard/:room', (req, res) => {
    const path = (req.params.world == 'season' ? '/season' : '');
    const url = `https://screeps.com${path}/api/game/room-terrain?room=${req.params.room}&encoded=1&shard=${req.params.shard}`;
    superAgent.get(url).end((err, agentRes) => {
        if (agentRes) {
            res.json(agentRes.body);
        } else {
            res.end();
        }
    });
});

app.get('/api/objects/:world/:shard/:room', (req, res) => {
    const path = (req.params.world == 'season' ? '/season' : '');
    const url = `https://screeps.com${path}/api/game/room-objects?room=${req.params.room}&shard=${req.params.shard}`;
    superAgent.get(url).end((err, agentRes) => {
        if (agentRes) {
            res.json(agentRes.body);
        } else {
            res.end();
        }
    });
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

const server = http.createServer(app);
server.listen(port);